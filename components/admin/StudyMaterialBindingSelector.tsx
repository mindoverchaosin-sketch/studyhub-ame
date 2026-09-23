"use client"

import { useMemo, useState } from 'react'

export type StudyMaterialBindingOption = { id: string; title: string; moduleId: string }
export type StudyMaterialModuleOption = { id: string; title: string }

interface StudyMaterialBindingSelectorProps {
  modules: StudyMaterialModuleOption[]
  lessons: StudyMaterialBindingOption[]
}

export default function StudyMaterialBindingSelector({ modules, lessons }: StudyMaterialBindingSelectorProps) {
  const [moduleId, setModuleId] = useState('')
  const availableLessons = useMemo(() => lessons.filter((lesson) => lesson.moduleId === moduleId), [lessons, moduleId])

  return <div className="space-y-4"><label className="block text-sm font-medium text-slate-700">Module<select required name="moduleId" value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"><option value="">Select module</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Lesson<select required name="lessonId" disabled={!moduleId} defaultValue="" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"><option value="">{moduleId ? 'Select lesson' : 'Select a module first'}</option>{availableLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label></div>
}
