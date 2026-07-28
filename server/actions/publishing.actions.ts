'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { publishingService } from '@/server/services/publishing.service'

export async function submitForReviewAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.submit-for-review',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const submitted = await publishingService.submitForReview(targetType, targetId)
      revalidatePath('/admin')
      return submitted
    },
  })
  return result
}

export async function approvePublishingAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.approve',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const approved = await publishingService.approve(targetType, targetId)
      revalidatePath('/admin')
      return approved
    },
  })
  return result
}

export async function rejectPublishingAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string, reason?: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.reject',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing', reason },
    run: async () => {
      const rejected = await publishingService.reject(targetType, targetId, reason)
      revalidatePath('/admin')
      return rejected
    },
  })
  return result
}

export async function publishContentAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.publish',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const published = await publishingService.publish(targetType, targetId)
      revalidatePath('/admin')
      return published
    },
  })
  return result
}

export async function unpublishContentAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.unpublish',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const unpublished = await publishingService.unpublish(targetType, targetId)
      revalidatePath('/admin')
      return unpublished
    },
  })
  return result
}

export async function archiveContentAction(targetType: 'MODULE' | 'STUDY_MATERIAL' | 'QUESTION', targetId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'content.archive',
    entityType: targetType,
    entityId: targetId,
    metadata: { source: 'publishing' },
    run: async () => {
      const archived = await publishingService.archive(targetType, targetId)
      revalidatePath('/admin')
      return archived
    },
  })
  return result
}
