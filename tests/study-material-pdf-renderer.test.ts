import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { buildModuleHeaderLabel, buildPdfDocumentContext, renderStudyMaterialPdf } from '@/lib/study-material/pdf-renderer'

describe('study material pdf renderer', () => {
  it('creates a deterministic A4 PDF from the page-aware document model', async () => {
    const document = defaultAeroPrepStudyDocument('Aircraft systems')
    const bytes = await renderStudyMaterialPdf(document)

    expect(bytes.length).toBeGreaterThan(100)

    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    const page = pdf.getPage(0)
    expect(page.getSize().width).toBeCloseTo(595.28, 1)
    expect(page.getSize().height).toBeCloseTo(841.89, 1)
  })

  it('uses the canonical module and submodule metadata for the PDF header label', () => {
    const document = {
      ...defaultAeroPrepStudyDocument('Aircraft systems'),
      metadata: {
        ...defaultAeroPrepStudyDocument('Aircraft systems').metadata,
        moduleNumber: '14',
        submoduleNumber: '14.1',
      },
    }

    const context = buildPdfDocumentContext(document)
    expect(context.moduleNumber).toBe('14')
    expect(context.submoduleNumber).toBe('14.1')
    expect(buildModuleHeaderLabel(context)).toBe('MODULE 14 · 14.1')

    const fallbackContext = buildPdfDocumentContext(document, { moduleNumber: '4', submoduleNumber: '4.1' })
    expect(buildModuleHeaderLabel(fallbackContext)).toBe('MODULE 4 · 4.1')
  })
})
