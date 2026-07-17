import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import CourseBrowserShell from "@/features/courses/components/CourseBrowserShell";
import CourseCard from "@/features/courses/components/CourseCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCourseBrowserData } from "@/features/courses/actions/course-browser";

export default async function StudentCoursesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { courses } = await getCourseBrowserData();

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main>
          <CourseBrowserShell
            title="Course browser"
            description="Browse published courses, follow your progress, and jump back into the next module whenever you are ready."
          >
            {courses.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState title="No courses available" description="Published courses will appear here once they are available to learners." />
            )}
          </CourseBrowserShell>
        </main>
      </div>
    </div>
  );
}
