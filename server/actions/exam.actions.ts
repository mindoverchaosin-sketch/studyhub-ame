import * as templateService from '@/server/services/exam-template.service'
import * as attemptService from '@/server/services/exam-attempt.service'
import { requireStudent, requirePermission, requireOwnership, requireAuth } from '@/auth'

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
  await requireAuth() // Ensure user is authenticated before allowing template enumeration
  return templateService.listTemplates(params)
}

export async function getExamTemplate(id: string) {
  await requireAuth() // Ensure user is authenticated before allowing template access
  return templateService.getTemplate(id)
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

  return attemptService.generateExamAttempt(templateId, studentId)
}
