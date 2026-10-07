'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { ModuleManagementService } from '@/server/services/module-management.service'

const moduleManagementService = new ModuleManagementService()

function revalidateModulePaths(moduleId: string) {
  revalidatePath('/admin/modules')
  revalidatePath(`/admin/modules/${moduleId}`)
}

type ModuleCreateInput = {
  title: string
  slug: string
  moduleNumber: string
  description?: string
  courseId: string
  status?: string
  difficulty?: string
  estimatedHours?: number
  displayOrder?: number
  isPremium?: boolean
}
type ModuleUpdateInput = Omit<ModuleCreateInput, 'courseId'>

function readModuleInput(formData: FormData): ModuleCreateInput {
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

export async function createModuleAction(input: ModuleCreateInput) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.create',
    entityType: 'MODULE',
    metadata: { source: 'content-management', input: { title: input.title } },
    run: async () => {
      const created = await moduleManagementService.createModule(input)
      revalidatePath('/admin/modules')
      return created
    },
  })
  return result
}

export async function createModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.create',
    entityType: 'MODULE',
    metadata: { source: 'content-management' },
    run: async () => {
      const created = await moduleManagementService.createModule(readModuleInput(formData))
      revalidatePath('/admin/modules')
      return created
    },
  })
  return result
}

export async function updateModuleAction(moduleId: string, input: Partial<ModuleUpdateInput>) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.update',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const updated = await moduleManagementService.updateModule(moduleId, input)
      revalidateModulePaths(moduleId)
      return updated
    },
  })
  return result
}

export async function updateModuleFormAction(moduleId: string, formData: FormData) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.update',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const updated = await moduleManagementService.updateModule(moduleId, readModuleInput(formData))
      revalidateModulePaths(moduleId)
      return updated
    },
  })
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
      revalidateModulePaths(moduleId)
      return archived
    },
  })
  return result
}

export async function archiveModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const moduleId = String(formData.get('moduleId') ?? '')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.archive',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const archived = await moduleManagementService.archiveModule(moduleId)
      revalidateModulePaths(moduleId)
      return archived
    },
  })
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
      revalidateModulePaths(moduleId)
      return restored
    },
  })
  return result
}

export async function unarchiveModuleFormAction(formData: FormData) {
  await requirePermission('manageModules')
  const moduleId = String(formData.get('moduleId') ?? '')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.unarchive',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'content-management' },
    run: async () => {
      const restored = await moduleManagementService.unarchiveModule(moduleId)
      revalidateModulePaths(moduleId)
      return restored
    },
  })
  return result
}
