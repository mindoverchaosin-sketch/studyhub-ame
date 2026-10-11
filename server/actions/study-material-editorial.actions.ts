'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
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
  if (moduleId) revalidatePath(`/admin/modules/${moduleId}`)
}

export async function submitStudyMaterialForReviewAction(resourceId: string, moduleId?: string) {
  await requirePermission('manageResources')
  const result = await studyMaterialDocumentService.submitForReview(resourceId)
  revalidateStudyMaterialPaths(moduleId)
  return result
}

export async function approveStudyMaterialAction(resourceId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await studyMaterialDocumentService.approve(resourceId)
  revalidateStudyMaterialPaths(moduleId)
  return result
}

export async function rejectStudyMaterialAction(resourceId: string, moduleId?: string, reason?: string) {
  await requirePermission('publishContent')
  const result = await studyMaterialDocumentService.reject(resourceId, reason)
  revalidateStudyMaterialPaths(moduleId)
  return result
}

export async function publishStudyMaterialAction(resourceId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await studyMaterialDocumentService.publish(resourceId)
  revalidateStudyMaterialPaths(moduleId)
  return result
}

export async function archiveStudyMaterialEditorialAction(resourceId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await studyMaterialDocumentService.archive(resourceId)
  revalidateStudyMaterialPaths(moduleId)
  return result
}

export async function unpublishStudyMaterialEditorialAction(resourceId: string, moduleId?: string) {
  await requirePermission('publishContent')
  const result = await studyMaterialDocumentService.unpublish(resourceId)
  revalidateStudyMaterialPaths(moduleId)
  return result
}
