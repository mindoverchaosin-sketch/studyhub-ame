import type { StudyMaterialBlock, StudyMaterialDocument, StudyMaterialPage } from '@/lib/study-material/document-schema'

export type MasteroAction =
  | 'GENERATE_EXPLANATION'
  | 'GENERATE_STUDY_NOTES'
  | 'SIMPLIFY'
  | 'EXPAND'
  | 'SUMMARIZE'
  | 'GENERATE_EXAMPLES'
  | 'GENERATE_EXAM_TIPS'
  | 'GENERATE_DEFINITIONS'
  | 'GENERATE_BULLETS'
  | 'GENERATE_TABLE'
  | 'IMPROVE_CONTENT'
  | 'GENERATE_SECTION'

export type MasteroGenerationRequest = {
  materialId: string
  action: MasteroAction
  selectedBlockId?: string
  instruction?: string
}

export type MasteroRelationContext = {
  id: string
  title?: string | null
  slug?: string | null
}

export type MasteroContext = {
  materialId: string
  title: string
  module: MasteroRelationContext | null
  lesson: MasteroRelationContext | null
  currentDocument: StudyMaterialDocument
  selectedBlock: StudyMaterialBlock | null
  selectedBlockContent: string | null
  action: MasteroAction
  materialType: string
  sourceType: string
  status: string
  isPremium: boolean
  documentMetadata: StudyMaterialDocument['metadata']
  instruction: string
}

export type MasteroProviderRequest = {
  systemInstructions: string
  context: MasteroContext
  editorContent: string
  responseSchema?: Record<string, unknown>
  maxGeneratedBlocks?: number
}

export type MasteroProviderResponse = {
  blocks: unknown[]
  sourceBlockIds?: unknown
}

export type MasteroGenerationResult = {
  blocks: StudyMaterialBlock[]
  sourceBlockIds: string[]
  action: MasteroAction
  generatedAt: string
}

export type MasteroAuditEvent =
  | 'mastero.generation.started'
  | 'mastero.generation.succeeded'
  | 'mastero.generation.failed'
  | 'mastero.generation.rejected'
  | 'mastero.generation.applied'

export function applyMasteroResult(
  document: StudyMaterialDocument,
  result: MasteroGenerationResult,
  selectedBlockId?: string,
): StudyMaterialDocument {
  const fallbackPage: StudyMaterialPage = {
    id: 'page-1',
    pageNumber: 1,
    pageType: 'CONTENT',
    title: document.title,
    blocks: [...document.blocks],
  }

  const hasLegacyRootBlocks = document.pages.length === 1 && document.blocks.length > 0 && document.pages[0].blocks.some((block, blockIndex) => block.id !== document.blocks[blockIndex]?.id)
  const pages: StudyMaterialPage[] = hasLegacyRootBlocks
    ? [{ ...document.pages[0], blocks: [...document.blocks] }]
    : document.pages.length
      ? document.pages.map((page) => ({ ...page, blocks: [...page.blocks] }))
      : [fallbackPage]
  const usedBlockIds = new Set(pages.flatMap((page) => page.blocks.map((block) => block.id)))
  const generatedBlocks = result.blocks.map((block, blockIndex) => {
    let blockId = block.id
    while (usedBlockIds.has(blockId)) {
      blockId = `${block.id}-mastero-${Date.now()}-${blockIndex}`
    }
    usedBlockIds.add(blockId)
    return blockId === block.id ? block : { ...block, id: blockId }
  })

  const targetPageIndex = (() => {
    if (selectedBlockId) {
      const pageIndex = pages.findIndex((page) => page.blocks.some((block) => block.id === selectedBlockId))
      if (pageIndex >= 0) return pageIndex
    }
    return Math.max(0, pages.length - 1)
  })()

  const targetPage = pages[targetPageIndex] ?? pages[0]
  const nextPageBlocks = [...targetPage.blocks]

  if (result.action === 'IMPROVE_CONTENT' && selectedBlockId) {
    const selectedIndex = nextPageBlocks.findIndex((block) => block.id === selectedBlockId)
    if (selectedIndex >= 0) {
      const updatedBlocks = nextPageBlocks.flatMap((block, index) => index === selectedIndex ? generatedBlocks : [block])
      const nextPages = pages.map((page, index) => index === targetPageIndex ? { ...page, blocks: updatedBlocks } : page)
      return { ...document, pages: nextPages, blocks: nextPages[targetPageIndex]?.blocks ?? updatedBlocks }
    }
  }

  if (result.action === 'GENERATE_SECTION' || !selectedBlockId) {
    const nextPages = pages.map((page, index) => index === targetPageIndex ? { ...page, blocks: [...page.blocks, ...generatedBlocks] } : page)
    return { ...document, pages: nextPages, blocks: nextPages[targetPageIndex]?.blocks ?? [] }
  }

  const selectedIndex = nextPageBlocks.findIndex((block) => block.id === selectedBlockId)
  if (selectedIndex < 0) {
    const nextPages = pages.map((page, index) => index === targetPageIndex ? { ...page, blocks: [...page.blocks, ...generatedBlocks] } : page)
    return { ...document, pages: nextPages, blocks: nextPages[targetPageIndex]?.blocks ?? [] }
  }

  const updatedBlocks = [...nextPageBlocks.slice(0, selectedIndex + 1), ...generatedBlocks, ...nextPageBlocks.slice(selectedIndex + 1)]
  const nextPages = pages.map((page, index) => index === targetPageIndex ? { ...page, blocks: updatedBlocks } : page)
  return { ...document, pages: nextPages, blocks: nextPages[targetPageIndex]?.blocks ?? updatedBlocks }
}