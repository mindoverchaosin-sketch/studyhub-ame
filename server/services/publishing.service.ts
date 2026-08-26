import { lessonRepository } from '@/server/repositories/lesson.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { questionRepository } from '@/server/repositories/question.repository'

export type PublishingTargetType = 'MODULE' | 'LESSON' | 'STUDY_MATERIAL' | 'QUESTION'
export type PublishingWorkflowState = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'

export type PublishingResult = {
  targetId: string
  targetType: PublishingTargetType
  workflowState: PublishingWorkflowState
  persistedStatus: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  publishedAt: string | null
  reason?: string | null
}

export class PublishingService {
  async submitForReview(targetType: PublishingTargetType, targetId: string): Promise<PublishingResult> {
    return this.transition(targetType, targetId, 'IN_REVIEW', 'IN_REVIEW', undefined, { setPublishedAt: false })
  }

  async approve(targetType: PublishingTargetType, targetId: string): Promise<PublishingResult> {
    const current = await this.getCurrent(targetType, targetId)
    if (current.workflowState !== 'IN_REVIEW') {
      throw new Error('Approval requires a pending review')
    }

    return this.transition(targetType, targetId, 'PUBLISHED', 'PUBLISHED', undefined, { setPublishedAt: true })
  }

  async reject(targetType: PublishingTargetType, targetId: string, reason?: string): Promise<PublishingResult> {
    const current = await this.getCurrent(targetType, targetId)
    if (current.workflowState !== 'IN_REVIEW') {
      throw new Error('Rejection requires a pending review')
    }

    return this.transition(targetType, targetId, 'DRAFT', 'DRAFT', reason, { setPublishedAt: false })
  }

  async publish(targetType: PublishingTargetType, targetId: string): Promise<PublishingResult> {
    return this.transition(targetType, targetId, 'PUBLISHED', 'PUBLISHED', undefined, { setPublishedAt: true })
  }

  async unpublish(targetType: PublishingTargetType, targetId: string): Promise<PublishingResult> {
    return this.transition(targetType, targetId, 'DRAFT', 'DRAFT', undefined, { setPublishedAt: null })
  }

  async archive(targetType: PublishingTargetType, targetId: string): Promise<PublishingResult> {
    return this.transition(targetType, targetId, 'ARCHIVED', 'ARCHIVED', undefined, { setPublishedAt: false })
  }

  private async getCurrent(targetType: PublishingTargetType, targetId: string): Promise<{ workflowState: PublishingWorkflowState; persistedStatus: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'; publishedAt: string | null }> {
    const entity = await this.loadEntity(targetType, targetId)
    const persistedStatus = (entity && 'status' in entity ? (entity.status as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') : 'DRAFT') ?? 'DRAFT'
    const workflowState = persistedStatus === 'ARCHIVED' ? 'ARCHIVED' : persistedStatus === 'PUBLISHED' ? 'PUBLISHED' : persistedStatus === 'IN_REVIEW' ? 'IN_REVIEW' : 'DRAFT'
    const publishedAtValue = entity && 'publishedAt' in entity ? entity.publishedAt : null

    return {
      workflowState,
      persistedStatus,
      publishedAt: publishedAtValue ? new Date(publishedAtValue).toISOString() : null,
    }
  }

  private async transition(
    targetType: PublishingTargetType,
    targetId: string,
    workflowState: PublishingWorkflowState,
    persistedStatus: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED',
    reason?: string,
    options: { setPublishedAt?: boolean | null } = {},
  ): Promise<PublishingResult> {
    const updatePayload: Record<string, unknown> = { status: persistedStatus }
    if (options.setPublishedAt === true) {
      updatePayload.publishedAt = new Date()
    } else if (options.setPublishedAt === null) {
      updatePayload.publishedAt = null
    }

    const updated = await this.saveEntity(targetType, targetId, updatePayload)

    const nextPersistedStatus = updated && 'status' in updated ? (updated.status as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') : 'DRAFT'
    const publishedAtValue = updated && 'publishedAt' in updated ? updated.publishedAt : null

    return {
      targetId,
      targetType,
      workflowState,
      persistedStatus: nextPersistedStatus,
      publishedAt: publishedAtValue ? new Date(publishedAtValue).toISOString() : null,
      reason: reason ?? null,
    }
  }

  private async loadEntity(targetType: PublishingTargetType, targetId: string) {
    switch (targetType) {
      case 'MODULE':
        return moduleRepository.findById(targetId)
      case 'LESSON':
        return lessonRepository.findById(targetId)
      case 'STUDY_MATERIAL':
        return resourceRepository.findById(targetId)
      case 'QUESTION':
        return questionRepository.findById(targetId)
      default:
        return null
    }
  }

  private async saveEntity(targetType: PublishingTargetType, targetId: string, data: Record<string, unknown>) {
    switch (targetType) {
      case 'MODULE':
        return moduleRepository.update(targetId, data as any)
      case 'LESSON':
        return lessonRepository.update(targetId, data as any)
      case 'STUDY_MATERIAL':
        return resourceRepository.update(targetId, data as any)
      case 'QUESTION':
        return questionRepository.update(targetId, data as any)
      default:
        return null
    }
  }
}

export const publishingService = new PublishingService()
