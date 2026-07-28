'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { StudyMaterialManagementService } from '@/server/services/study-material-management.service'

const studyMaterialManagementService = new StudyMaterialManagementService()

export async function createStudyMaterialAction(input: Record<string, unknown>) {
  await requirePermission('manageResources')
  const result = await withAuditLogging({
    permission: 'manageResources',
    action: 'resource.create',
    entityType: 'RESOURCE',
    metadata: { source: 'study-materials' },
    run: async () => {
      const created = await studyMaterialManagementService.createResource(input as any)
      revalidatePath('/admin/modules')
      return created
    },
  })
  return result
}

export async function updateStudyMaterialAction(resourceId: string, input: Record<string, unknown>) {
  await requirePermission('manageResources')
  const result = await withAuditLogging({
    permission: 'manageResources',
    action: 'resource.update',
    entityType: 'RESOURCE',
    entityId: resourceId,
    metadata: { source: 'study-materials' },
    run: async () => {
      const updated = await studyMaterialManagementService.updateResource(resourceId, input as any)
      revalidatePath('/admin/modules')
      return updated
    },
  })
  return result
}

export async function archiveStudyMaterialAction(resourceId: string) {
  await requirePermission('manageResources')
  const result = await withAuditLogging({
    permission: 'manageResources',
    action: 'resource.archive',
    entityType: 'RESOURCE',
    entityId: resourceId,
    metadata: { source: 'study-materials' },
    run: async () => {
      const archived = await studyMaterialManagementService.archiveResource(resourceId)
      revalidatePath('/admin/modules')
      return archived
    },
  })
  return result
}

export async function publishStudyMaterialAction(resourceId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'resource.publish',
    entityType: 'RESOURCE',
    entityId: resourceId,
    metadata: { source: 'study-materials' },
    run: async () => {
      const published = await studyMaterialManagementService.publishResource(resourceId)
      revalidatePath('/admin/modules')
      return published
    },
  })
  return result
}

export async function unarchiveStudyMaterialAction(resourceId: string) {
  await requirePermission('manageResources')
  const result = await withAuditLogging({
    permission: 'manageResources',
    action: 'resource.unarchive',
    entityType: 'RESOURCE',
    entityId: resourceId,
    metadata: { source: 'study-materials' },
    run: async () => {
      const restored = await studyMaterialManagementService.unarchiveResource(resourceId)
      revalidatePath('/admin/modules')
      return restored
    },
  })
  return result
}

export async function reorderStudyMaterialAction(moduleId: string, orderedIds: string[]) {
  await requirePermission('manageResources')
  const result = await studyMaterialManagementService.reorderResources(moduleId, orderedIds)
  revalidatePath('/admin/modules')
  return result
}
