import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('student management service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds a directory payload from admin repository queries', async () => {
    const userRepository = {
      findStudentsForAdmin: vi.fn().mockResolvedValue([
        {
          id: 'student-1',
          email: 'ada@example.com',
          displayName: 'Ada',
          isActive: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-02-01T00:00:00.000Z'),
          role: { name: 'STUDENT' },
          studentProfile: { fullName: 'Ada Lovelace' },
        },
      ]),
      countStudentsForAdmin: vi.fn().mockResolvedValue(1),
      updateStudentStatus: vi.fn(),
      resetStudentProgress: vi.fn(),
    }

    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))

    const { getStudentManagementDirectory } = await import('../../server/services/student-management.service')
    const dto = await getStudentManagementDirectory({
      search: 'ada',
      status: 'ACTIVE',
      role: 'STUDENT',
      page: 1,
      pageSize: 20,
      sortBy: 'newest',
    })

    expect(userRepository.findStudentsForAdmin).toHaveBeenCalledWith(expect.objectContaining({
      search: 'ada',
      status: 'ACTIVE',
      role: 'STUDENT',
      skip: 0,
      take: 20,
      sortBy: 'newest',
    }))
    expect(dto.items[0]).toMatchObject({
      id: 'student-1',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      status: 'ACTIVE',
    })
    expect(dto.pagination.totalItems).toBe(1)
    expect(dto.summary.activeCount).toBe(1)
  })

  it('maps suspend and reactivate operations to the repository layer', async () => {
    const userRepository = {
      findStudentsForAdmin: vi.fn(),
      countStudentsForAdmin: vi.fn(),
      updateStudentStatus: vi.fn()
        .mockResolvedValueOnce({ id: 'student-1', isActive: false })
        .mockResolvedValueOnce({ id: 'student-1', isActive: true }),
      resetStudentProgress: vi.fn().mockResolvedValue({ deletedCount: 3 }),
    }

    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))

    const { suspendStudentAccount, reactivateStudentAccount, resetStudentProgress } = await import('../../server/services/student-management.service')

    const suspended = await suspendStudentAccount('student-1')
    const reactivated = await reactivateStudentAccount('student-1')
    const reset = await resetStudentProgress('student-1')

    expect(userRepository.updateStudentStatus).toHaveBeenNthCalledWith(1, 'student-1', false)
    expect(userRepository.updateStudentStatus).toHaveBeenNthCalledWith(2, 'student-1', true)
    expect(userRepository.resetStudentProgress).toHaveBeenCalledWith('student-1')
    expect(suspended.status).toBe('SUSPENDED')
    expect(reactivated.status).toBe('ACTIVE')
    expect(reset).toEqual({ deletedCount: 3 })
  })
})
