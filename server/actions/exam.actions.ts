import * as templateService from '@/server/services/exam-template.service'
import * as attemptService from '@/server/services/exam-attempt.service'
import { requireStudent, requirePermission, requireOwnership } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto'

export type StudentExamTemplateDTO = Pick<ExamTemplateDTO, 'id' | 'name' | 'description' | 'moduleId' | 'courseId' | 'durationMinutes' | 'questionCount' | 'passingPercentage' | 'shuffleQuestions' | 'shuffleAnswers' | 'negativeMarkingEnabled' | 'active' | 'isPremium'>

function toStudentExamTemplate(template: ExamTemplateDTO): StudentExamTemplateDTO {
  const { id, name, description, moduleId, courseId, durationMinutes, questionCount, passingPercentage, shuffleQuestions, shuffleAnswers, negativeMarkingEnabled, active, isPremium } = template
  return { id, name, description, moduleId, courseId, durationMinutes, questionCount, passingPercentage, shuffleQuestions, shuffleAnswers, negativeMarkingEnabled, active, isPremium }
}

function normalizeExamTemplateInput(input: unknown): Partial<ExamTemplateDTO> {
  const values: Record<string, FormDataEntryValue | unknown> = input instanceof FormData
    ? Object.fromEntries(input.entries())
    : input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const booleanValue = (value: unknown) => typeof value === 'string'
    ? ['true', 'on', '1', 'yes'].includes(value)
    : typeof value === 'number' ? value === 1 : Boolean(value)
  const numberValue = (value: unknown) => typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : undefined

  if (input instanceof FormData) {
    return {
      name: typeof values.name === 'string' ? values.name : undefined,
      description: typeof values.description === 'string' ? values.description : undefined,
      durationMinutes: numberValue(values.durationMinutes),
      questionCount: numberValue(values.questionCount),
      passingPercentage: numberValue(values.passingPercentage),
      isPremium: booleanValue(values.isPremium),
      shuffleQuestions: booleanValue(values.shuffleQuestions),
      shuffleAnswers: booleanValue(values.shuffleAnswers),
      negativeMarkingEnabled: booleanValue(values.negativeMarkingEnabled),
      active: booleanValue(values.active),
    }
  }

  return {
    ...values,
    isPremium: booleanValue(values.isPremium),
  }
}

export async function listExamTemplates(params: { search?: string; active?: boolean; page?: number; pageSize?: number } = {}) {
  await requirePermission('manageModules')
  return templateService.listTemplates(params)
}

export async function getExamTemplate(id: string) {
  await requirePermission('manageModules')
  return templateService.getTemplate(id)
}

export async function listStudentExamTemplates(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<StudentExamTemplateDTO[]> {
  await requireStudent()
  const templates = await templateService.listTemplates({ ...params, active: true })
  return templates.filter((template: ExamTemplateDTO) => template.active).map(toStudentExamTemplate)
}

export async function getStudentExamTemplate(id: string): Promise<StudentExamTemplateDTO | null> {
  await requireStudent()
  const template = await templateService.getTemplate(id)
  return template?.active ? toStudentExamTemplate(template) : null
}

export async function createExamTemplate(input: unknown) {
  await requirePermission('manageModules')
  return templateService.createTemplate(normalizeExamTemplateInput(input))
}

export async function activateExamTemplate(id: string, active: boolean) {
  await requirePermission('manageModules')
  return templateService.activateTemplate(id, active)
}

export async function generateAttempt(templateId: string, studentId: string) {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)

  // Validate template state before attempt generation
  const template = await templateService.getTemplate(templateId)
  if (!template) {
    throw new Error('Template not found.')
  }

  if (!template.active) {
    throw new Error('This exam is no longer available.')
  }

  // Check premium access for the exam template
  if (template.isPremium) {
    // Determine context: if template is tied to a module, use premiumModules feature
    // Otherwise, use unlimitedMockExams for standalone templates
    const context = template.moduleId ? 'module' : 'standalone'
    const canAccess = await contentAccessService.canAccessExamTemplate(studentId, template.isPremium, context)
    if (!canAccess.allowed) {
      throw new Error(canAccess.reason || 'Premium exam template access required')
    }
  }

  return attemptService.generateExamAttempt(templateId, studentId)
}
