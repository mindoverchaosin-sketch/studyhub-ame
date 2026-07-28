import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { mapQuestionEntityToDTO } from '@/server/application/mappers/question.mapper'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'

export type QuestionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type AdminQuestionLibraryFilters = {
  search?: string
  status?: QuestionStatus
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  sortBy?: 'createdAt' | 'difficulty' | 'status' | 'prompt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type AdminQuestionLibraryDTO = {
  items: Array<QuestionDTO & {
    status: QuestionStatus
    metadata: {
      tags: string[]
      timeEstimateMinutes: number
    }
    createdAt: string
  }>
  total: number
  page: number
  pageSize: number
}

export type ImportPreviewRowDTO = {
  id: string
  prompt: string
  options: string[]
  correctOptionIndex: number | null
  validationErrors: string[]
  duplicate: boolean
}

export type ImportResultDTO = {
  importedCount: number
  duplicateCount: number
  preview: ImportPreviewRowDTO[]
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split(','))
}

function inferQuestionStatus(status?: string): QuestionStatus {
  switch (status) {
    case 'PUBLISHED':
    case 'ARCHIVED':
      return status
    default:
      return 'DRAFT'
  }
}

export async function getQuestionsByTopic(questionBankId: string): Promise<QuestionDTO[]> {
  return (await questionRepository.findByTopic(questionBankId)).map(mapQuestionEntityToDTO)
}

export async function getQuestionByTopic(id: string): Promise<QuestionDTO | null> {
  const question = await questionRepository.findById(id)
  return question ? mapQuestionEntityToDTO(question) : null
}

export async function getQuestionById(id: string): Promise<QuestionDTO | null> {
  const question = await questionRepository.findById(id)
  return question ? mapQuestionEntityToDTO(question) : null
}

export async function bulkUpdateQuestionStatus(ids: string[], status: QuestionStatus): Promise<void> {
  await Promise.all(ids.map((id) => questionRepository.updateStatus(id, status)))
}

export async function getQuestionCount(): Promise<number> {
  return questionRepository.countAll()
}

export async function getAdminQuestionLibrary(filters: AdminQuestionLibraryFilters = {}): Promise<AdminQuestionLibraryDTO> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const rows = await questionRepository.findAdmin({
    search: filters.search,
    status: filters.status,
    difficulty: filters.difficulty,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await questionRepository.countAdmin({
    search: filters.search,
    status: filters.status,
    difficulty: filters.difficulty,
  })

  const items = rows.map((row: any) => ({
    ...mapQuestionEntityToDTO(row),
    status: inferQuestionStatus(row.status ?? 'DRAFT'),
    metadata: {
      tags: Array.isArray(row.metadata?.tags) ? row.metadata.tags : [],
      timeEstimateMinutes: Number(row.metadata?.timeEstimateMinutes ?? 3),
    },
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }))

  return { items, total, page, pageSize }
}

export async function getAdminQuestionBanks() {
  return questionBankRepository.findAll()
}

export async function updateQuestionStatus(id: string, status: QuestionStatus): Promise<void> {
  await questionRepository.updateStatus(id, status)
}

export async function archiveQuestion(id: string): Promise<void> {
  await questionRepository.archive(id)
}

export async function restoreQuestion(id: string): Promise<void> {
  await questionRepository.restore(id)
}

export async function bulkImportQuestions(input: {
  questionBankId: string
  fileBuffer: Buffer
  fileName: string
}): Promise<ImportResultDTO> {
  const content = input.fileBuffer.toString('utf8')
  const rows = parseCsv(content)
  const dataRows = rows.slice(1)
  const preview: ImportPreviewRowDTO[] = []

  const existingQuestions = await questionRepository.findByBank(input.questionBankId)
  const seen = new Set(existingQuestions.map((item: any) => normalizeText(item.prompt)))

  for (const row of dataRows) {
    const prompt = row[0] ?? ''
    const options = [row[1] ?? '', row[2] ?? '', row[3] ?? '', row[4] ?? '']
    const correctOptionIndex = Number(row[5] ?? '')
    const validationErrors: string[] = []

    if (!prompt.trim()) {
      validationErrors.push('Prompt is required')
    }

    if (options.filter(Boolean).length < 2) {
      validationErrors.push('At least two options are required')
    }

    const duplicate = seen.has(normalizeText(prompt))
    if (duplicate) {
      validationErrors.push('Duplicate question')
    }

    preview.push({
      id: `${input.questionBankId}-${preview.length + 1}`,
      prompt,
      options: options.filter(Boolean),
      correctOptionIndex: Number.isFinite(correctOptionIndex) ? correctOptionIndex : null,
      validationErrors,
      duplicate,
    })

    if (!duplicate && validationErrors.length === 0) {
      seen.add(normalizeText(prompt))
    }
  }

  const validRows = preview.filter((item) => item.validationErrors.length === 0 && !item.duplicate)

  for (const row of validRows) {
    await questionRepository.create({
      prompt: row.prompt,
      questionBankId: input.questionBankId,
      questionType: 'MULTIPLE_CHOICE',
      options: row.options,
      correctOptionIndex: row.correctOptionIndex,
      difficulty: 'BEGINNER',
      explanation: null,
      status: 'DRAFT',
      metadata: { tags: [], timeEstimateMinutes: 3 },
    } as any)
  }

  return {
    importedCount: validRows.length,
    duplicateCount: preview.filter((item) => item.duplicate).length,
    preview,
  }
}
