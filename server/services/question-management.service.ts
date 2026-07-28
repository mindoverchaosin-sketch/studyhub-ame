import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'

export type QuestionManagementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type QuestionManagementCreateInput = {
  prompt: string
  options: string[]
  correctOptionIndex: number | null
  questionBankId: string
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  explanation?: string | null
  status?: QuestionManagementStatus
  metadata?: { tags?: string[]; timeEstimateMinutes?: number }
}

export type QuestionManagementUpdateInput = Partial<QuestionManagementCreateInput>

export type QuestionManagementListFilters = {
  search?: string
  status?: QuestionManagementStatus | 'ALL'
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL'
  page?: number
  pageSize?: number
}

export type QuestionManagementListResult = {
  items: Array<QuestionDTO & { status: QuestionManagementStatus; metadata: { tags: string[]; timeEstimateMinutes: number }; createdAt: string }>
  total: number
  page: number
  pageSize: number
}

export type QuestionManagementValidationError = {
  field: 'prompt' | 'options' | 'correctOptionIndex' | 'questionBankId' | 'difficulty'
  message: string
}

export type QuestionManagementResult = {
  success: boolean
  errors: QuestionManagementValidationError[]
  question?: QuestionDTO & { status: QuestionManagementStatus; metadata: { tags: string[]; timeEstimateMinutes: number }; createdAt: string }
}

function normalizeOptions(options: string[]) {
  return options.map((option) => option.trim()).filter(Boolean)
}

function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return []
}

function parseMetadata(value: unknown): { tags: string[]; timeEstimateMinutes: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { tags: [], timeEstimateMinutes: 3 }
  }

  const metadata = value as Record<string, unknown>
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  return {
    tags,
    timeEstimateMinutes: Number(metadata.timeEstimateMinutes ?? 3),
  }
}

function mapQuestionRow(row: any) {
  const options = parseOptions(row.options)
  const correctIndex = typeof row.correctOptionIndex === 'number' ? row.correctOptionIndex : null

  return {
    id: row.id,
    question: row.prompt,
    options: options.map((text: string, index: number) => ({ id: String(index), text })),
    optionA: options[0] ?? '',
    optionB: options[1] ?? '',
    optionC: options[2] ?? '',
    optionD: options[3] ?? '',
    correctAnswer: correctIndex === null ? null : options[correctIndex] ?? null,
    explanation: row.explanation ?? null,
    difficulty: row.difficulty,
    questionBankId: row.questionBankId,
    status: (row.status as QuestionManagementStatus | undefined) ?? 'DRAFT',
    metadata: parseMetadata(row.metadata),
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

export class QuestionManagementService {
  async listQuestions(filters: QuestionManagementListFilters = {}): Promise<QuestionManagementListResult> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20

    const rows = await questionRepository.findForAdmin({
      search: filters.search,
      status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
      difficulty: filters.difficulty && filters.difficulty !== 'ALL' ? filters.difficulty : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const total = await questionRepository.countForAdmin({
      search: filters.search,
      status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
      difficulty: filters.difficulty && filters.difficulty !== 'ALL' ? filters.difficulty : undefined,
    })

    return {
      items: rows.map((row: any) => mapQuestionRow(row)),
      total,
      page,
      pageSize,
    }
  }

  async getQuestion(questionId: string): Promise<QuestionManagementResult> {
    const question = await questionRepository.findById(questionId)
    if (!question) {
      return { success: false, errors: [{ field: 'questionBankId', message: 'Question not found' }] }
    }

    return {
      success: true,
      errors: [],
      question: mapQuestionRow(question),
    }
  }

  async createQuestion(input: QuestionManagementCreateInput): Promise<QuestionManagementResult> {
    const errors = this.validate(input)
    if (errors.length) {
      return { success: false, errors }
    }

    const questionBank = await questionBankRepository.findById(input.questionBankId)
    if (!questionBank) {
      return { success: false, errors: [{ field: 'questionBankId', message: 'A valid question bank is required' }] }
    }

    const options = normalizeOptions(input.options)
    const created = await questionRepository.create({
      questionBankId: input.questionBankId,
      prompt: input.prompt.trim(),
      options,
      correctOptionIndex: input.correctOptionIndex,
      explanation: input.explanation ?? null,
      difficulty: input.difficulty ?? 'BEGINNER',
      status: input.status ?? 'DRAFT',
      metadata: input.metadata ?? { tags: [], timeEstimateMinutes: 3 },
    } as any)

    return {
      success: true,
      errors: [],
      question: mapQuestionRow(created),
    }
  }

  async updateQuestion(questionId: string, input: QuestionManagementUpdateInput): Promise<QuestionManagementResult> {
    const existing = await questionRepository.findById(questionId)
    if (!existing) {
      return { success: false, errors: [{ field: 'questionBankId', message: 'Question not found' }] }
    }

    const errors = this.validate({
      prompt: input.prompt ?? existing.prompt,
      options: Array.isArray(input.options) ? input.options.filter((option): option is string => typeof option === 'string') : Array.isArray(existing.options) ? existing.options.filter((option): option is string => typeof option === 'string') : [],
      correctOptionIndex: input.correctOptionIndex ?? existing.correctOptionIndex ?? null,
      questionBankId: input.questionBankId ?? existing.questionBankId,
      difficulty: input.difficulty ?? existing.difficulty,
      explanation: input.explanation ?? existing.explanation ?? null,
      status: (input.status ?? existing.status ?? 'DRAFT') as QuestionManagementStatus,
      metadata: (input.metadata ?? existing.metadata ?? { tags: [], timeEstimateMinutes: 3 }) as { tags?: string[]; timeEstimateMinutes?: number },
    })

    if (errors.length) {
      return { success: false, errors }
    }

    const questionBank = await questionBankRepository.findById(input.questionBankId ?? existing.questionBankId)
    if (!questionBank) {
      return { success: false, errors: [{ field: 'questionBankId', message: 'A valid question bank is required' }] }
    }

    const updated = await questionRepository.update(questionId, {
      ...(input.prompt ? { prompt: input.prompt.trim() } : {}),
      ...(input.options ? { options: normalizeOptions(input.options) } : {}),
      ...(input.correctOptionIndex !== undefined ? { correctOptionIndex: input.correctOptionIndex } : {}),
      ...(input.explanation !== undefined ? { explanation: input.explanation } : {}),
      ...(input.difficulty ? { difficulty: input.difficulty } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.questionBankId ? { questionBankId: input.questionBankId } : {}),
    } as any)

    return {
      success: true,
      errors: [],
      question: mapQuestionRow(updated),
    }
  }

  async archiveQuestion(questionId: string): Promise<QuestionManagementResult> {
    const updated = await questionRepository.archive(questionId)
    return {
      success: true,
      errors: [],
      question: mapQuestionRow(updated),
    }
  }

  async unarchiveQuestion(questionId: string): Promise<QuestionManagementResult> {
    const updated = await questionRepository.update(questionId, { status: 'DRAFT' } as any)
    return {
      success: true,
      errors: [],
      question: mapQuestionRow(updated),
    }
  }

  private validate(input: QuestionManagementCreateInput | QuestionManagementUpdateInput): QuestionManagementValidationError[] {
    const errors: QuestionManagementValidationError[] = []

    if (!input.prompt || !String(input.prompt).trim()) {
      errors.push({ field: 'prompt', message: 'Question text is required' })
    }

    const options = normalizeOptions(((input.options ?? []) as string[]))
    if (options.length < 1) {
      errors.push({ field: 'options', message: 'At least one option is required' })
    }

    if (options.length > 1 && new Set(options).size !== options.length) {
      errors.push({ field: 'options', message: 'Options must be unique' })
    }

    if (input.correctOptionIndex === null || input.correctOptionIndex === undefined) {
      errors.push({ field: 'correctOptionIndex', message: 'At least one correct answer is required' })
    }

    if (!input.questionBankId) {
      errors.push({ field: 'questionBankId', message: 'A valid question bank is required' })
    }

    if (input.difficulty && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(input.difficulty)) {
      errors.push({ field: 'difficulty', message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED' })
    }

    return errors
  }
}

export const questionManagementService = new QuestionManagementService()
