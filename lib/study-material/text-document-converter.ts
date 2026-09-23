import type { StudyMaterialBlock, StudyMaterialDocument, StudyMaterialPage } from './document-schema'
import { normalizeStudyMaterialDocument } from './document-schema'

const createId = (prefix: string, index: number) => `${prefix}-imported-${index + 1}`

function blockFromLine(line: string, index: number): StudyMaterialBlock {
  const heading = line.match(/^(#{1,6})\s+(.+)$/)
  if (heading) {
    return { id: createId('heading', index), type: 'heading', level: heading[1].length, text: heading[2].trim() }
  }

  return { id: createId('paragraph', index), type: 'paragraph', children: [{ text: line.trim(), format: [] }] }
}

function isPlainTextHeading(line: string, nextLine?: string): boolean {
  const trimmed = line.trim().replace(/:$/, '')
  if (!trimmed || trimmed.includes('|') || trimmed.length > 70) return false

  if (/^summary$/i.test(trimmed) || /^overview$/i.test(trimmed) || /^introduction$/i.test(trimmed) || /^conclusion$/i.test(trimmed) || /^key points?$/i.test(trimmed) || /^references?$/i.test(trimmed)) {
    return true
  }

  const words = trimmed.split(/\s+/)
  if (words.length > 8) return false
  const titleLike = /^[A-Z][A-Za-z0-9'’/&()\- ]*$/.test(trimmed) || trimmed === trimmed.toUpperCase()
  if (!titleLike) return false
  if (!nextLine) return false
  if (/^[-*]\s+/.test(nextLine) || /^\d+[.)]\s+/.test(nextLine) || nextLine.includes('|')) return false
  return !/[.!?]$/.test(trimmed) && !/[.!?]$/.test(nextLine)
}

function parseBlocks(source: string): StudyMaterialBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: StudyMaterialBlock[] = []
  let paragraphLines: string[] = []
  let blockIndex = 0

  const flushParagraph = () => {
    if (!paragraphLines.length) return
    blocks.push({ id: createId('paragraph', blockIndex++), type: 'paragraph', children: [{ text: paragraphLines.join(' '), format: [] }] })
    paragraphLines = []
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].trim()
    if (!line) {
      flushParagraph()
      continue
    }

    const listMatch = line.match(/^([-*])\s+(.+)$/) ?? line.match(/^\d+[.)]\s+(.+)$/)
    if (listMatch) {
      flushParagraph()
      const numbered = /^\d+[.)]/.test(line)
      const items: string[] = []
      let cursor = lineIndex
      while (cursor < lines.length) {
        const candidate = lines[cursor].trim()
        const match = numbered ? candidate.match(/^\d+[.)]\s+(.+)$/) : candidate.match(/^[-*]\s+(.+)$/)
        if (!match) break
        items.push(match[1].trim())
        cursor += 1
      }
      blocks.push({ id: createId('list', blockIndex++), type: 'list', listType: numbered ? 'numbered' : 'bullet', items })
      lineIndex = cursor - 1
      continue
    }

    if (line.includes('|')) {
      const tableLines: string[] = []
      let cursor = lineIndex
      while (cursor < lines.length && lines[cursor].includes('|')) {
        tableLines.push(lines[cursor].trim())
        cursor += 1
      }
      if (tableLines.length >= 2) {
        flushParagraph()
        const rows = tableLines.map((tableLine) => tableLine.split('|').map((cell) => cell.trim()))
        blocks.push({ id: createId('table', blockIndex++), type: 'table', headers: rows[0], rows: rows.slice(1) })
        lineIndex = cursor - 1
        continue
      }
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      blocks.push(blockFromLine(line, blockIndex++))
      continue
    }

    if (isPlainTextHeading(line, lines[lineIndex + 1])) {
      flushParagraph()
      blocks.push({ id: createId('heading', blockIndex++), type: 'heading', level: 2, text: line.trim().replace(/:$/, '') })
      continue
    }

    paragraphLines.push(line)
  }

  flushParagraph()
  return blocks
}

export function convertTextDocumentToStudyMaterial(source: string, baseDocument?: StudyMaterialDocument): StudyMaterialDocument {
  const normalizedSource = source.replace(/\r\n?/g, '\n').trim()
  if (!normalizedSource) throw new Error('Source text is required.')

  const sourceLines = normalizedSource.split('\n').map((line) => line.trim()).filter(Boolean)
  const titleLine = sourceLines[0].replace(/^#{1,6}\s+/, '').trim()
  const body = sourceLines.slice(1).join('\n')
  const contentBlocks = parseBlocks(body || normalizedSource)
  const summaryIndex = contentBlocks.findIndex((block) => (block.type === 'heading' && /^summary$/i.test(block.text)) || (block.type === 'paragraph' && block.children.length === 1 && /^summary$/i.test(block.children[0].text.trim())))
  const summaryBlocks = summaryIndex >= 0 ? contentBlocks.slice(summaryIndex) : []
  const learningBlocks = summaryIndex >= 0 ? contentBlocks.slice(0, summaryIndex) : contentBlocks

  const pages: StudyMaterialPage[] = [
    {
      id: createId('page', 0),
      pageNumber: 1,
      pageType: 'COVER',
      title: titleLine || 'Imported Study Material',
      blocks: [{ id: createId('cover-heading', 0), type: 'heading', level: 1, text: titleLine || 'Imported Study Material' }],
    },
    {
      id: createId('page', 1),
      pageNumber: 2,
      pageType: 'CONTENT',
      title: titleLine || 'Imported Content',
      blocks: learningBlocks,
    },
    {
      id: createId('page', 2),
      pageNumber: 3,
      pageType: 'SUMMARY',
      title: 'Summary',
      blocks: summaryBlocks,
    },
  ]

  const document = {
    ...(baseDocument ?? {}),
    title: titleLine || baseDocument?.title || 'Imported Study Material',
    pages,
    blocks: pages.flatMap((page) => page.blocks),
  }
  return normalizeStudyMaterialDocument(document)
}
