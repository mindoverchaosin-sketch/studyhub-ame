import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const getMammothModule = async () => {
  if (typeof window !== 'undefined') {
    return await import('mammoth/mammoth.browser')
  }

  return await import('mammoth')
}

export const supportedStudyMaterialImportExtensions = ['.txt', '.docx', '.pdf'] as const

const normalizeExtractedText = (text: string): string => text
  .replace(/\u00a0/g, ' ')
  .replace(/\r\n?/g, '\n')
  .replace(/[\t ]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const isLikelyDocx = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
}

const isLikelyPdf = (buffer: ArrayBuffer): boolean => {
  const bytes = new TextDecoder('ascii', { fatal: false }).decode(buffer.slice(0, 5))
  return bytes.startsWith('%PDF-')
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    if (!isLikelyDocx(arrayBuffer)) {
      throw new Error('The file is not a valid DOCX document.')
    }

    const mammoth = await getMammothModule()
    const mammothInput = { arrayBuffer }
    const result = await mammoth.extractRawText(mammothInput)
    const text = normalizeExtractedText(result.value ?? '')
    if (!text) {
      throw new Error('The DOCX document did not contain readable text.')
    }
    return text
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read the DOCX file.'
    throw new Error(`Unable to read DOCX content. Please verify the file is a valid Word document. ${message}`)
  }
}

function getPdfWorkerSource(): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const workerPath = resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
      return pathToFileURL(workerPath).href
    }

    return new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
  } catch {
    return undefined
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    if (!isLikelyPdf(arrayBuffer)) {
      throw new Error('The file is not a valid PDF document.')
    }

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const workerSource = getPdfWorkerSource()

    if (workerSource && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSource
    }

    const pdf = await (pdfjs as { getDocument: (arg: { data: Uint8Array }) => { promise: Promise<unknown> } }).getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const totalPages = (pdf as { numPages: number }).numPages
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await (pdf as { getPage: (pageNumber: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }> }).getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (pageText) {
        pages.push(pageText)
      }
    }

    const extractedText = normalizeExtractedText(pages.join('\n\n'))
    if (!extractedText) {
      throw new Error('The PDF does not contain readable text.')
    }

    return extractedText
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The PDF could not be read.'
    throw new Error(`Unable to extract text from the PDF. Please upload a searchable PDF or a text-based document. ${message}`)
  }
}

export async function extractTextFromStudyMaterialFile(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file selected.')
  }

  const fileName = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (fileName.endsWith('.txt') || mime.includes('text/plain')) {
    const text = normalizeExtractedText(await file.text())
    if (!text) {
      throw new Error('The TXT file is empty.')
    }
    return text
  }

  if (fileName.endsWith('.docx') || mime.includes('wordprocessingml') || mime.includes('docx')) {
    return extractDocxText(file)
  }

  if (fileName.endsWith('.pdf') || mime.includes('pdf')) {
    return extractPdfText(file)
  }

  throw new Error(`Unsupported file type. Supported formats: ${supportedStudyMaterialImportExtensions.join(', ')}.`)
}
