import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaStudyMaterialCreateMock = vi.hoisted(() => vi.fn())
const prismaStudyMaterialFindUniqueMock = vi.hoisted(() => vi.fn())
const prismaStudyMaterialFindManyMock = vi.hoisted(() => vi.fn())
const prismaStudyMaterialUpdateMock = vi.hoisted(() => vi.fn())
const prismaStudyMaterialDeleteMock = vi.hoisted(() => vi.fn())
const prismaTransactionMock = vi.hoisted(() => vi.fn())

function createMockTx() {
  return {
    studyMaterial: {
      findMany: prismaStudyMaterialFindManyMock,
      update: prismaStudyMaterialUpdateMock,
      findUnique: prismaStudyMaterialFindUniqueMock,
      create: prismaStudyMaterialCreateMock,
      delete: prismaStudyMaterialDeleteMock,
    },
  }
}

vi.mock('@/lib/prisma', () => ({
  default: {
    studyMaterial: {
      create: prismaStudyMaterialCreateMock,
      findUnique: prismaStudyMaterialFindUniqueMock,
      findMany: prismaStudyMaterialFindManyMock,
      update: prismaStudyMaterialUpdateMock,
      delete: prismaStudyMaterialDeleteMock,
    },
    $transaction: prismaTransactionMock,
  },
}))

function resetMocks() {
  prismaStudyMaterialCreateMock.mockReset()
  prismaStudyMaterialFindUniqueMock.mockReset()
  prismaStudyMaterialFindManyMock.mockReset()
  prismaStudyMaterialUpdateMock.mockReset()
  prismaStudyMaterialDeleteMock.mockReset()
  prismaTransactionMock.mockReset()
}

beforeEach(() => {
  resetMocks()
  prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTx() as any))
})

import { ResourceRepository } from '../../server/repositories/resource.repository'

describe('ResourceRepository', () => {
  describe('reorder', () => {
    it('persists displayOrder values', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      const resources = [
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r3', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ]
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce(resources)
        .mockResolvedValueOnce([
          { id: 'r3', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
          { id: 'r1', moduleId: 'm1', displayOrder: 2, createdAt: now, deletedAt: null },
          { id: 'r2', moduleId: 'm1', displayOrder: 3, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', ['r3', 'r1', 'r2'])

      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledTimes(3)
      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledWith({
        where: { id: 'r3' },
        data: { displayOrder: 1 },
      })
      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { displayOrder: 2 },
      })
      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledWith({
        where: { id: 'r2' },
        data: { displayOrder: 3 },
      })
      expect(result).toHaveLength(3)
    })

    it('returns resources ordered by displayOrder', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      const resources = [
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ]
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce(resources)
        .mockResolvedValueOnce([
          { id: 'r2', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
          { id: 'r1', moduleId: 'm1', displayOrder: 2, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', ['r2', 'r1'])

      expect(result.map((r) => r.id)).toEqual(['r2', 'r1'])
    })

    it('reorder is transactional', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      prismaStudyMaterialFindManyMock.mockResolvedValueOnce([
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ])
      prismaStudyMaterialFindManyMock.mockResolvedValueOnce([
        { id: 'r1', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
      ])

      await repository.reorder('m1', ['r1'])

      expect(prismaTransactionMock).toHaveBeenCalledTimes(1)
    })

    it('resources outside module scope cannot be reordered', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce([
          { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        ])
        .mockResolvedValueOnce([
          { id: 'r1', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', ['r1', 'r-outside'])

      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledTimes(1)
      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { displayOrder: 1 },
      })
      expect(result).toHaveLength(1)
    })

    it('omitted resources remain in deterministic order', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      const resources = [
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r3', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ]
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce(resources)
        .mockResolvedValueOnce([
          { id: 'r2', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
          { id: 'r1', moduleId: 'm1', displayOrder: 2, createdAt: now, deletedAt: null },
          { id: 'r3', moduleId: 'm1', displayOrder: 3, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', ['r2'])

      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledTimes(3)
      expect(result.map((r) => r.id)).toEqual(['r2', 'r1', 'r3'])
    })

    it('duplicate orderedIds do not corrupt ordering', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      const resources = [
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ]
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce(resources)
        .mockResolvedValueOnce([
          { id: 'r1', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
          { id: 'r2', moduleId: 'm1', displayOrder: 2, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', ['r1', 'r1', 'r2'])

      const updateCalls = prismaStudyMaterialUpdateMock.mock.calls
      const r1Updates = updateCalls.filter((call: any) => call[0].where.id === 'r1')
      expect(r1Updates).toHaveLength(1)
      expect(result).toHaveLength(2)
    })

    it('empty orderedIds behaves safely', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      prismaStudyMaterialFindManyMock
        .mockResolvedValueOnce([
          { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
          { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        ])
        .mockResolvedValueOnce([
          { id: 'r1', moduleId: 'm1', displayOrder: 1, createdAt: now, deletedAt: null },
          { id: 'r2', moduleId: 'm1', displayOrder: 2, createdAt: now, deletedAt: null },
        ])

      const result = await repository.reorder('m1', [])

      expect(prismaStudyMaterialUpdateMock).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })

    it('repository failure rolls back all ordering writes', async () => {
      const repository = new ResourceRepository()
      const now = new Date('2026-01-01T00:00:00.000Z')
      prismaStudyMaterialFindManyMock.mockResolvedValueOnce([
        { id: 'r1', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
        { id: 'r2', moduleId: 'm1', displayOrder: 0, createdAt: now, deletedAt: null },
      ])
      prismaTransactionMock.mockRejectedValueOnce(new Error('DB failure'))

      await expect(repository.reorder('m1', ['r1', 'r2'])).rejects.toThrow('DB failure')
    })
  })
})
