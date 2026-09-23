import * as templateService from '@/server/services/exam-template.service'
import * as attemptService from '@/server/services/exam-attempt.service'
import { requireStudent, requirePermission, requireOwnership, requireAuth } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto'

export type StudentExamTemplateDTO = Pick<ExamTemplateDTO, 'id' | 'name' | 'description' | 'moduleId' | 'courseId' | 'durationMinutes' | 'questionCount' | 'passingPercentage' | 'shuffleQuestions' | 'shuffleAnswers' | 'negativeMarkingEnabled' | 'active' | 'isPremium'>

function toStudentExamTemplate(template: ExamTemplateDTO): StudentExamTemplateDTO {
  const { id, name, description, moduleId, courseId, durationMinutes, questionCount, passingPercentage, shuffleQuestions, shuffleAnswers, negativeMarkingEnabled, active, isPremium } = template
  return { id, name, description, moduleId, courseId, durationMinutes, questionCount, passingPercentage, shuffleQuestions, shuffleAnswers, negativeMarkingEnabled, active, isPremium }
}

function normalizeExamTemplateInput(input: any) {
  if (input instanceof FormData) {
    const formValues = Object.fromEntries(input.entries())
    const rawPremium = formValues.isPremium
    return {
      ...formValues,
      isPremium: rawPremium === 'on' || rawPremium === 'true' || rawPremium === '1' || rawPremium === 'yes',
    }
  }

  const rawPremium = input?.isPremium
  return {
    ...input,
    isPremium: typeof rawPremium === 'string'
      ? rawPremium === 'true' || rawPremium === 'on' || rawPremium === '1' || rawPremium === 'yes'
      : typeof rawPremium === 'number'
        ? rawPremium === 1
        : !!rawPremium,
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

export async function createExamTemplate(input: any) {
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
