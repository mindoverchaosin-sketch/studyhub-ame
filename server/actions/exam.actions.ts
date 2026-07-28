import * as templateService from '@/server/services/exam-template.service'
import * as attemptService from '@/server/services/exam-attempt.service'
import { requireStudent, requirePermission, requireOwnership } from '@/auth'

export async function listExamTemplates(params: { search?: string; active?: boolean; page?: number; pageSize?: number } = {}) {
  return templateService.listTemplates(params)
}

export async function getExamTemplate(id: string) {
  return templateService.getTemplate(id)
}

export async function createExamTemplate(input: any) {
  await requirePermission('manageModules')
  return templateService.createTemplate(input)
}

export async function activateExamTemplate(id: string, active: boolean) {
  await requirePermission('manageModules')
  return templateService.activateTemplate(id, active)
}

export async function generateAttempt(templateId: string, studentId: string) {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)

  return attemptService.generateExamAttempt(templateId, studentId)
}
