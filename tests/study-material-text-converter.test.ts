import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import JSZip from 'jszip'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { convertTextDocumentToStudyMaterial } from '@/lib/study-material/text-document-converter'
import { extractTextFromStudyMaterialFile, supportedStudyMaterialImportExtensions } from '@/lib/study-material/document-import'

describe('text document converter', () => {
  it('preserves plain text structure without generating technical content', () => {
    const document = convertTextDocumentToStudyMaterial('# Aircraft Materials\nAluminium alloys are lightweight.\n\n- Verify specification\n- Inspect for damage\n\nSummary\nReview approved data.')

    expect(document.pages.map((page) => page.pageType)).toEqual(['COVER', 'CONTENT', 'SUMMARY'])
    expect(document.pages[0].title).toBe('Aircraft Materials')
    expect(document.pages[1].blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'paragraph' }),
      expect.objectContaining({ type: 'list', items: ['Verify specification', 'Inspect for damage'] }),
    ]))
    expect(document.pages[2].blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'heading', text: 'Summary' }),
      expect.objectContaining({ type: 'paragraph', children: [{ text: 'Review approved data.', format: [] }] }),
    ]))
    expect(JSON.stringify(document)).not.toContain('Exam tip')
    expect(JSON.stringify(document)).not.toContain('Important')
  })

  it('recognizes simple pipe tables and normalizes page-local blocks', () => {
    const document = convertTextDocumentToStudyMaterial('Material table\n\nMaterial | Use\nAluminium | Structures')
    expect(document.pages).toHaveLength(3)
    expect(document.pages[1].blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'table', headers: ['Material', 'Use'], rows: [['Aluminium', 'Structures']] }),
    ]))
    expect(document.blocks).toHaveLength(document.pages.flatMap((page) => page.blocks).length)
  })

  it('supports txt, docx, and pdf imports with the same deterministic conversion flow', async () => {
    expect(supportedStudyMaterialImportExtensions).toEqual(['.txt', '.docx', '.pdf'])

    const txtFile = new File(['# Aircraft Materials\n\nSummary\nReview approved data.'], 'aircraft.txt', { type: 'text/plain' })
    await expect(extractTextFromStudyMaterialFile(txtFile)).resolves.toContain('Review approved data.')

    const docxZip = new JSZip()
    docxZip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
    docxZip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
    docxZip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Aircraft Materials</w:t></w:r></w:p><w:p><w:r><w:t>Aluminium alloys are lightweight.</w:t></w:r></w:p><w:p><w:r><w:t>Verify specification</w:t></w:r></w:p><w:p><w:r><w:t>Inspect for damage</w:t></w:r></w:p><w:p><w:r><w:t>Summary</w:t></w:r></w:p><w:p><w:r><w:t>Review approved data.</w:t></w:r></w:p></w:body></w:document>')
    const validDocxBytes = await docxZip.generateAsync({ type: 'uint8array' })
    const validDocxBuffer = validDocxBytes.buffer.slice(validDocxBytes.byteOffset, validDocxBytes.byteOffset + validDocxBytes.byteLength) as ArrayBuffer
    const validDocxFile = new File([validDocxBuffer], 'sample.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const actualDocxText = await extractTextFromStudyMaterialFile(validDocxFile)
    expect(actualDocxText).toContain('Aircraft Materials')
    expect(actualDocxText).toContain('Review approved data.')
    expect(actualDocxText).not.toContain('Could not find file in options')
    expect(actualDocxText.length).toBeGreaterThan(0)
    await expect(extractTextFromStudyMaterialFile(validDocxFile)).resolves.toContain('Aircraft Materials')
    await expect(extractTextFromStudyMaterialFile(validDocxFile)).resolves.toContain('Review approved data.')

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 420])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    page.drawText('Aircraft Materials', { x: 50, y: 340, size: 22, font })
    page.drawText('Aluminium alloys are lightweight.', { x: 50, y: 300, size: 12, font })
    page.drawText('Verify specification', { x: 50, y: 280, size: 12, font })
    page.drawText('Inspect for damage', { x: 50, y: 260, size: 12, font })
    page.drawText('Review approved data.', { x: 50, y: 240, size: 12, font })
    const validPdfBytes = await pdfDoc.save()
    const validPdfBuffer = validPdfBytes.buffer.slice(validPdfBytes.byteOffset, validPdfBytes.byteOffset + validPdfBytes.byteLength) as ArrayBuffer
    const validPdfFile = new File([validPdfBuffer], 'sample.pdf', { type: 'application/pdf' })
    await expect(extractTextFromStudyMaterialFile(validPdfFile)).resolves.toContain('Aircraft Materials')

    const docxFile = new File(['not-valid-docx'], 'aircraft.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    await expect(extractTextFromStudyMaterialFile(docxFile)).rejects.toThrow(/DOCX|document/i)
  }, 30000)
})
