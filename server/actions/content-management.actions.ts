'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { ModuleManagementService } from '@/server/services/module-management.service'

const moduleManagementService = new ModuleManagementService()

function readModuleInput(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    moduleNumber: String(formData.get('moduleNumber') ?? ''),
    description: String(formData.get('description') ?? ''),
    courseId: String(formData.get('courseId') ?? ''),
    status: String(formData.get('status') ?? 'DRAFT'),
    difficulty: String(formData.get('difficulty') ?? 'BEGINNER'),
    estimatedHours: Number(formData.get('estimatedHours') ?? 0),
    displayOrder: Number(formData.get('displayOrder') ?? 0),
    isPremium: formData.get('isPremium') === 'on' || formData.get('isPremium') === 'true',
  }
}

export async function createModuleAction(input: Record<string, unknown>) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.create',
    entityType: 'MODULE',
    metadata: { source: 'content-management', input: { title: input.title } },
    run: async () => {
      const created = await moduleManagementService.createModule(input as any)
      revalidatePath('/admin/modules')
      return created
    },
  })
  return result
}

export async function createModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const result = await moduleManagementService.createModule(readModuleInput(formData) as any)
  revalidatePath('/admin/modules')
  return result
}

export async function updateModuleAction(moduleId: string, input: Record<string, unknown>) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.update',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const updated = await moduleManagementService.updateModule(moduleId, input as any)
      revalidatePath('/admin/modules')
      return updated
    },
  })
  return result
}

export async function updateModuleFormAction(moduleId: string, formData: FormData) {
  await requirePermission('manageModules')
  const result = await moduleManagementService.updateModule(moduleId, readModuleInput(formData) as any)
  revalidatePath('/admin/modules')
  return result
}

export async function archiveModuleAction(moduleId: string) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.archive',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const archived = await moduleManagementService.archiveModule(moduleId)
      revalidatePath('/admin/modules')
      return archived
    },
  })
  return result
}

export async function archiveModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const moduleId = String(formData.get('moduleId') ?? '')
  const result = await moduleManagementService.archiveModule(moduleId)
  revalidatePath('/admin/modules')
  return result
}

export async function unarchiveModuleAction(moduleId: string) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.unarchive',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const restored = await moduleManagementService.unarchiveModule(moduleId)
      revalidatePath('/admin/modules')
      return restored
    },
  })
  return result
}

export async function unarchiveModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const moduleId = String(formData.get('moduleId') ?? '')
  const result = await moduleManagementService.unarchiveModule(moduleId)
  revalidatePath('/admin/modules')
  return result
}
