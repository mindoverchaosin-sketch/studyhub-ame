import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { assertBrandingLocked, sanitizeStudyMaterialDocument, studyMaterialBlockSchema, type StudyMaterialDocument } from '@/lib/study-material/document-schema'
import { StudyMaterialWebRenderer } from '@/components/study-materials/StudyMaterialWebRenderer'
import { buildPdfDocumentContext, renderStudyMaterialPdf } from '@/lib/study-material/pdf-renderer'

describe('study material document contracts', () => {
  it('validates every approved block and preserves stable ids', () => {
    const blocks = [
      { id: 'h1', type: 'heading', level: 1, text: 'Heading' },
      { id: 'p1', type: 'paragraph', children: [{ text: 'Paragraph', format: [] }] },
      { id: 'l1', type: 'list', listType: 'numbered', items: ['One'] },
      { id: 't1', type: 'table', headers: ['A'], rows: [['B']] },
      { id: 'i1', type: 'image', mediaId: 'asset-1', altText: 'Aircraft' },
      { id: 'c1', type: 'callout', variant: 'tip', title: 'Tip', text: 'Read this' },
      { id: 'd1', type: 'definition', term: 'Lift', definition: 'A force' },
      { id: 'e1', type: 'example', content: 'Example' },
      { id: 'x1', type: 'examTip', text: 'Remember this' },
      { id: 'a1', type: 'link', text: 'Reference', url: 'https://example.com' },
    ]
    expect(blocks.map((block) => studyMaterialBlockSchema.parse(block).id)).toEqual(['h1', 'p1', 'l1', 't1', 'i1', 'c1', 'd1', 'e1', 'x1', 'a1'])
    expect(() => studyMaterialBlockSchema.parse({ id: 'bad', type: 'image', mediaId: '', altText: '' })).not.toThrow()
    expect(() => studyMaterialBlockSchema.parse({ id: 'bad', type: 'link', text: 'bad', url: 'not-a-url' })).toThrow()
  })

  it('normalizes the legacy document format into a page-aware structure', () => {
    const legacy = {
      schemaVersion: 1,
      documentType: 'AEROPREP_STUDY_MATERIAL',
      title: 'Legacy material',
      metadata: { status: 'DRAFT' },
      blocks: [{ id: 'legacy-1', type: 'paragraph', children: [{ text: 'Legacy paragraph', format: [] }] }],
      branding: { systemControlled: true, locked: true },
    }

    const normalized = sanitizeStudyMaterialDocument(legacy)
    expect(normalized.pages).toHaveLength(1)
    expect(normalized.pages[0].pageNumber).toBe(1)
    expect(normalized.pages[0].blocks).toHaveLength(1)
    expect(normalized.pages[0].blocks[0].id).toBe('legacy-1')
  })

  it('protects branding and sanitizes a document before rendering', () => {
    const document = defaultAeroPrepStudyDocument('Flight controls')
    expect(sanitizeStudyMaterialDocument(document).branding).toEqual({ systemControlled: true, locked: true })
    expect(() => assertBrandingLocked({ branding: { systemControlled: false, locked: false } })).toThrow('system-managed')
    expect(() => sanitizeStudyMaterialDocument({ ...document, branding: { systemControlled: false, locked: true } })).toThrow('system-managed')
  })

  it('renders the fixed AeroPrep shell, page marker, and media reference without editable branding', () => {
    const baseDocument = defaultAeroPrepStudyDocument('Aircraft systems')
    const imageBlock: StudyMaterialDocument['pages'][number]['blocks'][number] = {
      id: 'image-1',
      type: 'image',
      mediaId: 'asset-7',
      mediaKey: 'media/aircraft.webp',
      altText: 'Aircraft',
      alignment: 'center',
    }

    const document: StudyMaterialDocument = {
      ...baseDocument,
      pages: [{
        ...baseDocument.pages[0],
        blocks: [imageBlock],
      }],
      blocks: [imageBlock],
    }

    render(createElement(StudyMaterialWebRenderer, { document }))
    expect(screen.getByText('AEROPREP')).toBeInTheDocument()
    expect(screen.getByText('LEARN • PRACTICE • GET LICENSED')).toBeInTheDocument()
    expect(screen.getByText('Page 1')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Aircraft' })).toHaveAttribute('src', '/media/media/aircraft.webp')
  })

  it('round-trips a realistic multi-page material through web delivery and PDF export', async () => {
    const document: StudyMaterialDocument = {
      schemaVersion: 1,
      documentType: 'AEROPREP_STUDY_MATERIAL',
      title: 'Aircraft Materials: Structures and Inspection',
      metadata: {
        status: 'DRAFT',
        module: 'Airframes',
        moduleNumber: '4',
        submoduleNumber: '4.1',
        lesson: 'Materials and Structures',
        course: 'AME Category B1',
      },
      pages: [
        {
          id: 'workflow-cover', pageNumber: 1, pageType: 'COVER', title: 'Aircraft Materials',
          blocks: [
            { id: 'cover-heading', type: 'heading', level: 1, text: 'Aircraft Materials' },
            { id: 'cover-paragraph', type: 'paragraph', children: [{ text: 'A practical guide to material selection and inspection.', format: [] }] },
          ],
        },
        {
          id: 'workflow-content', pageNumber: 2, pageType: 'CONTENT', title: 'Material Families',
          blocks: [
            { id: 'content-definition', type: 'definition', term: 'Alloy', definition: 'A metallic material formed by combining elements to improve useful properties.' },
            { id: 'content-list', type: 'list', listType: 'bullet', items: ['Aluminium alloys', 'Steel alloys', 'Titanium alloys'] },
            { id: 'content-table', type: 'table', headers: ['Material', 'Typical use'], rows: [['Aluminium', 'Lightweight structures'], ['Titanium', 'High-temperature areas']] },
            { id: 'content-callout', type: 'callout', variant: 'important', title: 'Inspection focus', text: 'Always verify the approved material specification before repair.' },
          ],
        },
        {
          id: 'workflow-exam', pageNumber: 3, pageType: 'EXAM_FOCUS', title: 'Exam Focus',
          blocks: [
            { id: 'exam-tip', type: 'examTip', text: 'Exam tip: connect material properties to the aircraft location and maintenance action.' },
            { id: 'exam-paragraph', type: 'paragraph', children: [{ text: 'Record the page-local inspection result before moving to the next task.', format: [] }] },
          ],
        },
      ],
      blocks: [],
      branding: { systemControlled: true, locked: true },
    }

    const reopened = sanitizeStudyMaterialDocument(JSON.parse(JSON.stringify(document)))
    expect(reopened.pages.map((page) => page.pageType)).toEqual(['COVER', 'CONTENT', 'EXAM_FOCUS'])
    expect(reopened.pages.map((page) => page.title)).toEqual(['Aircraft Materials', 'Material Families', 'Exam Focus'])
    expect(reopened.pages.map((page) => page.blocks.map((block) => block.id))).toEqual([
      ['cover-heading', 'cover-paragraph'],
      ['content-definition', 'content-list', 'content-table', 'content-callout'],
      ['exam-tip', 'exam-paragraph'],
    ])

    render(createElement(StudyMaterialWebRenderer, { document: reopened }))
    expect(screen.getAllByText('Aircraft Materials')).toHaveLength(2)
    expect(screen.getAllByText('Material Families')).toHaveLength(1)
    expect(screen.getAllByText('Exam Focus')).toHaveLength(1)
    expect(screen.getAllByText('Aluminium alloys')).toHaveLength(1)
    expect(screen.getAllByText(/Exam tip:/)).toHaveLength(1)
    expect(screen.getAllByText('Airframes · 4.1')).toHaveLength(3)
    expect(screen.queryByText('Mastero AI')).not.toBeInTheDocument()
    expect(screen.queryByText('Save Draft')).not.toBeInTheDocument()

    const context = buildPdfDocumentContext(reopened)
    expect(context.pages.map((page) => page.id)).toEqual(['workflow-cover', 'workflow-content', 'workflow-exam'])
    expect(context.moduleNumber).toBe('4')
    expect(context.submoduleNumber).toBe('4.1')
    const pdfBytes = await renderStudyMaterialPdf(reopened)
    expect(pdfBytes.byteLength).toBeGreaterThan(0)
  })
})

describe('study material document service', () => {
  beforeEach(() => { vi.resetModules() })

  it('creates and saves a validated draft snapshot', async () => {
    const resourceRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'resource-1', documentVersion: 1, status: 'DRAFT', lastReviewedAt: null }),
      update: vi.fn().mockResolvedValue({ id: 'resource-1', documentVersion: 1, status: 'DRAFT' }),
    }
    const workflowRepository = { update: vi.fn().mockResolvedValue(undefined) }
    vi.doMock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
    vi.doMock('@/server/repositories/editorial-workflow.repository', () => ({ editorialWorkflowRepository: workflowRepository }))
    vi.doMock('@/server/services/editorial-workflow.service', () => ({
      getStudyMaterialEditorialWorkflow: vi.fn().mockResolvedValue({ status: 'DRAFT', currentVersion: 1, versions: [], reviewQueue: [] }),
      createVersionSnapshotForTarget: vi.fn().mockResolvedValue({ version: 2 }),
    }))
    vi.doMock('@/server/services/publishing.service', () => ({ publishingService: { submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn() } }))
    const { StudyMaterialDocumentService } = await import('@/server/services/study-material-document.service')
    const service = new StudyMaterialDocumentService()
    const draft = await service.createDraftDocument({ title: 'Draft' })
    await service.saveDraft('resource-1', draft)
    expect(resourceRepository.update).toHaveBeenCalledWith('resource-1', expect.objectContaining({ documentContent: draft, documentVersion: 2, status: 'DRAFT' }))
  })
})
