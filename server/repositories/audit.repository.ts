import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { AuditLogEntryDTO, AuditLogListDTO, AuditLogQueryDTO } from '@/server/application/dto/audit.dto'

type AuditLogRecordInput = {
  actorUserId: string
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown> | null
}

export class AuditRepository {
  async recordEvent(input: AuditLogRecordInput) {
    return prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  }

  async listAuditLogs(params: AuditLogQueryDTO = {}): Promise<AuditLogListDTO> {
    const search = params.search?.trim()
    const where: Prisma.AuditLogWhereInput = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.entityType ? { targetType: params.entityType } : {}),
      ...(params.userId ? { actorUserId: params.userId } : {}),
      ...(search ? {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { targetType: { contains: search, mode: 'insensitive' } },
          { targetId: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.startDate || params.endDate ? {
        createdAt: {
          ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
          ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
        },
      } : {}),
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: ((params.page ?? 1) - 1) * (params.pageSize ?? 20),
        take: params.pageSize ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    const mappedAuditLogs: AuditLogEntryDTO[] = auditLogs.map((entry) => ({
      id: entry.id,
      timestamp: entry.createdAt.toISOString(),
      userId: entry.actorUserId,
      userRole: (entry.metadata as Record<string, unknown> | null)?.actorRole?.toString() ?? null,
      action: entry.action,
      entityType: entry.targetType,
      entityId: entry.targetId,
      status: ((entry.metadata as Record<string, unknown> | null)?.success as boolean | undefined) === false ? 'FAILURE' : 'SUCCESS',
      metadata: entry.metadata as Record<string, unknown> | null,
    }))

    return { auditLogs: mappedAuditLogs, total }
  }
}

export const auditRepository = new AuditRepository()
