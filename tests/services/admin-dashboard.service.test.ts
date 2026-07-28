import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('admin dashboard service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds dashboard summary cards from repository counts', async () => {
    const userRepository = {
      countStudents: vi.fn().mockResolvedValue(42),
      findByRole: vi.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]),
    }

    const moduleRepository = {
      countAll: vi.fn().mockResolvedValue(8),
    }

    const questionRepository = {
      countAll: vi.fn().mockResolvedValue(156),
    }

    const quizRepository = {
      countAll: vi.fn().mockResolvedValue(12),
    }

    const examAttemptRepository = {
      countAll: vi.fn().mockResolvedValue(91),
    }

    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))
    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/quiz.repository', () => ({ quizRepository }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository }))
    vi.doMock('@/server/services/health.service', () => ({
      HealthService: class {
        async getHealthSnapshot() {
          return {
            status: 'healthy',
            version: '1.2.3',
            checks: { database: 'healthy', cache: 'healthy', application: 'healthy' },
          }
        }
      },
    }))

    const { getAdminDashboardSummary } = await import('../../server/services/admin-dashboard.service')
    const dto = await getAdminDashboardSummary()

    expect(dto.summaryCards[0]).toMatchObject({ title: 'Total Students', value: 42 })
    expect(dto.summaryCards[1]).toMatchObject({ title: 'Active Students', value: 2 })
    expect(dto.summaryCards[2]).toMatchObject({ title: 'Total Modules', value: 8 })
    expect(dto.summaryCards[3]).toMatchObject({ title: 'Total Questions', value: 156 })
    expect(dto.summaryCards[4]).toMatchObject({ title: 'Total Mock Exams', value: 12 })
    expect(dto.summaryCards[5]).toMatchObject({ title: 'Total Exam Attempts', value: 91 })
    expect(dto.sections.system).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'System Health' })]))
  })
})
