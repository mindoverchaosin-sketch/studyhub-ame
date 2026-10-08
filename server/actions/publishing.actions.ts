'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { publishingService } from '@/server/services/publishing.service'

type PublishingTargetType = 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION' | 'LESSON'

function revalidatePublishingPaths(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  revalidatePath('/admin')
  if (targetType === 'MODULE') {
    revalidatePath('/admin/modules')
    revalidatePath(`/admin/modules/${targetId}`)
  } else if (targetType === 'STUDY_MATERIAL') {
    revalidatePath('/admin/materials')
    if (moduleId) revalidatePath(`/admin/modules/${moduleId}`)
  }
}

export async function submitForReviewAction(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.submit-for-review',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const submitted = await publishingService.submitForReview(targetType, targetId)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return submitted
    },
  })
  return result
}

export async function approvePublishingAction(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.approve',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const approved = await publishingService.approve(targetType, targetId)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return approved
    },
  })
  return result
}

export async function rejectPublishingAction(targetType: PublishingTargetType, targetId: string, reason?: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.reject',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing', reason },
    run: async () => {
      const rejected = await publishingService.reject(targetType, targetId, reason)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return rejected
    },
  })
  return result
}

export async function publishContentAction(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.publish',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const published = await publishingService.publish(targetType, targetId)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return published
    },
  })
  return result
}

export async function unpublishContentAction(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.unpublish',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const unpublished = await publishingService.unpublish(targetType, targetId)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return unpublished
    },
  })
  return result
}

export async function archiveContentAction(targetType: PublishingTargetType, targetId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.archive',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const archived = await publishingService.archive(targetType, targetId)
      revalidatePublishingPaths(targetType, targetId, moduleId)
      return archived
    },
  })
  return result
}
