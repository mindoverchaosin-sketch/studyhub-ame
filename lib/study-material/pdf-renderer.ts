import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { sanitizeStudyMaterialDocument, type StudyMaterialBlock, type StudyMaterialDocument } from './document-schema'

export type StudyMaterialPdfRenderOptions = {
  title?: string
  author?: string
  pageSize?: { width: number; height: number }
  margin?: { top: number; right: number; bottom: number; left: number }
}

const DEFAULT_PAGE_SIZE = { width: 595.28, height: 841.89 }
const DEFAULT_MARGIN = { top: 45.35, right: 50.99, bottom: 39.69, left: 50.99 }
const HEADER_HEIGHT = 39.69
const FOOTER_HEIGHT = 31.18

const TEXT_COLOR = rgb(0.12, 0.15, 0.2)
const MUTED_COLOR = rgb(0.42, 0.47, 0.56)
const LINE_COLOR = rgb(0.84, 0.87, 0.91)
const COVER_BG = rgb(0.92, 0.95, 1)
const CARD_BLUE = rgb(0.94, 0.97, 1)
const CARD_GREEN = rgb(0.93, 0.99, 0.95)
const CARD_AMBER = rgb(1, 0.97, 0.9)
const CARD_VIOLET = rgb(0.95, 0.92, 1)

function wrapText(font: PDFFont, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ['']

  const lines: string[] = []
  let current = words[0]

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${current} ${words[index]}`
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate
      continue
    }

    lines.push(current)
    current = words[index]
  }

  lines.push(current)
  return lines
}

export function normalizeComparableText(value: string): string {
  return value
    .replace(/[\u2014\u2013\u2012\-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function addHorizontalRule(page: PDFPage, y: number, startX: number, endX: number) {
  page.drawLine({
    start: { x: startX, y },
    end: { x: endX, y },
    thickness: 1,
    color: LINE_COLOR,
  })
}

function getContentWidth(pageSize: { width: number; height: number }, margin: { top: number; right: number; bottom: number; left: number }): number {
  return pageSize.width - margin.left - margin.right
}

export type PdfDocumentContext = {
  title?: string | null
  course?: string | null
  module?: string | null
  moduleNumber?: string | null
  submoduleNumber?: string | null
  lesson?: string | null
  pages: StudyMaterialDocument['pages']
}

export function buildModuleHeaderLabel(input: Pick<PdfDocumentContext, 'moduleNumber' | 'submoduleNumber'>): string {
  const moduleNumber = typeof input.moduleNumber === 'string' && input.moduleNumber.trim() ? input.moduleNumber.trim() : null
  const submoduleNumber = typeof input.submoduleNumber === 'string' && input.submoduleNumber.trim() ? input.submoduleNumber.trim() : null

  if (moduleNumber && submoduleNumber) return `MODULE ${moduleNumber} · ${submoduleNumber}`
  if (moduleNumber) return `MODULE ${moduleNumber}`
  if (submoduleNumber) return `MODULE ${submoduleNumber}`
  return ''
}

export function buildPdfDocumentContext(document: StudyMaterialDocument, overrides: Partial<PdfDocumentContext> = {}): PdfDocumentContext {
  const metadata = (document.metadata ?? {}) as Record<string, unknown>
  const moduleNumber = typeof overrides.moduleNumber === 'string' ? overrides.moduleNumber : typeof metadata.moduleNumber === 'string' ? metadata.moduleNumber : undefined
  const submoduleNumber = typeof overrides.submoduleNumber === 'string' ? overrides.submoduleNumber : typeof metadata.submoduleNumber === 'string' ? metadata.submoduleNumber : undefined

  return {
    title: overrides.title ?? document.title ?? null,
    course: overrides.course ?? (typeof metadata.course === 'string' ? metadata.course : undefined) ?? null,
    module: overrides.module ?? (typeof metadata.module === 'string' ? metadata.module : undefined) ?? null,
    moduleNumber: moduleNumber ?? null,
    submoduleNumber: submoduleNumber ?? null,
    lesson: overrides.lesson ?? (typeof metadata.lesson === 'string' ? metadata.lesson : undefined) ?? null,
    pages: document.pages.length > 0 ? document.pages : document.blocks.length > 0 ? [{ id: 'page-1', pageNumber: 1, pageType: 'CONTENT', title: document.title, blocks: document.blocks }] : [],
  }
}

export function isEquivalentHeadingText(pageTitle: string, headingText: string): boolean {
  const a = normalizeComparableText(pageTitle)
  const b = normalizeComparableText(headingText)
  return !!a && !!b && a === b
}

export function dropDuplicateLeadingHeading(page: StudyMaterialDocument['pages'][number]): StudyMaterialBlock[] {
  const title = (page.title ?? '').trim()
  const blocks = [...page.blocks]
  if (!title || blocks.length === 0) return blocks
  const first = blocks[0]
  if (first?.type === 'heading' && isEquivalentHeadingText(title, first.text)) {
    return blocks.slice(1)
  }
  return blocks
}

function getPageTypeSummary(pageType: string): string {
  switch (pageType) {
    case 'LEARNING_OBJECTIVES': return 'Learning Objectives'
    case 'EXAM_FOCUS': return 'Exam Focus'
    case 'QUICK_REVISION': return 'Quick Revision'
    case 'SUMMARY': return 'Summary'
    case 'DEFINITION': return 'Definition'
    case 'COMPARISON': return 'Comparison'
    case 'PROCESS': return 'Process'
    default: return 'Study Material'
  }
}

async function embedBrandLogo(pdfDoc: PDFDocument): Promise<PDFImage> {
  const logoPath = join(process.cwd(), 'public', 'brand', 'aeroprep-logo-master.png')
  const logoBytes = readFileSync(logoPath)
  return pdfDoc.embedPng(new Uint8Array(logoBytes))
}

function drawHeader(page: PDFPage, context: Pick<PdfDocumentContext, 'moduleNumber' | 'submoduleNumber'>, pageSize: { width: number; height: number }, margin: { top: number; right: number; bottom: number; left: number }, logoImage?: PDFImage, font?: PDFFont, boldFont?: PDFFont) {
  const logoWidth = 54
  const logoHeight = 18
  const logoX = margin.left
  const logoY = pageSize.height - margin.top - 12

  if (logoImage) {
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY - logoHeight,
      width: logoWidth,
      height: logoHeight,
    })
  }

  const moduleLabel = buildModuleHeaderLabel(context)
  if (moduleLabel && boldFont) {
    const labelWidth = boldFont.widthOfTextAtSize(moduleLabel, 9)
    page.drawText(moduleLabel, {
      x: pageSize.width - margin.right - labelWidth,
      y: logoY - 10,
      size: 9,
      font: boldFont,
      color: TEXT_COLOR,
    })
  }

  addHorizontalRule(page, pageSize.height - margin.top - 28, margin.left, pageSize.width - margin.right)
}

function drawFooter(page: PDFPage, pageNumber: number, pageSize: { width: number; height: number }, margin: { top: number; right: number; bottom: number; left: number }, font: PDFFont) {
  addHorizontalRule(page, margin.bottom + 12, margin.left, pageSize.width - margin.right)
  page.drawText('AeroPrep', {
    x: margin.left,
    y: margin.bottom + 2,
    size: 8,
    font,
    color: MUTED_COLOR,
  })
  page.drawText(String(pageNumber), {
    x: pageSize.width - margin.right - 14,
    y: margin.bottom + 2,
    size: 8,
    font,
    color: MUTED_COLOR,
  })
}

function getCardColors(block: StudyMaterialBlock): { fill: ReturnType<typeof rgb>; stroke: ReturnType<typeof rgb>; text: ReturnType<typeof rgb> } {
  switch (block.type) {
    case 'callout':
      return { fill: CARD_AMBER, stroke: rgb(0.85, 0.68, 0.18), text: rgb(0.56, 0.35, 0.05) }
    case 'definition':
      return { fill: CARD_BLUE, stroke: rgb(0.43, 0.62, 0.95), text: rgb(0.11, 0.31, 0.68) }
    case 'example':
      return { fill: CARD_GREEN, stroke: rgb(0.17, 0.7, 0.42), text: rgb(0.08, 0.46, 0.27) }
    case 'examTip':
      return { fill: CARD_VIOLET, stroke: rgb(0.51, 0.32, 0.72), text: rgb(0.34, 0.18, 0.52) }
    default:
      return { fill: rgb(1, 1, 1), stroke: LINE_COLOR, text: TEXT_COLOR }
  }
}

function measureBlockHeight(block: StudyMaterialBlock, font: PDFFont, boldFont: PDFFont, contentWidth: number): number {
  switch (block.type) {
    case 'heading':
      return 30
    case 'paragraph': {
      const totalText = block.children.map((child) => child.text).join(' ')
      const lineCount = Math.max(1, wrapText(font, totalText, contentWidth, 10.5).length)
      return lineCount * 13 + 8
    }
    case 'list': {
      const itemText = block.items.map((item, index) => `${block.listType === 'numbered' ? `${index + 1}.` : '•'} ${item}`)
      const totalLines = itemText.reduce((count, item) => count + wrapText(font, item, contentWidth - 12, 10.5).length, 0)
      return Math.max(22, totalLines * 12 + 12)
    }
    case 'table': {
      const bodyRows = Math.max(1, block.rows.length)
      return bodyRows * 16 + 28
    }
    case 'image':
      return 120
    case 'callout':
      return 56
    case 'definition':
      return 58
    case 'example':
      return 60
    case 'examTip':
      return 38
    case 'link':
      return 18
    default:
      return 18
  }
}

function drawParagraph(page: PDFPage, block: Extract<StudyMaterialBlock, { type: 'paragraph' }>, x: number, y: number, width: number, font: PDFFont): number {
  const text = block.children.map((child) => child.text).join(' ')
  const lines = wrapText(font, text, width, 10.5)
  for (const line of lines) {
    page.drawText(line, { x, y, size: 10.5, font, color: TEXT_COLOR })
    y -= 13
  }
  return y - 4
}

function drawList(page: PDFPage, block: Extract<StudyMaterialBlock, { type: 'list' }>, x: number, y: number, width: number, font: PDFFont): number {
  const items = block.items.map((item, index) => ({
    text: block.listType === 'numbered' ? `${index + 1}. ${item}` : `• ${item}`,
    width: width - 12,
  }))

  for (const item of items) {
    const lines = wrapText(font, item.text, item.width, 10.5)
    for (const line of lines) {
      page.drawText(line, { x: x + 8, y, size: 10.5, font, color: TEXT_COLOR })
      y -= 13
    }
  }
  return y - 8
}

function drawTable(page: PDFPage, block: Extract<StudyMaterialBlock, { type: 'table' }>, x: number, y: number, width: number, font: PDFFont, boldFont: PDFFont): number {
  const headerHeight = 18
  const rowHeight = 16
  const columnWidth = width / Math.max(block.headers.length, 1)
  let currentRowY = y

  page.drawRectangle({
    x,
    y: currentRowY - headerHeight,
    width,
    height: headerHeight,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.79, 0.82, 0.86),
    borderWidth: 0.5,
  })

  for (let headerIndex = 0; headerIndex < block.headers.length; headerIndex += 1) {
    const cellX = x + columnWidth * headerIndex
    page.drawText(block.headers[headerIndex], {
      x: cellX + 6,
      y: currentRowY - 13,
      size: 9,
      font: boldFont,
      color: TEXT_COLOR,
    })
  }
  currentRowY -= headerHeight

  for (let rowIndex = 0; rowIndex < block.rows.length; rowIndex += 1) {
    const row = block.rows[rowIndex]
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const cellX = x + columnWidth * colIndex
      page.drawRectangle({
        x: cellX,
        y: currentRowY - rowHeight,
        width: columnWidth,
        height: rowHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.79, 0.82, 0.86),
        borderWidth: 0.5,
      })
      page.drawText(String(row[colIndex] ?? ''), {
        x: cellX + 6,
        y: currentRowY - 12,
        size: 8.5,
        font,
        color: TEXT_COLOR,
      })
    }
    currentRowY -= rowHeight
  }
  return currentRowY - 10
}

function drawImageBlock(page: PDFPage, block: Extract<StudyMaterialBlock, { type: 'image' }>, x: number, y: number, width: number, font: PDFFont, image?: PDFImage): number {
  const aspectHeight = 84
  const height = aspectHeight

  if (image) {
    page.drawImage(image, { x, y: y - height, width, height })
  } else {
    page.drawRectangle({ x, y: y - height, width, height, color: rgb(0.96, 0.97, 1), borderColor: rgb(0.81, 0.84, 0.9), borderWidth: 1 })
  }

  if (block.altText) {
    page.drawText(block.altText, { x: x + 10, y: y - height - 14, size: 8, font, color: MUTED_COLOR })
  }
  if (block.caption) {
    page.drawText(block.caption, { x: x + 10, y: y - height - 26, size: 8, font, color: MUTED_COLOR })
  }
  return y - height - 30
}

function drawInformationalBlock(page: PDFPage, block: StudyMaterialBlock, x: number, y: number, width: number, font: PDFFont, boldFont: PDFFont): number {
  const colors = getCardColors(block)
  const boxHeight = block.type === 'examTip' ? 34 : 42
  page.drawRectangle({ x, y: y - boxHeight, width, height: boxHeight, color: colors.fill, borderColor: colors.stroke, borderWidth: 1 })

  if (block.type === 'callout' || block.type === 'example' || block.type === 'definition') {
    const label = block.type === 'callout' ? (block.title || 'Important') : block.type === 'example' ? (block.title || 'Example') : 'Definition'
    page.drawText(label, { x: x + 10, y: y - 15, size: 9.5, font: boldFont, color: colors.text })
  }

  const contentText = (() => {
    switch (block.type) {
      case 'callout':
        return block.text
      case 'definition':
        return block.definition
      case 'example':
        return block.content
      default:
        return 'text' in block ? block.text : ''
    }
  })()
  page.drawText(contentText, { x: x + 10, y: y - 28, size: 9.5, font, color: colors.text })

  if (block.type === 'definition') {
    page.drawText(block.term, { x: x + 10, y: y - 15, size: 10, font: boldFont, color: colors.text })
  }

  return y - boxHeight - 8
}

function drawBlock(page: PDFPage, block: StudyMaterialBlock, x: number, y: number, width: number, font: PDFFont, boldFont: PDFFont, image?: PDFImage): number {
  switch (block.type) {
    case 'heading': {
      const lines = wrapText(boldFont, block.text, width, 15)
      let currentY = y
      for (const line of lines) {
        page.drawText(line, { x, y: currentY, size: 15, font: boldFont, color: TEXT_COLOR })
        currentY -= 17
      }
      return currentY - 6
    }
    case 'paragraph':
      return drawParagraph(page, block, x, y, width, font)
    case 'list':
      return drawList(page, block, x, y, width, font)
    case 'table':
      return drawTable(page, block, x, y, width, font, boldFont)
    case 'image':
      return drawImageBlock(page, block, x, y, width, font, image)
    case 'callout':
    case 'definition':
    case 'example':
    case 'examTip':
      return drawInformationalBlock(page, block, x, y, width, font, boldFont)
    case 'link': {
      page.drawText(block.text, { x, y, size: 10, font, color: rgb(0.06, 0.45, 0.82) })
      return y - 16
    }
    default:
      return y - 16
  }
}

function renderCoverPage(pdfDoc: PDFDocument, document: StudyMaterialDocument, context: PdfDocumentContext, options: Required<StudyMaterialPdfRenderOptions>, font: PDFFont, boldFont: PDFFont, logoImage?: PDFImage) {
  const { pageSize, margin } = options
  const page = pdfDoc.addPage([pageSize.width, pageSize.height])

  page.drawRectangle({ x: 0, y: 0, width: pageSize.width, height: pageSize.height, color: COVER_BG })

  if (logoImage) {
    page.drawImage(logoImage, {
      x: margin.left,
      y: pageSize.height - margin.top - 44,
      width: 72,
      height: 24,
    })
  }

  const moduleLabel = buildModuleHeaderLabel(context)
  if (moduleLabel) {
    page.drawText(moduleLabel, {
      x: pageSize.width - margin.right - boldFont.widthOfTextAtSize(moduleLabel, 11),
      y: pageSize.height - margin.top - 28,
      size: 11,
      font: boldFont,
      color: TEXT_COLOR,
    })
  }

  const docTitle = document.title || 'Study Material'
  const titleX = margin.left
  const titleStartY = pageSize.height - margin.top - 100
  const titleLines = wrapText(boldFont, docTitle, pageSize.width - margin.left - margin.right, 28)
  let currentY = titleStartY
  for (const line of titleLines) {
    page.drawText(line, { x: titleX, y: currentY, size: 28, font: boldFont, color: TEXT_COLOR })
    currentY -= 30
  }

  currentY -= 10
  page.drawRectangle({
    x: margin.left,
    y: currentY - 72,
    width: pageSize.width - margin.left - margin.right,
    height: 84,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  })

  const courseLine = context.course || 'Aircraft Maintenance'
  const lessonLine = context.lesson ? `Lesson: ${context.lesson}` : 'Course / category: Aircraft Maintenance'
  page.drawText(courseLine, { x: margin.left + 18, y: currentY - 12, size: 11, font, color: MUTED_COLOR })
  page.drawText(lessonLine, { x: margin.left + 18, y: currentY - 30, size: 11, font, color: MUTED_COLOR })
  page.drawText('AeroPrep', { x: margin.left + 18, y: currentY - 48, size: 10, font: boldFont, color: TEXT_COLOR })

  drawFooter(page, 1, pageSize, margin, font)
}

function renderContentPage(pdfDoc: PDFDocument, pageContent: StudyMaterialDocument['pages'][number], pageNumber: number, options: Required<StudyMaterialPdfRenderOptions> & { context: PdfDocumentContext }, font: PDFFont, boldFont: PDFFont, logoImage?: PDFImage) {
  const margin = options.margin
  const pageSize = options.pageSize
  const contentWidth = getContentWidth(pageSize, margin)
  const headerTop = pageSize.height - margin.top - HEADER_HEIGHT
  const minContentY = margin.bottom + FOOTER_HEIGHT + 12

  let page = pdfDoc.addPage([pageSize.width, pageSize.height])
  let y = headerTop - 8

  const visibleBlocks = dropDuplicateLeadingHeading(pageContent)
  const shouldRenderPageTitle = !!pageContent.title && (!visibleBlocks[0] || visibleBlocks[0].type !== 'heading' || !isEquivalentHeadingText(pageContent.title, visibleBlocks[0].type === 'heading' ? visibleBlocks[0].text : ''))

  drawHeader(page, {
    moduleNumber: options.context.moduleNumber,
    submoduleNumber: options.context.submoduleNumber,
  }, pageSize, margin, logoImage, font, boldFont)

  if (shouldRenderPageTitle) {
    const titleLines = wrapText(boldFont, pageContent.title, contentWidth, 15)
    for (const line of titleLines) {
      page.drawText(line, { x: margin.left, y, size: 15, font: boldFont, color: TEXT_COLOR })
      y -= 18
    }
    y -= 8
  }

  for (const block of visibleBlocks) {
    const blockHeight = measureBlockHeight(block, font, boldFont, contentWidth)
    if (y - blockHeight < minContentY) {
      drawFooter(page, pageNumber, pageSize, margin, font)
      page = pdfDoc.addPage([pageSize.width, pageSize.height])
      y = headerTop - 8
      drawHeader(page, {
        moduleNumber: options.context.moduleNumber,
        submoduleNumber: options.context.submoduleNumber,
      }, pageSize, margin, logoImage, font, boldFont)
      if (shouldRenderPageTitle) {
        const titleLines = wrapText(boldFont, pageContent.title, contentWidth, 15)
        for (const line of titleLines) {
          page.drawText(line, { x: margin.left, y, size: 15, font: boldFont, color: TEXT_COLOR })
          y -= 18
        }
        y -= 8
      }
    }

    if (block.type === 'heading' && y - 26 < minContentY) {
      drawFooter(page, pageNumber, pageSize, margin, font)
      page = pdfDoc.addPage([pageSize.width, pageSize.height])
      y = headerTop - 8
      drawHeader(page, {
        moduleNumber: options.context.moduleNumber,
        submoduleNumber: options.context.submoduleNumber,
      }, pageSize, margin, logoImage, font, boldFont)
    }

    const newY = drawBlock(page, block, margin.left, y, contentWidth, font, boldFont)
    y = newY - 10
  }

  drawFooter(page, pageNumber, pageSize, margin, font)
}

export async function renderStudyMaterialPdf(document: StudyMaterialDocument, options: StudyMaterialPdfRenderOptions & { context?: Partial<PdfDocumentContext> } = {}): Promise<Uint8Array> {
  const normalized = sanitizeStudyMaterialDocument(document)
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const margin = options.margin ?? DEFAULT_MARGIN
  const context = buildPdfDocumentContext(normalized, options.context ?? {})
  const resolvedOptions: Required<StudyMaterialPdfRenderOptions> & { context: PdfDocumentContext } = {
    title: options.title ?? normalized.title,
    author: options.author ?? 'AeroPrep',
    pageSize,
    margin,
    context,
  }

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const logoImage = await embedBrandLogo(pdfDoc)

  const pages: StudyMaterialDocument['pages'] = context.pages.length > 0 ? context.pages : [{ id: 'page-1', pageNumber: 1, pageType: 'CONTENT', title: normalized.title, blocks: normalized.blocks ?? [] }]

  let physicalPageNumber = 1
  for (let index = 0; index < pages.length; index += 1) {
    const pageContent = pages[index]
    if (pageContent.pageType === 'COVER') {
      renderCoverPage(pdfDoc, normalized, context, resolvedOptions, font, boldFont, logoImage)
      physicalPageNumber += 1
      continue
    }

    renderContentPage(pdfDoc, pageContent, physicalPageNumber, resolvedOptions, font, boldFont, logoImage)
    physicalPageNumber += 1
  }

  const bytes = await pdfDoc.save()
  return bytes
}
