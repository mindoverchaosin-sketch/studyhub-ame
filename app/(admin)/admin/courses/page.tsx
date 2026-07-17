import PageHeader from "@/features/admin/components/PageHeader"
import AdminCoursesTable from "@/features/admin/components/AdminCoursesTable"
import Container from "@/components/ui/Container"
import Section from "@/components/ui/Section"
import { getAdminCourses } from "@/server/services/course.service"

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses()

  return (
    <Section className="bg-slate-50 py-12">
      <Container>
        <PageHeader
          title="Courses"
          description="Manage course content, publication state, and module structure from the admin workspace."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Courses" },
          ]}
        />

        <div className="space-y-8">
          {courses.length > 0 ? (
            <AdminCoursesTable
              courses={courses.map((course) => ({
                id: course.id,
                title: course.title,
                slug: course.slug,
                examType: course.examType,
                isPublished: course.isPublished,
                moduleCount: course._count.modules,
                createdAt: course.createdAt.toISOString(),
              }))}
            />
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-10 shadow-sm shadow-slate-900/5">
              <h2 className="text-xl font-semibold text-slate-950">No courses available</h2>
              <p className="mt-3 text-sm text-slate-500">
                Create course content in the admin backend to populate this list.
              </p>
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
