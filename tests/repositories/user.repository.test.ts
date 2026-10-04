import { beforeEach, describe, expect, it, vi } from 'vitest'

const userFindManyMock = vi.hoisted(() => vi.fn())
const userCountMock = vi.hoisted(() => vi.fn())
const userUpdateMock = vi.hoisted(() => vi.fn())
const sessionDeleteMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findMany: userFindManyMock,
      count: userCountMock,
      update: userUpdateMock,
    },
    session: { deleteMany: sessionDeleteMock },
    $transaction: transactionMock,
  },
}))

import { UserRepository } from '../../server/repositories/user.repository'

describe('UserRepository lifecycle status filters', () => {
  beforeEach(() => {
    userFindManyMock.mockReset().mockResolvedValue([])
    userCountMock.mockReset().mockResolvedValue(0)
    userUpdateMock.mockReset()
    sessionDeleteMock.mockReset()
    transactionMock.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z'))
  })

  it.each(['ACTIVE', 'SUSPENDED', 'TERMINATED'] as const)(
    'uses effective %s status consistently for list and count',
    async (status) => {
      const repository = new UserRepository()
      const now = new Date('2026-10-01T12:00:00.000Z')

      await repository.findManyForAdmin({ status })
      await repository.countManyForAdmin({ status })

      const listWhere = userFindManyMock.mock.calls[0][0].where
      const countWhere = userCountMock.mock.calls[0][0].where
      expect(listWhere).toEqual(countWhere)

      if (status === 'ACTIVE') {
        expect(listWhere).toEqual({
          AND: [{
            AND: [
              { accountStatus: { not: 'TERMINATED' } },
              {
                OR: [
                  { AND: [{ isActive: true }, { accountStatus: { not: 'SUSPENDED' } }] },
                  { suspensionType: 'TEMPORARY', suspensionEndsAt: { lte: now } },
                ],
              },
            ],
          }],
        })
      } else if (status === 'SUSPENDED') {
        expect(listWhere).toEqual({
          AND: [{
            AND: [
              { accountStatus: { not: 'TERMINATED' } },
              { OR: [{ isActive: false }, { accountStatus: 'SUSPENDED' }] },
              {
                OR: [
                  { suspensionType: null },
                  { suspensionType: { not: 'TEMPORARY' } },
                  { suspensionEndsAt: null },
                  { suspensionEndsAt: { gt: now } },
                ],
              },
            ],
          }],
        })
      } else {
        expect(listWhere).toEqual({ AND: [{ accountStatus: 'TERMINATED' }] })
      }
    },
  )

  it('preserves student-management status filtering by isActive', async () => {
    const repository = new UserRepository()

    await repository.findStudentsForAdmin({ status: 'SUSPENDED' })
    await repository.countStudentsForAdmin({ status: 'SUSPENDED' })

    expect(userFindManyMock.mock.calls[0][0].where).toEqual({
      role: { is: { name: 'STUDENT' } },
      isActive: false,
    })
    expect(userCountMock.mock.calls[0][0].where).toEqual({
      role: { is: { name: 'STUDENT' } },
      isActive: false,
    })
  })

  it('combines approval status with search, role, and account status filters', async () => {
    const repository = new UserRepository()

    await repository.findManyForAdmin({ search: 'example', role: 'ADMIN', status: 'ACTIVE', approvalStatus: 'PENDING' })
    await repository.countManyForAdmin({ search: 'example', role: 'ADMIN', status: 'ACTIVE', approvalStatus: 'PENDING' })

    const listWhere = userFindManyMock.mock.calls[0][0].where
    const countWhere = userCountMock.mock.calls[0][0].where
    expect(listWhere).toEqual(countWhere)
    expect(listWhere).toEqual({
      OR: [
        { email: { contains: 'example', mode: 'insensitive' } },
        { displayName: { contains: 'example', mode: 'insensitive' } },
      ],
      role: { is: { name: 'ADMIN' } },
      AND: [
        {
          AND: [
            { accountStatus: { not: 'TERMINATED' } },
            {
              OR: [
                { AND: [{ isActive: true }, { accountStatus: { not: 'SUSPENDED' } }] },
                { suspensionType: 'TEMPORARY', suspensionEndsAt: { lte: new Date('2026-10-01T12:00:00.000Z') } },
              ],
            },
          ],
        },
        {
          OR: [
            { adminProfile: { is: { status: 'PENDING' } } },
            { instructorProfile: { is: { status: 'PENDING' } } },
          ],
        },
      ],
    })
  })

  it('revokes persisted sessions and increments sessionVersion atomically', async () => {
    const repository = new UserRepository()
    const tx = {
      session: { deleteMany: sessionDeleteMock },
      user: { update: userUpdateMock },
    }
    sessionDeleteMock.mockResolvedValue({ count: 3 })
    userUpdateMock.mockResolvedValue({ sessionVersion: 8 })
    transactionMock.mockImplementation(async (callback) => callback(tx))

    await expect(repository.revokeAllSessionsForUser('user-9')).resolves.toEqual({ deletedCount: 3, sessionVersion: 8 })

    expect(transactionMock).toHaveBeenCalledOnce()
    expect(sessionDeleteMock).toHaveBeenCalledWith({ where: { userId: 'user-9' } })
    expect(userUpdateMock).toHaveBeenCalledWith({ where: { id: 'user-9' }, data: { sessionVersion: { increment: 1 } } })
  })
})
