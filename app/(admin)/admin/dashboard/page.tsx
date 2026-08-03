import { FiBookOpen, FiHelpCircle, FiLayers, FiPieChart, FiUsers } from "react-icons/fi"
import { redirect } from "next/navigation"
import { requirePermission } from "@/auth"
import PageHeader from "@/features/admin/components/PageHeader"
import StatsCard from "@/features/admin/components/StatsCard"
import Container from "@/components/ui/Container"
import Section from "@/components/ui/Section"
import { getDashboardSummaryAction } from "@/server/actions/admin-dashboard.actions"

export default async function AdminDashboardPage() {
  try {
    await requirePermission('viewAnalytics')
  } catch {
    redirect('/login')
  }

  const dashboard = await getDashboardSummaryAction()

  return (
    <Section className="bg-slate-50 py-12">
      <Container>
        <PageHeader
          title="Admin dashboard"
          description="Monitor platform usage, content counts, and course activity from the admin workspace."
        />

        <div className="grid gap-6 xl:grid-cols-3">
          {dashboard.summaryCards.map((card) => (
            <div key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
              {card.description ? <p className="mt-2 text-sm text-slate-500">{card.description}</p> : null}
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Overview</h2>
              <p className="mt-2 text-sm text-slate-600">Executive snapshot of platform performance.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {dashboard.sections.learning.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr] mt-10">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">Students</h2>
            <div className="mt-6 space-y-3">
              {dashboard.sections.students.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">Content</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dashboard.sections.content.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">System</h2>
              <p className="mt-2 text-sm text-slate-500">Monitor system health and service status.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboard.sections.system.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Container>
    </Section>
  )
}
