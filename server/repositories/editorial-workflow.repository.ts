import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type EditorialWorkflowRow = {
  id: string
  targetType: string
  entityId: string
  status: string
  currentVersion: number
  versions: Prisma.JsonArray
  reviewQueue: Prisma.JsonArray
  createdAt: Date
  updatedAt: Date
}

export class EditorialWorkflowRepository {
  async findByTarget(targetType: string, entityId: string): Promise<EditorialWorkflowRow | null> {
    const row = await prisma.editorialWorkflow.findUnique({
      where: { targetType_entityId: { targetType, entityId } },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return row as EditorialWorkflowRow | null
  }

  async findById(id: string): Promise<EditorialWorkflowRow | null> {
    const row = await prisma.editorialWorkflow.findUnique({
      where: { id },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return row as EditorialWorkflowRow | null
  }

  async listByStatus(status: string): Promise<EditorialWorkflowRow[]> {
    const rows = await prisma.editorialWorkflow.findMany({
      where: { status: status as any },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return rows as EditorialWorkflowRow[]
  }

  async create(data: {
    targetType: string
    entityId: string
    status: string
    currentVersion: number
    versions: Prisma.InputJsonArray
    reviewQueue: Prisma.InputJsonArray
  }): Promise<EditorialWorkflowRow> {
    const row = await prisma.editorialWorkflow.create({
      data: {
        targetType: data.targetType,
        entityId: data.entityId,
        status: data.status as any,
        currentVersion: data.currentVersion,
        versions: data.versions,
        reviewQueue: data.reviewQueue,
      },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return row as EditorialWorkflowRow
  }

  async update(
    targetType: string,
    entityId: string,
    data: {
      status?: string
      currentVersion?: number
      versions?: Prisma.InputJsonArray
      reviewQueue?: Prisma.InputJsonArray
    },
  ): Promise<EditorialWorkflowRow> {
    const row = await prisma.editorialWorkflow.update({
      where: { targetType_entityId: { targetType, entityId } },
      data: {
        ...(data.status ? { status: data.status as any } : {}),
        ...(data.currentVersion ? { currentVersion: data.currentVersion } : {}),
        ...(data.versions ? { versions: data.versions } : {}),
        ...(data.reviewQueue ? { reviewQueue: data.reviewQueue } : {}),
      },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return row as EditorialWorkflowRow
  }

  async delete(id: string): Promise<void> {
    await prisma.editorialWorkflow.delete({ where: { id } })
  }

  async deleteByTarget(targetType: string, entityId: string): Promise<void> {
    await prisma.editorialWorkflow.delete({
      where: { targetType_entityId: { targetType, entityId } },
    })
  }

  async lockForUpdate(targetType: string, entityId: string): Promise<void> {
    await prisma.$executeRaw`
      SELECT "id", "targetType", "entityId", "status", "currentVersion", "versions", "reviewQueue", "createdAt", "updatedAt"
      FROM "EditorialWorkflow"
      WHERE "targetType" = ${targetType} AND "entityId" = ${entityId}
      FOR UPDATE
    `
  }

  async mutateWithLock<T>(
    targetType: string,
    entityId: string,
    fn: (tx: any, locked: EditorialWorkflowRow) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT "id", "targetType", "entityId", "status", "currentVersion", "versions", "reviewQueue", "createdAt", "updatedAt"
        FROM "EditorialWorkflow"
        WHERE "targetType" = ${targetType} AND "entityId" = ${entityId}
        FOR UPDATE
      `

      const locked = await tx.editorialWorkflow.findUnique({
        where: { targetType_entityId: { targetType, entityId } },
        select: {
          id: true,
          targetType: true,
          entityId: true,
          status: true,
          currentVersion: true,
          versions: true,
          reviewQueue: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!locked) {
        throw new Error('Editorial workflow not found')
      }

      return fn(tx, locked as EditorialWorkflowRow)
    })
  }
}

export const editorialWorkflowRepository = new EditorialWorkflowRepository()
