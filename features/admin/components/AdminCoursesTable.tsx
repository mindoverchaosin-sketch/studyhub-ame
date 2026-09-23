"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import SearchToolbar from "@/features/admin/components/SearchToolbar"
import Pagination from "@/features/admin/components/Pagination"
import StatusBadge from "@/features/admin/components/StatusBadge"

export type AdminCourseRow = {
  id: string
  title: string
  slug: string
  examType: string
  isPublished: boolean
  moduleCount: number
  createdAt: string
}

type AdminCoursesTableProps = {
  courses: AdminCourseRow[]
}

const PAGE_SIZE = 8
const courseDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
})

export default function AdminCoursesTable({ courses }: AdminCoursesTableProps) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return courses

    return courses.filter((course) =>
      course.title.toLowerCase().includes(normalized) || course.examType.toLowerCase().includes(normalized),
    )
  }, [courses, query])

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Search courses by title or exam type" />

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <table className="min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Course</th>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Exam Type</th>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Published</th>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Modules</th>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Created</th>
              <th className="px-5 py-4 font-medium uppercase tracking-[0.18em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((course, index) => (
              <tr key={course.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-950">{course.title}</div>
                  <div className="text-sm text-slate-500">{course.slug}</div>
                </td>
                <td className="px-5 py-4 text-slate-700">{course.examType}</td>
                <td className="px-5 py-4">
                  <StatusBadge label={course.isPublished ? "Published" : "Draft"} tone={course.isPublished ? "success" : "neutral"} />
                </td>
                <td className="px-5 py-4">{course.moduleCount}</td>
                <td className="px-5 py-4">{courseDateFormatter.format(new Date(course.createdAt))}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/courses/${course.id}`} className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                      Edit
                    </Link>
                    <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      {course.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" disabled className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 transition cursor-not-allowed">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
