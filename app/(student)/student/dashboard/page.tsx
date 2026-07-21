import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import ContinueLearningCard from "@/components/dashboard/ContinueLearningCard";
import ProgressOverview from "@/components/dashboard/ProgressOverview";
import DashboardSection from "@/components/dashboard/DashboardSection";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ContinueLearning from "@/components/dashboard/ContinueLearning";
import { dashboardContinueLearningMock } from "@/lib/mock/dashboard";

export default async function StudentDashboardPage() {
  try {
    await requireStudent();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <main className="space-y-6" aria-labelledby="dashboard-heading">
          <WelcomeBanner studentName="Aarav Sharma" targetExam="DGCA" />

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <ContinueLearning items={dashboardContinueLearningMock} />

            <DashboardSection title="My courses" description="A curated view of the learning tracks prepared for you.">
              <div className="space-y-3">
                {[
                  {
                    title: "DGCA Paper 1",
                    description: "Core technical knowledge for your upcoming exam.",
                    badge: "Priority",
                  },
                  {
                    title: "EASA Human Factors",
                    description: "Practical concepts for safe decision-making.",
                    badge: "New",
                  },
                ].map((course) => (
                  <div key={course.title} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{course.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{course.description}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                        {course.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardSection>
          </div>

          <ProgressOverview modulesCompleted={6} topicsCompleted={18} quizScore={84} />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <DashboardSection title="Quick actions" description="Jump straight into your next study milestone.">
              <QuickActions />
            </DashboardSection>

            <DashboardSection title="Recent activity" description="A snapshot of your latest momentum and progress.">
              <RecentActivity />
            </DashboardSection>
          </div>
        </main>
      </div>
    </div>
  );
}
