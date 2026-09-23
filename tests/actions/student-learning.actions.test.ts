import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRequireStudent = vi.fn()
const mockInvalidateServiceCache = vi.fn()
const mockPrisma = {
  lesson: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  lessonProgress: {
    count: vi.fn(),
  },
  moduleProgress: {
    upsert: vi.fn(),
  },
}

const mockProgressRepository = {
  upsertLessonProgress: vi.fn(),
}

const mockContentAccessService = {
  canAccessLesson: vi.fn(),
}

vi.mock('@/auth', () => ({
  requireStudent: mockRequireStudent,
}))

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}))

vi.mock('@/server/repositories/progress.repository', () => ({
  progressRepository: mockProgressRepository,
}))

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: mockContentAccessService,
}))

vi.mock('@/server/services/cache', () => ({
  invalidateServiceCache: mockInvalidateServiceCache,
}))

describe('student-learning.actions - setLessonCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStudent.mockResolvedValue({
      user: { id: 'student-1', role: 'STUDENT' },
    })
  })

  it('allows accessible student to complete lesson', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: null,
      module: { id: 'module-1', isPremium: false },
    })
    mockContentAccessService.canAccessLesson.mockResolvedValue({ allowed: true })
    mockProgressRepository.upsertLessonProgress.mockResolvedValue({
      id: 'progress-1',
      lessonId: 'lesson-1',
      status: 'COMPLETED',
    })
    mockPrisma.lesson.findMany.mockResolvedValue([
      { id: 'lesson-1' },
      { id: 'lesson-2' },
    ])
    mockPrisma.lessonProgress.count.mockResolvedValue(1)
    mockPrisma.moduleProgress.upsert.mockResolvedValue({
      userId: 'student-1',
      moduleId: 'module-1',
      percentComplete: 50,
    })

    const result = await setLessonCompletion('lesson-1', true)

    expect(mockRequireStudent).toHaveBeenCalledOnce()
    expect(mockContentAccessService.canAccessLesson).toHaveBeenCalledWith('student-1', false)
    expect(mockProgressRepository.upsertLessonProgress).toHaveBeenCalledWith('student-1', 'lesson-1', {
      status: 'COMPLETED',
      percentComplete: 100,
    })
    expect(result.moduleProgress.percentComplete).toBe(50)
  })

  it('rejects inaccessible premium lesson', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-premium-1',
      moduleId: 'module-premium',
      status: 'PUBLISHED',
      deletedAt: null,
      module: { id: 'module-premium', isPremium: true },
    })
    mockContentAccessService.canAccessLesson.mockResolvedValue({
      allowed: false,
      reason: 'Premium module access required',
    })

    await expect(setLessonCompletion('lesson-premium-1', true)).rejects.toThrow('Premium module access required')

    expect(mockProgressRepository.upsertLessonProgress).not.toHaveBeenCalled()
    expect(mockPrisma.moduleProgress.upsert).not.toHaveBeenCalled()
  })

  it('rejects unpublished lesson', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-draft',
      moduleId: 'module-1',
      status: 'DRAFT',
      deletedAt: null,
      module: { id: 'module-1', isPremium: false },
    })

    await expect(setLessonCompletion('lesson-draft', true)).rejects.toThrow('Lesson not found.')

    expect(mockContentAccessService.canAccessLesson).not.toHaveBeenCalled()
    expect(mockProgressRepository.upsertLessonProgress).not.toHaveBeenCalled()
  })

  it('rejects deleted lesson', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-deleted',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: new Date('2024-01-01'),
      module: { id: 'module-1', isPremium: false },
    })

    await expect(setLessonCompletion('lesson-deleted', true)).rejects.toThrow('Lesson not found.')

    expect(mockContentAccessService.canAccessLesson).not.toHaveBeenCalled()
    expect(mockProgressRepository.upsertLessonProgress).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated user', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockRequireStudent.mockRejectedValue(new Error('Student session required'))

    await expect(setLessonCompletion('lesson-1', true)).rejects.toThrow('Student session required')

    expect(mockPrisma.lesson.findUnique).not.toHaveBeenCalled()
  })

  it('prevents another student from modifying student 1 state', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockRequireStudent.mockResolvedValue({
      user: { id: 'student-1', role: 'STUDENT' },
    })
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: null,
      module: { id: 'module-1', isPremium: false },
    })
    mockContentAccessService.canAccessLesson.mockResolvedValue({ allowed: true })
    mockProgressRepository.upsertLessonProgress.mockResolvedValue({
      id: 'progress-1',
      userId: 'student-1', // Forced to student-1
      lessonId: 'lesson-1',
    })

    await setLessonCompletion('lesson-1', true)

    // Verify that the progress was written for student-1, not some other student
    expect(mockProgressRepository.upsertLessonProgress).toHaveBeenCalledWith('student-1', 'lesson-1', expect.any(Object))
  })

  it('marks lesson incomplete when completed=false', async () => {
    const { setLessonCompletion } = await import('@/server/actions/student-learning.actions')

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: null,
      module: { id: 'module-1', isPremium: false },
    })
    mockContentAccessService.canAccessLesson.mockResolvedValue({ allowed: true })
    mockProgressRepository.upsertLessonProgress.mockResolvedValue({
      id: 'progress-1',
      lessonId: 'lesson-1',
      status: 'IN_PROGRESS',
    })
    mockPrisma.lesson.findMany.mockResolvedValue([{ id: 'lesson-1' }])
    mockPrisma.lessonProgress.count.mockResolvedValue(0)
    mockPrisma.moduleProgress.upsert.mockResolvedValue({
      userId: 'student-1',
      moduleId: 'module-1',
      percentComplete: 0,
    })

    await setLessonCompletion('lesson-1', false)

    expect(mockProgressRepository.upsertLessonProgress).toHaveBeenCalledWith('student-1', 'lesson-1', {
      status: 'IN_PROGRESS',
      percentComplete: 0,
    })
  })
})
