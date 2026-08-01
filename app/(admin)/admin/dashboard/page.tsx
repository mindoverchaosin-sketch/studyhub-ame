import { FiBookOpen, FiHelpCircle, FiLayers, FiPieChart, FiUsers } from "react-icons/fi"
import PageHeader from "@/features/admin/components/PageHeader"
import StatsCard from "@/features/admin/components/StatsCard"
import Container from "@/components/ui/Container"
import Section from "@/components/ui/Section"
import { getAdminCourses } from "@/server/services/course.service"
import { getUserCountByRole } from "@/server/services/user.service"
import { getTopicCount } from "@/server/services/topic.service"
import { getResourceCount } from "@/server/services/resource.service"
import { getQuestionCount } from "@/server/services/question.service"
import { getQuizAttemptCount } from "@/server/services/progress.service"
import { lessonRepository } from "@/server/repositories/lesson.repository"
import { quizRepository } from "@/server/repositories/quiz.repository"
import { LocalMediaProvider } from "@/services/media/local-media-provider"

async function getDashboardStats() {
  const [courses, students, topics, resources, questions, quizAttempts, lessons, mockTests, mediaAssets] = await Promise.all([
    getAdminCourses(),
    getUserCountByRole("STUDENT"),
    getTopicCount(),
    getResourceCount(),
    getQuestionCount(),
    getQuizAttemptCount(),
    lessonRepository.list({ take: 100 }),
    quizRepository.findAllPublished().catch(() => []),
    new LocalMediaProvider().list(),
  ])

  return {
    totalStudents: students,
    totalCourses: courses.length,
    totalModules: courses.reduce((sum, course) => sum + (course._count?.modules ?? 0), 0),
    totalTopics: topics,
    totalResources: resources,
    totalQuestions: questions,
    quizAttempts,
    totalLessons: lessons.length,
    drafts: lessons.filter((lesson: { status?: string }) => lesson.status === 'DRAFT').length,
    published: lessons.filter((lesson: { status?: string }) => lesson.status === 'PUBLISHED').length,
    archived: lessons.filter((lesson: { status?: string }) => lesson.status === 'ARCHIVED').length,
    mockTests: mockTests.length,
    mediaAssets: mediaAssets.length,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  return (
    <Section className="bg-slate-50 py-12">
      <Container>
        <PageHeader
          title="Admin dashboard"
          description="Monitor platform usage, content counts, and course activity from the admin workspace."
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <StatsCard title="Total students" value={stats.totalStudents} icon={<FiUsers />} />
          <StatsCard title="Total courses" value={stats.totalCourses} icon={<FiLayers />} />
          <StatsCard title="Total modules" value={stats.totalModules} icon={<FiBookOpen />} />
          <StatsCard title="Total topics" value={stats.totalTopics} icon={<FiHelpCircle />} />
          <StatsCard title="Total resources" value={stats.totalResources} icon={<FiPieChart />} />
          <StatsCard title="Total questions" value={stats.totalQuestions} icon={<FiLayers />} />
          <StatsCard title="Quiz attempts" value={stats.quizAttempts} icon={<FiBookOpen />} />
          <StatsCard title="Lessons" value={stats.totalLessons} icon={<FiBookOpen />} />
          <StatsCard title="Draft lessons" value={stats.drafts} icon={<FiHelpCircle />} />
          <StatsCard title="Published lessons" value={stats.published} icon={<FiPieChart />} />
          <StatsCard title="Archived lessons" value={stats.archived} icon={<FiLayers />} />
          <StatsCard title="Mock tests" value={stats.mockTests} icon={<FiBookOpen />} />
          <StatsCard title="Media assets" value={stats.mediaAssets} icon={<FiPieChart />} />
        </div>

        <section className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent platform activity</h2>
              <p className="mt-2 text-sm text-slate-600">
                Recent CMS activity is summarized here for content review, publishing, and media management.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Content activity</p>
              <p className="mt-2 text-sm text-slate-600">{stats.totalLessons} lessons and {stats.mockTests} mock tests are available for review.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Publishing queue</p>
              <p className="mt-2 text-sm text-slate-600">{stats.drafts} drafts are waiting to be published.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Media library</p>
              <p className="mt-2 text-sm text-slate-600">{stats.mediaAssets} reusable assets are available for lessons and content.</p>
            </div>
          </div>
        </section>
      </Container>
    </Section>
  )
}
