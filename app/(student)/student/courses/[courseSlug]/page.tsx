import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import CourseBrowserShell from "@/features/courses/components/CourseBrowserShell";
import ModuleCard from "@/features/courses/components/ModuleCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCourseDetailPageData } from "@/features/courses/actions/course-browser";

type CourseDetailPageProps = {
  params: Promise<{ courseSlug: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { courseSlug } = await params;
  const data = await getCourseDetailPageData(courseSlug);

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main>
          <CourseBrowserShell
            title={data.course.title}
            description={data.course.description || "Explore structured modules and progress through the course at your own pace."}
          >
            {data.modules.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {data.modules.map((module) => (
                  <ModuleCard key={module.id} courseSlug={data.course.slug} module={module} />
                ))}
              </div>
            ) : (
              <EmptyState title="No modules yet" description="This course does not have published modules yet." />
            )}
          </CourseBrowserShell>
        </main>
      </div>
    </div>
  );
}
