import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`) }),
  notFound: vi.fn((): never => { throw new Error('NOT_FOUND') }),
  getModuleBySlug: vi.fn(),
  getModuleById: vi.fn(),
  getModuleWithSections: vi.fn(),
  getCourseById: vi.fn(),
  getStudentProgress: vi.fn(),
  getResourcesByTopic: vi.fn(),
  getQuizByTopic: vi.fn(),
  canAccessModule: vi.fn(),
  canAccessStudyMaterial: vi.fn(),
  getTopicBySlug: vi.fn(),
  getTopicLearningPageData: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireStudent: mocks.requireStudent }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }))
vi.mock('@/server/services/module.service', () => ({ getModuleBySlug: mocks.getModuleBySlug, getModuleById: mocks.getModuleById, getModuleWithSections: mocks.getModuleWithSections }))
vi.mock('@/server/services/course.service', () => ({ getCourseById: mocks.getCourseById }))
vi.mock('@/server/services/progress.service', () => ({ getStudentProgress: mocks.getStudentProgress }))
vi.mock('@/server/services/resource.service', () => ({ getResourcesByTopic: mocks.getResourcesByTopic }))
vi.mock('@/server/services/quiz.service', () => ({ getQuizByTopic: mocks.getQuizByTopic }))
vi.mock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessModule: mocks.canAccessModule, canAccessLesson: mocks.canAccessModule, canAccessStudyMaterial: mocks.canAccessStudyMaterial } }))
vi.mock('@/server/services/topic.service', () => ({ getTopicBySlug: mocks.getTopicBySlug }))
vi.mock('@/features/topics/actions/topic-learning', () => ({ getTopicLearningPageData: mocks.getTopicLearningPageData }))

describe('persisted student learning routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.canAccessModule.mockResolvedValue({ allowed: true })
    mocks.canAccessStudyMaterial.mockResolvedValue({ allowed: true })
    mocks.getModuleBySlug.mockResolvedValue({ id: 'module-1', courseId: 'course-1', slug: 'systems', title: 'Systems', description: 'Persisted', isPremium: false })
    mocks.getModuleById.mockResolvedValue({ id: 'module-1', isPremium: false })
    mocks.getModuleWithSections.mockResolvedValue({ sections: [{ id: 'lesson-1', slug: 'hydraulics', title: 'Hydraulics', description: 'Lesson', order: 1 }] })
    mocks.getCourseById.mockResolvedValue({ id: 'course-1', slug: 'course', title: 'Course' })
    mocks.getStudentProgress.mockResolvedValue([])
    mocks.getResourcesByTopic.mockResolvedValue([])
    mocks.getQuizByTopic.mockResolvedValue(null)
    mocks.getTopicBySlug.mockResolvedValue({ id: 'topic-1', moduleId: 'module-1', slug: 'hydraulics', title: 'Hydraulics' })
    mocks.getTopicLearningPageData.mockResolvedValue({ topic: { title: 'Hydraulics', description: 'Persisted' }, resources: [], questions: [], quiz: null, progress: { status: 'NOT_STARTED' }, navigation: {} })
  })

  it('loads a persisted module and does not consult mockModules', async () => {
    const { default: page } = await import('@/app/(student)/student/modules/[slug]/page')
    await expect(page({ params: Promise.resolve({ slug: 'systems' }) })).resolves.toBeTruthy()
    expect(mocks.getModuleBySlug).toHaveBeenCalledWith('systems')
  })

  it('denies a premium module before loading its lessons', async () => {
    mocks.getModuleBySlug.mockResolvedValue({ id: 'module-1', isPremium: true })
    mocks.canAccessModule.mockResolvedValue({ allowed: false, requiredFeature: 'premiumModules' })
    const { default: page } = await import('@/app/(student)/student/modules/[slug]/page')

    await expect(page({ params: Promise.resolve({ slug: 'premium' }) })).rejects.toThrow('REDIRECT:')
    expect(mocks.getModuleWithSections).not.toHaveBeenCalled()
  })

  it('returns not found for a missing persisted module', async () => {
    mocks.getModuleBySlug.mockResolvedValue(null)
    const { default: page } = await import('@/app/(student)/student/modules/[slug]/page')
    await expect(page({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow('NOT_FOUND')
  })

  it('enforces lesson access through the persisted parent module', async () => {
    mocks.getModuleBySlug.mockResolvedValue({ id: 'module-1', slug: 'systems', isPremium: true })
    mocks.canAccessModule.mockResolvedValueOnce({ allowed: false, requiredFeature: 'premiumModules' })
    const { default: page } = await import('@/app/(student)/student/modules/[slug]/lessons/[lessonSlug]/page')

    await expect(page({ params: Promise.resolve({ slug: 'systems', lessonSlug: 'hydraulics' }) })).rejects.toThrow('REDIRECT:')
    expect(mocks.getTopicBySlug).not.toHaveBeenCalled()
  })

  it('loads persisted topic data after parent module access is allowed', async () => {
    const { default: page } = await import('@/app/(student)/student/modules/[slug]/lessons/[lessonSlug]/page')
    await expect(page({ params: Promise.resolve({ slug: 'systems', lessonSlug: 'hydraulics' }) })).resolves.toBeTruthy()
    expect(mocks.getTopicLearningPageData).toHaveBeenCalledWith('hydraulics')
  })

  it('enforces topic access before the existing topic learning action', async () => {
    mocks.canAccessModule.mockResolvedValueOnce({ allowed: false, requiredFeature: 'premiumModules' })
    const { default: page } = await import('@/app/(student)/student/topics/[topicSlug]/page')

    await expect(page({ params: Promise.resolve({ topicSlug: 'hydraulics' }) })).rejects.toThrow('REDIRECT:')
    expect(mocks.getTopicLearningPageData).not.toHaveBeenCalled()
  })

  it('points the dashboard sidebar AI Tutor navigation to the enforced route', () => {
    const source = readFileSync(resolve(process.cwd(), 'components/dashboard/DashboardSidebar.tsx'), 'utf8')
    expect(source).toContain('href: "/student/ai-tutor"')
  })
})