import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { StudyMaterialEditorShell } from '@/components/content-editor/study-materials/StudyMaterialEditorShell'

const { saveDraft, extractText } = vi.hoisted(() => ({
  saveDraft: vi.fn().mockResolvedValue({ id: 'aircraft-materials-introduction', status: 'DRAFT' }),
  extractText: vi.fn(),
}))
vi.mock('@/server/actions/study-material-editorial.actions', () => ({ saveStudyMaterialDraftAction: saveDraft }))
vi.mock('@/lib/study-material/document-import', () => ({
  extractTextFromStudyMaterialFile: extractText,
  supportedStudyMaterialImportExtensions: ['.txt', '.docx', '.pdf'],
}))

describe('study material editor conversion flow', () => {
  beforeEach(() => {
    extractText.mockReset()
  })

  it('exposes only Manual and Convert Text Document modes', () => {
    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Aircraft Materials')} resourceId="aircraft-materials-introduction" />)
    expect(screen.getByRole('tab', { name: /Manual/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Convert Text Document/i })).toBeInTheDocument()
    expect(screen.queryByText('Mastero AI')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Mastero/i })).not.toBeInTheDocument()
  })

  it('shows extracting and ready states for supported file uploads', async () => {
    let resolveFile: (value: string) => void
    extractText.mockImplementation(() => new Promise<string>((resolve) => {
      resolveFile = resolve
    }))

    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))

    const file = new File(['# Aircraft Materials\n\nFirst paragraph.'], 'sample.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [file] } })

    expect(screen.getByText(/Extracting/i)).toBeInTheDocument()

    resolveFile!('Sample extracted text')

    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Create Editable Material/i })).toBeInTheDocument()
  })

  it('shows an explicit error state for invalid uploads and clears it on the next valid upload', async () => {
    extractText
      .mockRejectedValueOnce(new Error('Unsupported file type. Supported formats: .txt, .docx, .pdf.'))
      .mockResolvedValueOnce('# Valid Upload\n\nUpdated content.')

    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))

    const invalidFile = new File(['abc'], 'invalid.md', { type: 'text/markdown' })
    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [invalidFile] } })

    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Unsupported file type'))
    expect(screen.queryByText('Import Preview')).not.toBeInTheDocument()

    const validFile = new File(['# Valid Upload'], 'sample.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [validFile] } })

    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Create Editable Material/i })).toBeInTheDocument()
  })

  it('supports consecutive uploads without page reload', async () => {
    extractText
      .mockResolvedValueOnce('# First Upload\n\nAlpha.')
      .mockResolvedValueOnce('# Second Upload\n\nBeta.')

    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))

    const first = new File(['# First Upload'], 'first.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [first] } })
    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))

    const second = new File(['# Second Upload'], 'second.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [second] } })

    await waitFor(() => expect(screen.getAllByText(/Second Upload/i).length).toBeGreaterThan(0))
    expect(screen.getByRole('button', { name: /Create Editable Material/i })).toBeInTheDocument()
  })

  it('switches from Manual to Convert and allows a supported upload', async () => {
    extractText.mockResolvedValue('# Converted Material\n\nImported content.')

    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))
    fireEvent.click(screen.getByRole('tab', { name: /Manual/i }))
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))

    fireEvent.change(screen.getByLabelText('Upload or select document'), { target: { files: [new File(['# Converted Material'], 'sample.txt', { type: 'text/plain' })] } })

    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Create Editable Material/i })).toBeInTheDocument()
  })

  it('opens import preview before converting into editable page-local blocks', async () => {
    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))
    const pasteInput = screen.getByRole('textbox', { name: 'Paste text' })
    fireEvent.change(pasteInput, { target: { value: '# Aircraft Materials\nAluminium alloys are used in lightweight structures.\n\n- Verify specification\n- Inspect for damage\n\nSummary\nReview approved material data.' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Convert' })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))

    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    expect(screen.getByText('Source file')).toBeInTheDocument()
    expect(screen.getByText('Proposed structure')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Create Editable Material/i }))

    await waitFor(() => expect(screen.getByRole('tab', { name: /Manual/i })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByRole('button', { name: /Page 1 Aircraft Materials/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Page 2 Aircraft Materials/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Page 3 Summary/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Page 2 Aircraft Materials/ }))
    expect(screen.getByRole('textbox', { name: /Paragraph/i })).toHaveValue('Aluminium alloys are used in lightweight structures.')
    expect(screen.getByRole('textbox', { name: /Items \(one per line\)/i })).toHaveValue('Verify specification\nInspect for damage')
    expect(screen.getAllByText('Summary').length).toBeGreaterThan(0)
  })

  it('shows an import preview before manual editing and creates the editable material', async () => {
    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Paste text' }), { target: { value: '# Aircraft Materials\nAluminium alloys are used in lightweight structures.\n\n- Verify specification\n- Inspect for damage\n\nSummary\nReview approved material data.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))

    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    expect(screen.getByText('Source file')).toBeInTheDocument()
    expect(screen.getByText('Proposed structure')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Editable Material/i })).toBeInTheDocument()

    const titleInput = screen.getByLabelText('Page title')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Editable Material/i }))

    await waitFor(() => expect(screen.getByRole('tab', { name: /Manual/i })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByRole('button', { name: /Page 1 Updated Title/ })).toBeInTheDocument()
  })

  it('saves the converted page-aware document without inventing blocks', async () => {
    render(<StudyMaterialEditorShell initialDoc={defaultAeroPrepStudyDocument('Original')} resourceId="aircraft-materials-introduction" />)
    fireEvent.click(screen.getByRole('tab', { name: /Convert Text Document/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Paste text' }), { target: { value: 'Imported title\n\nImported paragraph.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await waitFor(() => expect(screen.getByText('Import Preview')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Create Editable Material/i }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /Manual/i })).toHaveAttribute('aria-selected', 'true'))
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalled())
    const saved = saveDraft.mock.calls.at(-1)?.[1]
    expect(saved.pages).toHaveLength(3)
    expect(saved.pages[0].pageType).toBe('COVER')
    expect(saved.pages[1].pageType).toBe('CONTENT')
    expect(saved.pages[2].pageType).toBe('SUMMARY')
    expect(saved.pages[2].blocks).toHaveLength(0)
    expect(saved.pages.flatMap((page: { blocks: unknown[] }) => page.blocks)).toHaveLength(2)
  })
})
