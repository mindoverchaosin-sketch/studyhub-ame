import { FiBookOpen, FiHelpCircle, FiLayers, FiPieChart, FiUsers } from "react-icons/fi"
import { UserRole } from "@prisma/client"
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

async function getDashboardStats() {
  const [courses, students, topics, resources, questions, quizAttempts] = await Promise.all([
    getAdminCourses(),
    getUserCountByRole(UserRole.STUDENT),
    getTopicCount(),
    getResourceCount(),
    getQuestionCount(),
    getQuizAttemptCount(),
  ])

  return {
    totalStudents: students,
    totalCourses: courses.length,
    totalModules: courses.reduce((sum, course) => sum + course._count.modules, 0),
    totalTopics: topics,
    totalResources: resources,
    totalQuestions: questions,
    quizAttempts,
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
        </div>

        <section className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent platform activity</h2>
              <p className="mt-2 text-sm text-slate-600">
                Activity streams and moderation workflows will be surfaced here once the admin CMS expands.
              </p>
            </div>
          </div>
        </section>
      </Container>
    </Section>
  )
}
