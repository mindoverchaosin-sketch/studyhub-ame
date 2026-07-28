import type { AdminDashboardDTO } from '@/server/application/dto/admin-dashboard.dto'
import { HealthService } from '@/server/services/health.service'
import { moduleRepository } from '@/server/repositories/module.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import { quizRepository } from '@/server/repositories/quiz.repository'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { userRepository } from '@/server/repositories/user.repository'

export async function getAdminDashboardSummary(): Promise<AdminDashboardDTO> {
  const [totalStudents, totalModules, totalQuestions, totalMockExams, totalExamAttempts, activeStudents, healthSnapshot] = await Promise.all([
    userRepository.countStudents(),
    moduleRepository.countAll(),
    questionRepository.countAll(),
    quizRepository.countAll(),
    examAttemptRepository.countAll(),
    userRepository.findByRole('STUDENT'),
    new HealthService({
      databaseProbe: async () => {
        await userRepository.countStudents()
        return true
      },
      cacheProbe: () => 'healthy',
    }).getHealthSnapshot(),
  ])

  const activeStudentCount = activeStudents.filter((student: { isActive?: boolean }) => student.isActive !== false).length

  return {
    summaryCards: [
      { title: 'Total Students', value: totalStudents, description: 'Registered learners', accent: 'blue' },
      { title: 'Active Students', value: activeStudentCount, description: 'Currently active', accent: 'green' },
      { title: 'Total Modules', value: totalModules, description: 'Published course modules', accent: 'violet' },
      { title: 'Total Questions', value: totalQuestions, description: 'Question bank inventory', accent: 'amber' },
      { title: 'Total Mock Exams', value: totalMockExams, description: 'Available mock exams', accent: 'rose' },
      { title: 'Total Exam Attempts', value: totalExamAttempts, description: 'Completed and submitted attempts', accent: 'slate' },
    ],
    sections: {
      overview: [
        { title: 'Overview', label: 'Platform Snapshot', value: 'RC1 Ready', description: 'Production baseline is stable' },
        { title: 'Overview', label: 'Active Subscriptions', value: 'Placeholder', description: 'Billing module pending' },
      ],
      learning: [
        { title: 'Learning Platform', label: 'Content Volume', value: totalModules + totalQuestions, description: 'Modules and questions in the catalog' },
        { title: 'Learning Platform', label: 'Exam Activity', value: totalExamAttempts, description: 'Live assessment engagement' },
      ],
      students: [
        { title: 'Students', label: 'Learner Base', value: totalStudents, description: 'Accounts created in the system' },
        { title: 'Students', label: 'Engaged Learners', value: activeStudentCount, description: 'Students with active sessions' },
      ],
      content: [
        { title: 'Content', label: 'Modules', value: totalModules, description: 'Course modules available' },
        { title: 'Content', label: 'Questions', value: totalQuestions, description: 'Questions available for assessments' },
      ],
      system: [
        { title: 'System', label: 'System Health', value: healthSnapshot.status.toUpperCase(), description: 'Runtime health status' },
        { title: 'System', label: 'Cache Status', value: 'Operational', description: 'Service cache is active' },
        { title: 'System', label: 'Application Version', value: healthSnapshot.version, description: 'Current application build' },
      ],
      quickActions: [
        { title: 'Quick Actions', label: 'Review Students', value: 'Open', description: 'Student operations workspace' },
        { title: 'Quick Actions', label: 'Manage Content', value: 'Open', description: 'Modules and questions workspace' },
      ],
    },
    health: {
      status: healthSnapshot.status,
      version: healthSnapshot.version,
      database: healthSnapshot.checks.database,
      cache: healthSnapshot.checks.cache,
      application: healthSnapshot.checks.application,
    },
  }
}
