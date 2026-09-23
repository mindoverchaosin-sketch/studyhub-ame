"use client"

import { useMemo, useState } from 'react'
import { FiBookOpen, FiFilter, FiSearch } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import CourseCard from '@/features/courses/components/CourseCard'
import EmptyState from '@/components/dashboard/EmptyState'
import DashboardSection from '@/components/dashboard/DashboardSection'
import type { CourseBrowserCourse } from '@/features/courses/types'
import type { ModuleExamType, ModuleStatus } from '@/types/module'

type SortOption = 'progress' | 'alphabetical'
type CourseStatus = Exclude<ModuleStatus, 'LOCKED'>

export default function ModulesPageClient({ courses }: { courses: CourseBrowserCourse[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL')
  const [examFilter, setExamFilter] = useState<ModuleExamType | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('progress')

  const courseStatus = (course: CourseBrowserCourse): CourseStatus => {
    if (course.progressPercent >= 100) return 'COMPLETED'
    if (course.progressPercent > 0) return 'IN_PROGRESS'
    return 'NOT_STARTED'
  }

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const modules = courses.filter((course) => {
      const matchesStatus = statusFilter === 'ALL' || courseStatus(course) === statusFilter
      const matchesExam = examFilter === 'ALL' || course.examType === examFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        (course.description ?? '').toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesExam && matchesQuery
    })

    return [...modules].sort((left, right) => {
      if (sortBy === 'alphabetical') {
        return left.title.localeCompare(right.title)
      }
      return right.progressPercent - left.progressPercent
    })
  }, [courses, query, sortBy, statusFilter, examFilter])

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Continue learning</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Premium course catalog</h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600">Browse DGCA and EASA modules, filter by readiness, and resume where you left off.</p>
            </div>
          </div>
        </Card>

        <DashboardSection title="Browse & filter courses" description="Search, filter, and sort your published learning paths.">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm lg:max-w-md">
              <FiSearch className="h-4 w-4 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                aria-label="Search modules"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CourseStatus | 'ALL')} className="bg-transparent outline-none" aria-label="Filter by completion status">
                  <option value="ALL">All status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="NOT_STARTED">Not started</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={examFilter} onChange={(event) => setExamFilter(event.target.value as ModuleExamType | 'ALL')} className="bg-transparent outline-none" aria-label="Filter by exam track">
                  <option value="ALL">All tracks</option>
                  {[...new Set(courses.map((course) => course.examType))].map((examType) => <option key={examType} value={examType}>{examType}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="bg-transparent outline-none" aria-label="Sort modules">
                  <option value="progress">Progress</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </label>
            </div>
          </div>
        </DashboardSection>

        {filteredModules.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">{filteredModules.map((course) => <CourseCard key={course.id} course={course} />)}</div>
        ) : (
          <EmptyState
            icon={<FiBookOpen className="h-6 w-6" />}
            title="No modules found"
            description="Try widening your search or switching filters to see more content."
          />
        )}
      </div>
    </div>
  )
}
