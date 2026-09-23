import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { sanitizeStudyMaterialDocument, studyMaterialDocumentSchema } from '@/lib/study-material/document-schema'
import { resourceRepository } from '@/server/repositories/resource.repository'
import type { StudyMaterialDocument } from '@/lib/study-material/document-schema'
import { getStudyMaterialEditorialWorkflow, createVersionSnapshotForTarget } from '@/server/services/editorial-workflow.service'
import { publishingService } from '@/server/services/publishing.service'
import { editorialWorkflowRepository } from '@/server/repositories/editorial-workflow.repository'

async function syncEditorialStatus(resourceId: string, status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED') {
  await editorialWorkflowRepository.update('STUDY_MATERIAL', resourceId, { status })
}

export class StudyMaterialDocumentService {
  async createDraftDocument(input: { title: string; moduleId?: string; lessonId?: string; authorId?: string }) {
    const doc = defaultAeroPrepStudyDocument(input.title)
    return sanitizeStudyMaterialDocument({
      ...doc,
      metadata: {
        ...doc.metadata,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        authorId: input.authorId,
      },
    })
  }

  async saveDraft(resourceId: string, document: StudyMaterialDocument) {
    const sanitized = sanitizeStudyMaterialDocument(document)
    const current = await resourceRepository.findById(resourceId)
    if (!current) throw new Error('Study material not found.')

    await getStudyMaterialEditorialWorkflow(resourceId)
    const snapshot = await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Draft saved', sanitized.metadata.authorId ?? 'Editor', 'DRAFT', null, sanitized as unknown as Record<string, unknown>)

    await resourceRepository.update(resourceId, {
      documentContent: sanitized as any,
      documentVersion: snapshot.version,
      status: 'DRAFT',
      sourceType: 'AEROPREP_DOC',
      lastReviewedAt: (current as any).lastReviewedAt ?? null,
    } as any)

    return { id: resourceId, documentVersion: snapshot.version, document: sanitized }
  }

  async submitForReview(resourceId: string, author = 'Editor') {
    await getStudyMaterialEditorialWorkflow(resourceId)
    const result = await publishingService.submitForReview('STUDY_MATERIAL', resourceId)
    await syncEditorialStatus(resourceId, 'IN_REVIEW')
    await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Submitted for review', author, 'IN_REVIEW', null)
    return { id: resourceId, status: result.persistedStatus }
  }

  async approve(resourceId: string, author = 'Reviewer') {
    await getStudyMaterialEditorialWorkflow(resourceId)
    const resource = await resourceRepository.findById(resourceId)
    const result = await publishingService.approve('STUDY_MATERIAL', resourceId)
    await syncEditorialStatus(resourceId, 'APPROVED')
    await resourceRepository.update(resourceId, { lastReviewedAt: new Date() } as any)
    await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Approved for publication', author, 'APPROVED', null, (resource as any)?.documentContent ?? undefined)
    return { id: resourceId, status: result.persistedStatus }
  }

  async publish(resourceId: string, author = 'Publisher') {
    const workflow = await getStudyMaterialEditorialWorkflow(resourceId)
    if (workflow.status !== 'APPROVED') {
      throw new Error('Publishing requires approved study material content')
    }
    const resource = await resourceRepository.findById(resourceId)
    const result = await publishingService.publish('STUDY_MATERIAL', resourceId)
    await syncEditorialStatus(resourceId, 'PUBLISHED')
    await resourceRepository.update(resourceId, { lastPublishedAt: new Date() } as any)
    await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Published study material', author, 'PUBLISHED', result.publishedAt, (resource as any)?.documentContent ?? undefined)
    return { id: resourceId, status: result.persistedStatus }
  }

  async archive(resourceId: string, author = 'Publisher') {
    await getStudyMaterialEditorialWorkflow(resourceId)
    const result = await publishingService.archive('STUDY_MATERIAL', resourceId)
    await syncEditorialStatus(resourceId, 'ARCHIVED')
    await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Archived study material', author, 'ARCHIVED', null)
    return { id: resourceId, status: result.persistedStatus }
  }

  async unpublish(resourceId: string, author = 'Publisher') {
    await getStudyMaterialEditorialWorkflow(resourceId)
    const result = await publishingService.unpublish('STUDY_MATERIAL', resourceId)
    await syncEditorialStatus(resourceId, 'DRAFT')
    await createVersionSnapshotForTarget('STUDY_MATERIAL', resourceId, 'Unpublished study material', author, 'DRAFT', null)
    return { id: resourceId, status: result.persistedStatus }
  }

  async getPublishedDocument(resourceId: string): Promise<StudyMaterialDocument | null> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource || resource.status !== 'PUBLISHED') return null
    const document = (resource as any).documentContent as StudyMaterialDocument | null
    if (!document) return null
    return sanitizeStudyMaterialDocument(document)
  }
}

export const studyMaterialDocumentService = new StudyMaterialDocumentService()
