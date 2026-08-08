"use client"

import { useMemo, useState } from 'react'
import { FiBookOpen, FiClock, FiFilter, FiPlayCircle, FiSearch, FiTrendingUp } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import ModuleGrid from '@/components/modules/ModuleGrid'
import EmptyState from '@/components/dashboard/EmptyState'
import { mockModules } from '@/lib/mock/modules'
import type { ModuleExamType, ModuleStatus } from '@/lib/mock/modules'
import DashboardSection from '@/components/dashboard/DashboardSection'

type SortOption = 'recent' | 'alphabetical'

export default function ModulesPageClient() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ModuleStatus | 'ALL'>('ALL')
  const [examFilter, setExamFilter] = useState<ModuleExamType | 'ALL'>('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'Beginner' | 'Intermediate' | 'Advanced'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const modules = mockModules.filter((moduleItem) => {
      const matchesStatus = statusFilter === 'ALL' || moduleItem.status === statusFilter
      const matchesExam = examFilter === 'ALL' || moduleItem.examType === examFilter
      const matchesDifficulty = difficultyFilter === 'ALL' || moduleItem.difficulty === difficultyFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        moduleItem.title.toLowerCase().includes(normalizedQuery) ||
        moduleItem.description.toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesExam && matchesDifficulty && matchesQuery
    })

    return [...modules].sort((left, right) => {
      if (sortBy === 'alphabetical') {
        return left.title.localeCompare(right.title)
      }
      return right.progress - left.progress
    })
  }, [difficultyFilter, examFilter, query, sortBy, statusFilter])

  const currentModule = mockModules.find((moduleItem) => moduleItem.status === 'IN_PROGRESS') ?? mockModules[0]

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
            {currentModule ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 sm:min-w-[320px]">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600"><FiPlayCircle className="h-4 w-4" />Current module</div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{currentModule.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{currentModule.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2"><FiClock className="h-4 w-4" />{currentModule.estimatedHours}h</span>
                  <span className="inline-flex items-center gap-2"><FiTrendingUp className="h-4 w-4" />{currentModule.progress}%</span>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <DashboardSection title="Browse & filter modules" description="Search, filter, and sort modules with placeholder data that can be replaced by real API responses later.">
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
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ModuleStatus | 'ALL')} className="bg-transparent outline-none" aria-label="Filter by completion status">
                  <option value="ALL">All status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="NOT_STARTED">Not started</option>
                  <option value="LOCKED">Locked</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={examFilter} onChange={(event) => setExamFilter(event.target.value as ModuleExamType | 'ALL')} className="bg-transparent outline-none" aria-label="Filter by exam track">
                  <option value="ALL">All tracks</option>
                  <option value="DGCA">DGCA</option>
                  <option value="EASA">EASA</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as 'ALL' | 'Beginner' | 'Intermediate' | 'Advanced')} className="bg-transparent outline-none" aria-label="Filter by difficulty">
                  <option value="ALL">All difficulty</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <FiFilter className="h-4 w-4" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="bg-transparent outline-none" aria-label="Sort modules">
                  <option value="recent">Recently accessed</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </label>
            </div>
          </div>
        </DashboardSection>

        {filteredModules.length > 0 ? (
          <ModuleGrid modules={filteredModules} />
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
