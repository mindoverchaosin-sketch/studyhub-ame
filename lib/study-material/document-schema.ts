import { z } from 'zod'

export const studyMaterialBrandingSchema = z.object({
  systemControlled: z.boolean().default(true),
  locked: z.boolean().default(true),
})

export const studyMaterialTextNodeSchema = z.object({
  text: z.string(),
  format: z.array(z.enum(['bold', 'italic'])).default([]),
})

export const studyMaterialParagraphSchema = z.object({
  id: z.string(),
  type: z.literal('paragraph'),
  children: z.array(studyMaterialTextNodeSchema),
})

export const studyMaterialHeadingSchema = z.object({
  id: z.string(),
  type: z.literal('heading'),
  level: z.number().int().min(1).max(6),
  text: z.string(),
  anchor: z.string().optional(),
})

export const studyMaterialListSchema = z.object({
  id: z.string(),
  type: z.literal('list'),
  listType: z.enum(['bullet', 'numbered']),
  items: z.array(z.string()),
})

export const studyMaterialTableSchema = z.object({
  id: z.string(),
  type: z.literal('table'),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
})

export const studyMaterialImageSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  mediaId: z.string(),
  mediaKey: z.string().optional(),
  altText: z.string(),
  caption: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  width: z.number().int().positive().optional(),
})

export const studyMaterialCalloutSchema = z.object({
  id: z.string(),
  type: z.literal('callout'),
  variant: z.enum(['important', 'tip', 'warning']),
  title: z.string(),
  text: z.string(),
})

export const studyMaterialDefinitionSchema = z.object({
  id: z.string(),
  type: z.literal('definition'),
  term: z.string(),
  definition: z.string(),
})

export const studyMaterialExampleSchema = z.object({
  id: z.string(),
  type: z.literal('example'),
  title: z.string().default('Example'),
  content: z.string(),
})

export const studyMaterialExamTipSchema = z.object({
  id: z.string(),
  type: z.literal('examTip'),
  text: z.string(),
})

export const studyMaterialLinkSchema = z.object({
  id: z.string(),
  type: z.literal('link'),
  text: z.string(),
  url: z.string().url(),
  openInNewTab: z.boolean().default(true),
})

export const studyMaterialBlockSchema = z.discriminatedUnion('type', [
  studyMaterialHeadingSchema,
  studyMaterialParagraphSchema,
  studyMaterialListSchema,
  studyMaterialTableSchema,
  studyMaterialImageSchema,
  studyMaterialCalloutSchema,
  studyMaterialDefinitionSchema,
  studyMaterialExampleSchema,
  studyMaterialExamTipSchema,
  studyMaterialLinkSchema,
])

export const studyMaterialPageTypes = ['COVER', 'LEARNING_OBJECTIVES', 'CONTENT', 'DEFINITION', 'COMPARISON', 'PROCESS', 'EXAM_FOCUS', 'QUICK_REVISION', 'SUMMARY'] as const
export type StudyMaterialPageType = (typeof studyMaterialPageTypes)[number]

export const studyMaterialPageSchema = z.object({
  id: z.string(),
  pageNumber: z.number().int().min(1),
  pageType: z.enum(studyMaterialPageTypes).default('CONTENT'),
  title: z.string().default(''),
  blocks: z.array(studyMaterialBlockSchema).default([]),
})

export const studyMaterialDocumentSchema = z.object({
  schemaVersion: z.number().int().min(1).default(1),
  documentType: z.literal('AEROPREP_STUDY_MATERIAL'),
  title: z.string().min(1),
  metadata: z.object({
    moduleId: z.string().optional(),
    lessonId: z.string().optional(),
    authorId: z.string().optional(),
    course: z.string().optional(),
    module: z.string().optional(),
    moduleNumber: z.string().optional(),
    submoduleNumber: z.string().optional(),
    lesson: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  }).default({ status: 'DRAFT' }),
  pages: z.array(studyMaterialPageSchema).default([]),
  blocks: z.array(studyMaterialBlockSchema).default([]),
  branding: studyMaterialBrandingSchema.default({ systemControlled: true, locked: true }),
})

export type StudyMaterialTextNode = z.infer<typeof studyMaterialTextNodeSchema>
export type StudyMaterialBlock = z.infer<typeof studyMaterialBlockSchema>
export type StudyMaterialPage = z.infer<typeof studyMaterialPageSchema>
export type StudyMaterialDocument = z.infer<typeof studyMaterialDocumentSchema>

const generateId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`

export const createEmptyStudyPage = (pageNumber = 1, pageType: StudyMaterialPageType = 'CONTENT', title = ''): StudyMaterialPage => ({
  id: generateId('page'),
  pageNumber,
  pageType,
  title,
  blocks: [],
})

export const normalizeStudyMaterialDocument = (value: unknown): StudyMaterialDocument => {
  if (!value || typeof value !== 'object') {
    throw new Error('Study material document is required.')
  }

  const input = value as Record<string, unknown>
  const legacyBlocks = Array.isArray(input.blocks) ? input.blocks.filter(Boolean) as StudyMaterialBlock[] : []
  const pages = Array.isArray(input.pages) && input.pages.length > 0
    ? input.pages.map((page, index) => {
        const candidate = page as Record<string, unknown>
        const existingBlocks = Array.isArray(candidate.blocks) ? candidate.blocks.filter(Boolean) as StudyMaterialBlock[] : []
        return {
          id: typeof candidate.id === 'string' && candidate.id ? candidate.id : generateId('page'),
          pageNumber: Number(candidate.pageNumber) > 0 ? Number(candidate.pageNumber) : index + 1,
          pageType: typeof candidate.pageType === 'string' && studyMaterialPageTypes.includes(candidate.pageType as StudyMaterialPageType)
            ? candidate.pageType as StudyMaterialPageType
            : 'CONTENT',
          title: typeof candidate.title === 'string' ? candidate.title : '',
          blocks: existingBlocks,
        }
      })
    : legacyBlocks.length > 0
      ? [{
          id: generateId('page'),
          pageNumber: 1,
          pageType: 'CONTENT',
          title: '',
          blocks: legacyBlocks,
        }]
      : [{
          id: generateId('page'),
          pageNumber: 1,
          pageType: 'CONTENT',
          title: '',
          blocks: [],
        }]

  const normalizedPages = pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    blocks: Array.isArray(page.blocks) ? page.blocks.filter(Boolean) as StudyMaterialBlock[] : [],
  }))

  const firstPageBlocks = normalizedPages[0]?.blocks ?? []
  const preferredFirstPageBlocks = Array.isArray(input.pages) && input.pages.length > 1
    ? firstPageBlocks
    : legacyBlocks.length > 0 && (
      firstPageBlocks.length === 0 ||
      firstPageBlocks.length !== legacyBlocks.length ||
      firstPageBlocks.some((block, index) => block.id !== legacyBlocks[index]?.id)
    )
      ? legacyBlocks
      : firstPageBlocks

  const normalized = {
    schemaVersion: Number(input.schemaVersion ?? 1),
    documentType: input.documentType ?? 'AEROPREP_STUDY_MATERIAL',
    title: typeof input.title === 'string' && input.title.trim() ? input.title : 'Study Material',
    metadata: {
      ...(typeof input.metadata === 'object' && input.metadata ? input.metadata as Record<string, unknown> : {}),
      status: typeof (input.metadata as Record<string, unknown> | undefined)?.status === 'string'
        ? (input.metadata as Record<string, unknown>).status as 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'
        : 'DRAFT',
    },
    pages: normalizedPages[0]
      ? [{ ...normalizedPages[0], blocks: preferredFirstPageBlocks }, ...normalizedPages.slice(1)]
      : normalizedPages,
    blocks: Array.isArray(input.pages) && input.pages.length > 1
      ? normalizedPages.flatMap((page) => page.blocks)
      : preferredFirstPageBlocks,
    branding: {
      systemControlled: true,
      locked: true,
    },
  }

  const parsed = studyMaterialDocumentSchema.safeParse(normalized)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '))
  }

  return parsed.data
}

export const isStudyMaterialDocument = (value: unknown): value is StudyMaterialDocument => {
  try {
    normalizeStudyMaterialDocument(value)
    return true
  } catch {
    return false
  }
}

export const sanitizeStudyMaterialDocument = (value: unknown): StudyMaterialDocument => {
  assertBrandingLocked(value)
  return normalizeStudyMaterialDocument(value)
}

export const assertBrandingLocked = (value: unknown): void => {
  if (!value || typeof value !== 'object') return
  const brand = value as { branding?: { systemControlled?: boolean; locked?: boolean } }
  if (brand.branding && (brand.branding.systemControlled !== true || brand.branding.locked !== true)) {
    throw new Error('Branding controls are system-managed and cannot be edited by content authors.')
  }
}

export const createEmptyStudyDocument = (title: string): StudyMaterialDocument => ({
  schemaVersion: 1,
  documentType: 'AEROPREP_STUDY_MATERIAL',
  title,
  metadata: {
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  pages: [createEmptyStudyPage(1, 'CONTENT')],
  blocks: [],
  branding: { systemControlled: true, locked: true },
})
