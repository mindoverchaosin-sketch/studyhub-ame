import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import CourseBrowserShell from "@/features/courses/components/CourseBrowserShell";
import EmptyState from "@/components/dashboard/EmptyState";
import { getModuleDetailPageData } from "@/features/courses/actions/course-browser";

type ModuleDetailPageProps = {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
};

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { courseSlug, moduleSlug } = await params;
  const data = await getModuleDetailPageData(courseSlug, moduleSlug);

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main>
          <CourseBrowserShell
            title={data.module.title}
            description={data.module.description || "Review sections and topics in this module to keep your study plan moving."}
          >
            {data.sections.length > 0 ? (
              <div className="space-y-4">
                {data.sections.map((section) => (
                  <section key={section.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
                        <p className="mt-2 text-sm text-slate-600">{section.completedTopics}/{section.topicCount} topics complete</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{section.progressPercent}%</span>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState title="No sections available" description="This module does not have published sections yet." />
            )}

            <div className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Topics</h2>
                  <p className="mt-2 text-sm text-slate-600">Open a topic to continue your study flow.</p>
                </div>
              </div>

              {data.topics.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {data.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-950">{topic.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{topic.description || "Revision material and practice resources."}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">{topic.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No topics available" description="This module has no published topics yet." />
              )}
            </div>
          </CourseBrowserShell>
        </main>
      </div>
    </div>
  );
}
