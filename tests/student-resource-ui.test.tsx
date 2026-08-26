import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  requireStudent: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`) }),
  notFound: vi.fn((): never => { throw new Error('NOT_FOUND') }),
  getModuleBySlug: vi.fn(),
  getModuleById: vi.fn(),
  getModuleWithSections: vi.fn(),
  getCourseById: vi.fn(),
  getTopicBySlug: vi.fn(),
  getTopicProgress: vi.fn(),
  getStudentProgress: vi.fn(),
  getQuestionsByTopic: vi.fn(),
  getQuizByTopic: vi.fn(),
  findByLesson: vi.fn(),
  findPublishedById: vi.fn(),
  canAccessPremiumModules: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: (props: { href: string; target?: string; rel?: string; className?: string; children?: React.ReactNode }) => (
    <a href={props.href} target={props.target} rel={props.rel} className={props.className}>{props.children}</a>
  ),
}))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound, usePathname: () => '/' }))
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }))
vi.mock('@/auth', () => ({ auth: mocks.auth, requireStudent: mocks.requireStudent }))
vi.mock('@/server/repositories/resource.repository', () => ({
  resourceRepository: { findByLesson: mocks.findByLesson, findPublishedById: mocks.findPublishedById },
}))
vi.mock('@/server/domains/billing/entitlements/entitlement.service', () => ({
  entitlementService: { canAccessPremiumModules: mocks.canAccessPremiumModules },
}))
vi.mock('@/server/services/module.service', () => ({
  getModuleBySlug: mocks.getModuleBySlug,
  getModuleById: mocks.getModuleById,
  getModuleWithSections: mocks.getModuleWithSections,
}))
vi.mock('@/server/services/course.service', () => ({ getCourseById: mocks.getCourseById }))
vi.mock('@/server/services/topic.service', () => ({ getTopicBySlug: mocks.getTopicBySlug }))
vi.mock('@/server/services/progress.service', () => ({ getTopicProgress: mocks.getTopicProgress, getStudentProgress: mocks.getStudentProgress }))
vi.mock('@/server/services/question.service', () => ({ getQuestionsByTopic: mocks.getQuestionsByTopic }))
vi.mock('@/server/services/quiz.service', () => ({ getQuizByTopic: mocks.getQuizByTopic }))

const studyMaterial = (overrides: Record<string, unknown> = {}) => ({
  id: 'res-1',
  moduleId: 'module-1',
  lessonId: 'topic-1',
  title: 'Airframes notes',
  description: 'Persisted material',
  materialType: 'PDF',
  url: '/media/media/res-1-secret.pdf',
  isPremium: false,
  status: 'PUBLISHED',
  publishedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  ...overrides,
})

const freeMaterial = studyMaterial({ id: 'res-free', title: 'Free notes' })
const premiumMaterial = studyMaterial({ id: 'res-premium', title: 'Premium notes', isPremium: true })
const bothMaterials = [freeMaterial, premiumMaterial]

const BILLING_HREF = '/student/dashboard/billing?reason=resource-access&feature=premiumModules'
const deliveryHref = (id: string) => `/api/student/resources/${id}?lessonId=topic-1&moduleId=module-1`

const renderedHrefs = (container: HTMLElement) => Array.from(container.querySelectorAll('a')).map((anchor) => anchor.getAttribute('href') ?? '')
const hasExactLink = (container: HTMLElement, href: string) => renderedHrefs(container).includes(href)
const hasPrefixedLink = (container: HTMLElement, prefix: string) => renderedHrefs(container).some((href) => href.startsWith(prefix))
const prefixedLinkHref = (container: HTMLElement, prefix: string) => renderedHrefs(container).find((href) => href.startsWith(prefix))

describe('Phase 6A student resource UI consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'student-1' } })
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.canAccessPremiumModules.mockResolvedValue(true)
    mocks.getTopicBySlug.mockResolvedValue({ id: 'topic-1', moduleId: 'module-1', slug: 'hydraulics', title: 'Hydraulics', description: 'Desc', estimatedMinutes: 20, difficulty: 'BEGINNER' })
    mocks.getTopicProgress.mockResolvedValue(null)
    mocks.getStudentProgress.mockResolvedValue([])
    mocks.getQuestionsByTopic.mockResolvedValue([])
    mocks.getQuizByTopic.mockResolvedValue(null)
    mocks.getModuleBySlug.mockResolvedValue({ id: 'module-1', courseId: 'course-1', slug: 'systems', title: 'Systems', description: 'M', isPremium: false })
    mocks.getModuleById.mockResolvedValue({ id: 'module-1', courseId: 'course-1', slug: 'systems', title: 'Systems', isPremium: false })
    mocks.getModuleWithSections.mockResolvedValue({ sections: [{ id: 'topic-1', slug: 'hydraulics', title: 'Hydraulics' }] })
    mocks.getCourseById.mockResolvedValue({ id: 'course-1', slug: 'course', title: 'Course' })
    mocks.findByLesson.mockResolvedValue(bothMaterials)
  })

  describe('getStudentResourceAccess', () => {
    it('blocks unpublished, archived, and deleted materials through the published-only lookup', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(null)

      await expect(getStudentResourceAccess('student-1', 'res-1', 'topic-1', 'module-1')).resolves.toBeNull()
      expect(mocks.findPublishedById).toHaveBeenCalledWith('res-1')
    })

    it('blocks a lessonId mismatch', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(premiumMaterial)

      await expect(getStudentResourceAccess('student-1', 'res-premium', 'lesson-other', 'module-1')).resolves.toBeNull()
    })

    it('blocks a moduleId mismatch', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(premiumMaterial)

      await expect(getStudentResourceAccess('student-1', 'res-premium', 'topic-1', 'module-other')).resolves.toBeNull()
    })

    it('allows free materials without consulting entitlements', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(freeMaterial)

      await expect(getStudentResourceAccess('student-1', 'res-free', 'topic-1', 'module-1')).resolves.toMatchObject({ allowed: true })
      expect(mocks.canAccessPremiumModules).not.toHaveBeenCalled()
    })

    it('allows entitled premium materials', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(premiumMaterial)
      mocks.canAccessPremiumModules.mockResolvedValueOnce(true)

      const access = await getStudentResourceAccess('student-1', 'res-premium', 'topic-1', 'module-1')
      expect(access?.allowed).toBe(true)
      expect(mocks.canAccessPremiumModules).toHaveBeenCalledWith('student-1')
    })

    it('denies unentitled premium materials with the premiumModules feature requirement', async () => {
      const { getStudentResourceAccess } = await import('@/server/services/resource.service')
      mocks.findPublishedById.mockResolvedValueOnce(premiumMaterial)
      mocks.canAccessPremiumModules.mockResolvedValueOnce(false)

      const access = await getStudentResourceAccess('student-1', 'res-premium', 'topic-1', 'module-1')
      expect(access?.allowed).toBe(false)
      expect(access?.requiredFeature).toBe('premiumModules')
      expect(access?.reason).toBeTruthy()
    })
  })

  describe('getTopicLearningPageData mapping', () => {
    it('exposes id/isPremium and never leaks storage urls or status', async () => {
      const { getTopicLearningPageData } = await import('@/features/topics/actions/topic-learning')

      const data = await getTopicLearningPageData('hydraulics')

      expect(data?.resources).toHaveLength(2)
      for (const resource of data!.resources) {
        expect(resource).toHaveProperty('id')
        expect(resource).toHaveProperty('isPremium')
        expect(resource).not.toHaveProperty('url')
        expect(resource).not.toHaveProperty('status')
      }
      expect(data?.resources.map((resource) => resource.isPremium)).toEqual([false, true])
      expect(JSON.stringify(data)).not.toContain('/media/')
    })
  })

  describe('ResourceCard', () => {
    const ResourceCardComponent = () => import('@/features/topics/components/ResourceCard')

    it('renders the Upgrade CTA for locked premium resources', async () => {
      const { default: ResourceCard } = await ResourceCardComponent()
      const { container } = render(<ResourceCard id="res-premium" title="Premium notes" description={null} type="PDF" locked lessonId="topic-1" moduleId="module-1" />)

      expect(hasExactLink(container, BILLING_HREF)).toBe(true)
      expect(hasPrefixedLink(container, '/api/student/resources/')).toBe(false)
    })

    it('renders the delivery API link for unlocked resources without a billing CTA', async () => {
      const { default: ResourceCard } = await ResourceCardComponent()
      const { container } = render(<ResourceCard id="res-free" title="Free notes" description={null} type="PDF" locked={false} lessonId="topic-1" moduleId="module-1" />)

      expect(prefixedLinkHref(container, '/api/student/resources/')).toBe(deliveryHref('res-free'))
      const openAnchor = Array.from(container.querySelectorAll('a')).find((anchor) => (anchor.getAttribute('href') ?? '').startsWith('/api/student/resources/'))
      expect(openAnchor?.getAttribute('target')).toBe('_blank')
      expect(openAnchor?.getAttribute('rel')).toBe('noreferrer')
      expect(hasExactLink(container, BILLING_HREF)).toBe(false)
    })

    it('encodes the lessonId/moduleId query binding', async () => {
      const { default: ResourceCard } = await ResourceCardComponent()
      const { container } = render(<ResourceCard id="res-x" title="Encoded" description={null} type="PDF" locked={false} lessonId="topic a&b" moduleId="module c/d" />)

      expect(prefixedLinkHref(container, '/api/student/resources/')).toBe('/api/student/resources/res-x?lessonId=topic%20a%26b&moduleId=module%20c%2Fd')
    })
  })

  describe('lesson page rendering', () => {
    it('locks premium resources when the student lacks entitlement while free resources stay open', async () => {
      const { default: LessonPage } = await import('@/app/(student)/student/modules/[slug]/lessons/[lessonSlug]/page')
      mocks.canAccessPremiumModules.mockResolvedValue(false)

      const ui = await LessonPage({ params: Promise.resolve({ slug: 'systems', lessonSlug: 'hydraulics' }) })
      const { container } = render(ui)

      expect(hasPrefixedLink(container, '/api/student/resources/res-premium')).toBe(false)
      expect(hasExactLink(container, BILLING_HREF)).toBe(true)
      expect(prefixedLinkHref(container, '/api/student/resources/res-free')).toBe(deliveryHref('res-free'))
    })

    it('opens entitled premium resources through the bound delivery API', async () => {
      const { default: LessonPage } = await import('@/app/(student)/student/modules/[slug]/lessons/[lessonSlug]/page')
      mocks.canAccessPremiumModules.mockResolvedValue(true)

      const ui = await LessonPage({ params: Promise.resolve({ slug: 'systems', lessonSlug: 'hydraulics' }) })
      const { container } = render(ui)

      expect(prefixedLinkHref(container, '/api/student/resources/res-premium')).toBe(deliveryHref('res-premium'))
      expect(hasExactLink(container, BILLING_HREF)).toBe(false)
    })
  })

  describe('topic page rendering', () => {
    it('matches lesson page behavior for unentitled students', async () => {
      const { default: TopicPage } = await import('@/app/(student)/student/topics/[topicSlug]/page')
      mocks.canAccessPremiumModules.mockResolvedValue(false)

      const ui = await TopicPage({ params: Promise.resolve({ topicSlug: 'hydraulics' }) })
      const { container } = render(ui)

      expect(hasPrefixedLink(container, '/api/student/resources/res-premium')).toBe(false)
      expect(hasExactLink(container, BILLING_HREF)).toBe(true)
      expect(prefixedLinkHref(container, '/api/student/resources/res-free')).toBe(deliveryHref('res-free'))
    })

    it('matches lesson page behavior for entitled students', async () => {
      const { default: TopicPage } = await import('@/app/(student)/student/topics/[topicSlug]/page')
      mocks.canAccessPremiumModules.mockResolvedValue(true)

      const ui = await TopicPage({ params: Promise.resolve({ topicSlug: 'hydraulics' }) })
      const { container } = render(ui)

      expect(prefixedLinkHref(container, '/api/student/resources/res-premium')).toBe(deliveryHref('res-premium'))
      expect(prefixedLinkHref(container, '/api/student/resources/res-free')).toBe(deliveryHref('res-free'))
      expect(hasExactLink(container, BILLING_HREF)).toBe(false)
    })
  })
})
