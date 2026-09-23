'use server'

import { requirePermission } from '@/auth'
import { studyMaterialDocumentService } from '@/server/services/study-material-document.service'

export async function createStudyMaterialDraftAction(input: { title: string; moduleId?: string; lessonId?: string; authorId?: string }) {
  await requirePermission('manageResources')
  return studyMaterialDocumentService.createDraftDocument(input)
}

export async function saveStudyMaterialDraftAction(resourceId: string, document: unknown) {
  await requirePermission('manageResources')
  return studyMaterialDocumentService.saveDraft(resourceId, document as any)
}

export async function submitStudyMaterialForReviewAction(resourceId: string) {
  await requirePermission('manageResources')
  return studyMaterialDocumentService.submitForReview(resourceId)
}

export async function approveStudyMaterialAction(resourceId: string) {
  await requirePermission('publishContent')
  return studyMaterialDocumentService.approve(resourceId)
}

export async function publishStudyMaterialAction(resourceId: string) {
  await requirePermission('publishContent')
  return studyMaterialDocumentService.publish(resourceId)
}

export async function archiveStudyMaterialEditorialAction(resourceId: string) {
  await requirePermission('publishContent')
  return studyMaterialDocumentService.archive(resourceId)
}

export async function unpublishStudyMaterialEditorialAction(resourceId: string) {
  await requirePermission('publishContent')
  return studyMaterialDocumentService.unpublish(resourceId)
}
