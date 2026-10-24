import { redirect } from "next/navigation"
import { requirePermission } from "@/auth"import PageHeader from "@/features/admin/components/PageHeader"
import AdminCoursesTable from "@/features/admin/components/AdminCoursesTable"
import Container from "@/components/ui/Container"
import Section from "@/components/ui/Section"
import { getAdminCourses } from "@/server/services/course.service"
import Link from "next/link"

export default async function AdminCoursesPage() {
  try {
    await requirePermission("manageCourses")
  } catch {
    redirect("/login")
  }

  const courses = await getAdminCourses()

  return (
    <Section className="bg-slate-50 py-12">
        <Container>
          <PageHeader
            title="Courses"
            description="Manage courses, category assignments, publication state, and module structure."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Courses" },
            ]}
          />

          <div className="space-y-8">
            <div className="flex justify-end">
              <Link href="/admin/courses/new" className="inline-flex min-h-10 items-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                Create course
              </Link>
            </div>
            {courses.length > 0 ? (
              <AdminCoursesTable
                courses={courses.map((course) => ({
                  id: course.id,
                  title: course.title,
                  slug: course.slug,
                  examType: course.categoryTitle ?? "General",
                  isPublished: course.status === "PUBLISHED",
                  moduleCount: course._count?.modules ?? 0,
                  createdAt: course.createdAt.toISOString(),
                }))}
              />
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-10 shadow-sm shadow-slate-900/5">
                <h2 className="text-xl font-semibold text-slate-950">No courses available</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Create a course to start organizing modules and lessons.
                </p>
              </div>
            )}
          </div>
        </Container>
      </Section>
  )
}
