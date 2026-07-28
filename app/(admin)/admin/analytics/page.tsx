import { redirect } from 'next/navigation'
import { requireAdmin } from '@/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import PageHeader from '@/components/admin/PageHeader'
import { getAnalyticsDashboardAction } from '@/server/actions/analytics.actions'

// Card component for metric displays
function MetricCard({ label, value, format }: { label: string; value: number | null; format?: (v: number) => string }) {
  const displayValue = value === null ? 'N/A' : format ? format(value) : value.toString()
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{displayValue}</p>
    </div>
  )
}

// Bar chart component (simple HTML-based)
function SimpleBarChart({ data, title }: { data: Array<{ name: string; value: number }>; title: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-24 text-sm text-gray-600">{item.name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${(item.value / maxValue) * 100}%` }}></div>
            </div>
            <div className="w-12 text-right font-semibold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pie chart component (simple HTML-based)
function SimplePieChart({ data, title, colors }: { data: Array<{ name: string; value: number }>; title: string; colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
            <span className="text-sm text-gray-700">{item.name}</span>
            <span className="ml-auto text-sm font-semibold">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
            <span className="text-sm text-gray-600">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  let dashboard
  try {
    dashboard = await getAnalyticsDashboardAction()
  } catch (error) {
    redirect('/login')
  }

  // Format percentages
  const formatPercent = (v: number) => `${Math.round(v * 10) / 10}%`
  const formatScore = (v: number) => `${Math.round(v * 10) / 10}`

  // Prepare data for difficulty distribution chart
  const difficultyData = [
    { name: 'Beginner', value: dashboard.questionBank.byDifficulty.BEGINNER || 0 },
    { name: 'Intermediate', value: dashboard.questionBank.byDifficulty.INTERMEDIATE || 0 },
    { name: 'Advanced', value: dashboard.questionBank.byDifficulty.ADVANCED || 0 },
  ]

  // Prepare data for publishing status chart
  const publishingData = [
    { name: 'Draft', value: dashboard.publishing.draftCount },
    { name: 'Published', value: dashboard.publishing.publishedCount },
    { name: 'Archived', value: dashboard.publishing.archivedCount },
  ]

  const COLORS = ['#fbbf24', '#10b981', '#ef4444']

  // Prepare data for module usage chart
  const moduleData = (dashboard.learning.mostStudiedModules || []).slice(0, 10).map((m: any) => ({
    name: m.moduleName.substring(0, 15),
    value: m.usageCount,
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Analytics Dashboard" description="Enterprise analytics and metrics for administrators." />

        {/* Overview Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Total Students" value={dashboard.students.totalStudents} />
            <MetricCard label="Active Students" value={dashboard.students.activeStudents} />
            <MetricCard label="New Registrations" value={dashboard.students.newRegistrations} />
            <MetricCard label="Total Questions" value={dashboard.questionBank.totalQuestions} />
            <MetricCard label="Published Content" value={dashboard.publishing.publishedCount} />
          </div>
        </section>

        {/* Students Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Student Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Total Students" value={dashboard.students.totalStudents} />
            <MetricCard label="Active Students" value={dashboard.students.activeStudents} />
            <MetricCard label="New Registrations (30d)" value={dashboard.students.newRegistrations} />
          </div>
        </section>

        {/* Learning Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Learning Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard label="Module Completion Rate" value={dashboard.learning.moduleCompletionRate} format={formatPercent} />
            <MetricCard label="Resource Usage Count" value={dashboard.learning.resourceUsageCount} />
          </div>

          {moduleData.length > 0 && <SimpleBarChart data={moduleData} title="Most Studied Modules" />}
        </section>

        {/* Question Bank Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Question Bank Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard label="Total Questions" value={dashboard.questionBank.totalQuestions} />
            <SimplePieChart data={difficultyData} title="Questions by Difficulty" colors={COLORS} />
          </div>

          {dashboard.questionBank.byModule.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Questions by Module (Top 10)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dashboard.questionBank.byModule.map((m: any) => (
                  <div key={m.moduleId} className="flex justify-between items-center p-2 border border-gray-100 rounded">
                    <span className="text-sm text-gray-700">{m.moduleName}</span>
                    <span className="font-semibold text-gray-900">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard.questionBank.recentlyAdded.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Recently Added Questions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dashboard.questionBank.recentlyAdded.map((q: any) => (
                  <div key={q.questionId} className="p-2 border border-gray-100 rounded">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm text-gray-700 flex-1">{q.prompt}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${q.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-700' : q.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Mock Exams Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Mock Exam Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="Total Attempts" value={dashboard.mockExams.totalAttempts} />
            <MetricCard label="Average Score" value={dashboard.mockExams.averageScore} format={formatScore} />
            <MetricCard label="Pass Rate" value={dashboard.mockExams.passRate} format={formatPercent} />
            <MetricCard label="Completion Rate" value={dashboard.mockExams.completionRate} format={formatPercent} />
          </div>
        </section>

        {/* Publishing Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Publishing Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <MetricCard label="Draft" value={dashboard.publishing.draftCount} />
              <MetricCard label="Published" value={dashboard.publishing.publishedCount} />
              <MetricCard label="Archived" value={dashboard.publishing.archivedCount} />
            </div>

            <SimplePieChart data={publishingData} title="Publishing Status" colors={COLORS} />
          </div>

          {Object.entries(dashboard.publishing.byEntityType || {}).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Content by Entity Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(dashboard.publishing.byEntityType).map(([entityType, counts]: any) => (
                  <div key={entityType} className="border border-gray-200 rounded p-4">
                    <p className="font-semibold text-gray-900">{entityType}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Draft:</span>
                        <span className="font-semibold">{counts.draft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Published:</span>
                        <span className="font-semibold">{counts.published}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archived:</span>
                        <span className="font-semibold">{counts.archived}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Generated At Footer */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          Last updated: {new Date(dashboard.generatedAt).toLocaleString()}
        </div>
      </div>
    </AdminLayout>
  )
}
