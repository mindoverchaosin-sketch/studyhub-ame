'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { studyMaterialDocumentService } from '@/server/services/study-material-document.service'
import type { StudyMaterialDocument } from '@/lib/study-material/document-schema'

export async function createStudyMaterialDraftAction(input: { title: string; moduleId?: string; lessonId?: string; authorId?: string }) {
  await requirePermission('manageResources')
  return studyMaterialDocumentService.createDraftDocument(input)
}

export async function saveStudyMaterialDraftAction(resourceId: string, document: StudyMaterialDocument) {
  await requirePermission('manageResources')
  return studyMaterialDocumentService.saveDraft(resourceId, document)
}

function revalidateStudyMaterialPaths(moduleId?: string) {
  revalidatePath('/admin/materials')
  revalidatePath('/admin/publishing')
  revalidatePath('/super-admin/publishing')
  if (moduleId) revalidatePath(`/admin/modules/${moduleId}`)
}

function withStudyMaterialAudit<T>(
  action: string,
  permission: string,
  resourceId: string,
  run: () => Promise<T>,
) {
  return withAuditLogging({
    permission,
    action,
    entityType: 'STUDY_MATERIAL',
    entityId: resourceId,
    metadata: { source: 'study-material-editorial' },
    run,
  })
}

export async function submitStudyMaterialForReviewAction(resourceId: string, moduleId?: string) {
  return withStudyMaterialAudit('content.submit-for-review', 'manageResources', resourceId, async () => {
    const result = await studyMaterialDocumentService.submitForReview(resourceId)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}

export async function approveStudyMaterialAction(resourceId: string, moduleId?: string) {
  return withStudyMaterialAudit('content.approve', 'publishContent', resourceId, async () => {
    const result = await studyMaterialDocumentService.approve(resourceId)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}

export async function rejectStudyMaterialAction(resourceId: string, moduleId?: string, reason?: string) {
  return withStudyMaterialAudit('content.reject', 'publishContent', resourceId, async () => {
    const result = await studyMaterialDocumentService.reject(resourceId, reason)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}

export async function publishStudyMaterialAction(resourceId: string, moduleId?: string) {
  return withStudyMaterialAudit('content.publish', 'publishContent', resourceId, async () => {
    const result = await studyMaterialDocumentService.publish(resourceId)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}

export async function archiveStudyMaterialEditorialAction(resourceId: string, moduleId?: string) {
  return withStudyMaterialAudit('content.archive', 'publishContent', resourceId, async () => {
    const result = await studyMaterialDocumentService.archive(resourceId)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}

export async function unpublishStudyMaterialEditorialAction(resourceId: string, moduleId?: string) {
  return withStudyMaterialAudit('content.unpublish', 'publishContent', resourceId, async () => {
    const result = await studyMaterialDocumentService.unpublish(resourceId)
    revalidateStudyMaterialPaths(moduleId)
    return result
  })
}
