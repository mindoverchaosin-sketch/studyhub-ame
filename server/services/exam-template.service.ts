import { examTemplateRepository } from '@/server/repositories/exam-template.repository'
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto'
import { ValidationError } from '@/auth'

function normalizePremiumFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true' || value === 'on' || value === '1'
  return Boolean(value)
}

function mapToDTO(entity: any): ExamTemplateDTO {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description ?? undefined,
    questionBankId: entity.questionBankId ?? undefined,
    moduleId: entity.moduleId ?? undefined,
    courseId: entity.courseId ?? undefined,
    durationMinutes: Number(entity.durationMinutes ?? 60),
    questionCount: Number(entity.questionCount ?? 20),
    passingPercentage: Number(entity.passingPercentage ?? 60),
    shuffleQuestions: Boolean(entity.shuffleQuestions),
    shuffleAnswers: Boolean(entity.shuffleAnswers),
    negativeMarkingEnabled: Boolean(entity.negativeMarkingEnabled),
    active: Boolean(entity.active),
    isPremium: Boolean(entity.isPremium ?? false),
    createdAt: entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

export async function listTemplates(filters: { search?: string; active?: boolean; page?: number; pageSize?: number } = {}) {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const rows = await examTemplateRepository.listTemplates({ search: filters.search, active: filters.active, skip: (page - 1) * pageSize, take: pageSize })
  return rows.map(mapToDTO)
}

export async function getTemplate(id: string): Promise<ExamTemplateDTO | null> {
  const row = await examTemplateRepository.getTemplate(id)
  return row ? mapToDTO(row) : null
}

export async function createTemplate(input: Partial<ExamTemplateDTO>): Promise<ExamTemplateDTO> {
  // basic validation
  if (!input.name) throw new ValidationError('Name is required.')
  if ((input.questionCount ?? 0) <= 0) throw new ValidationError('questionCount must be > 0')

  const isPremium = normalizePremiumFlag(input.isPremium ?? false)

  const created = await examTemplateRepository.createTemplate({
    name: input.name,
    description: input.description ?? null,
    questionBankId: input.questionBankId ?? null,
    moduleId: input.moduleId ?? null,
    courseId: input.courseId ?? null,
    durationMinutes: input.durationMinutes ?? 60,
    questionCount: input.questionCount ?? 20,
    passingPercentage: input.passingPercentage ?? 60,
    shuffleQuestions: !!input.shuffleQuestions,
    shuffleAnswers: !!input.shuffleAnswers,
    negativeMarkingEnabled: !!input.negativeMarkingEnabled,
    active: !!input.active,
    isPremium,
  })

  return mapToDTO(created)
}

export async function updateTemplate(id: string, input: Partial<ExamTemplateDTO>): Promise<ExamTemplateDTO> {
  const existing = await examTemplateRepository.getTemplate(id)
  const isPremium = typeof input.isPremium === 'boolean' ? input.isPremium : existing?.isPremium ?? false

  const updated = await examTemplateRepository.updateTemplate(id, {
    ...input,
    isPremium,
  })

  return mapToDTO(updated)
}

export async function deleteTemplate(id: string): Promise<void> {
  await examTemplateRepository.deleteTemplate(id)
}

export async function activateTemplate(id: string, active: boolean): Promise<ExamTemplateDTO> {
  const updated = await examTemplateRepository.activateTemplate(id, active)
  return mapToDTO(updated)
}
