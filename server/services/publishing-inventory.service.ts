import type { EditorialStatus, Status } from '@prisma/client'
import { editorialWorkflowRepository } from '@/server/repositories/editorial-workflow.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import { resourceRepository } from '@/server/repositories/resource.repository'
import type { PublishingTargetType } from '@/server/services/publishing.service'

export type PublishingInventoryStatus = Status | EditorialStatus

export type PublishingInventoryItem = {
  id: string
  targetType: PublishingTargetType
  title: string
  status: PublishingInventoryStatus
  updatedAt: Date
  moduleId?: string
  href: string
}

function statusFromWorkflow(status: EditorialStatus | undefined, persistedStatus: Status): PublishingInventoryStatus {
  return status ?? persistedStatus
}

export async function getPublishingInventory(): Promise<PublishingInventoryItem[]> {
  const [modules, lessons, materials, questions] = await Promise.all([
    moduleRepository.findAll(),
    lessonRepository.findAll(),
    resourceRepository.findAll(),
    questionRepository.findAll(),
  ])

  const activeMaterials = materials.filter((material) => !material.deletedAt)
  const workflows = await editorialWorkflowRepository.findByTargets(
    'STUDY_MATERIAL',
    activeMaterials.map((material) => material.id),
  )
  const materialWorkflowById = new Map(workflows.map((workflow) => [workflow.entityId, workflow.status]))

  return [
    ...modules
      .filter((module) => !module.deletedAt)
      .map((module): PublishingInventoryItem => ({
        id: module.id,
        targetType: 'MODULE',
        title: module.title,
        status: module.status,
        updatedAt: module.updatedAt,
        href: `/admin/modules/${module.id}`,
      })),
    ...lessons.map((lesson): PublishingInventoryItem => ({
      id: lesson.id,
      targetType: 'LESSON',
      title: lesson.title,
      status: lesson.status,
      updatedAt: lesson.updatedAt,
      moduleId: lesson.moduleId,
      href: '/admin/lessons',
    })),
    ...activeMaterials.map((material): PublishingInventoryItem => ({
      id: material.id,
      targetType: 'STUDY_MATERIAL',
      title: material.title,
      status: statusFromWorkflow(materialWorkflowById.get(material.id), material.status),
      updatedAt: material.updatedAt,
      moduleId: material.moduleId ?? undefined,
      href: `/admin/materials/${material.id}`,
    })),
    ...questions
      .filter((question) => !question.deletedAt)
      .map((question): PublishingInventoryItem => ({
        id: question.id,
        targetType: 'QUESTION',
        title: question.prompt,
        status: question.status,
        updatedAt: question.updatedAt,
        href: '/admin/questions',
      })),
  ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
}
