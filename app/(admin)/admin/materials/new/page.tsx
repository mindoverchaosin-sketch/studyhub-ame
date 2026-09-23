import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'import PageHeader from '@/components/admin/PageHeader'
import { createStudyMaterialAction } from '@/server/actions/study-material.actions'
import { moduleRepository } from '@/server/repositories/module.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import StudyMaterialBindingSelector from '@/components/admin/StudyMaterialBindingSelector'

export default async function NewStudyMaterialPage() {
  try { await requirePermission('manageResources') } catch { redirect('/login') }
  const modules = await moduleRepository.findModulesForAdmin({ status: 'PUBLISHED', take: 1000, sortBy: 'title' })
  const lessons = (await Promise.all(modules.map((module) => lessonRepository.list({ moduleId: module.id, status: 'PUBLISHED', take: 1000, sortBy: 'title' })))).flat()
  return <div className="max-w-2xl space-y-6"><PageHeader title="New study material" description="Create a structured draft bound to an existing published module lesson." /><form action={async (formData: FormData) => { 'use server'; const result = await createStudyMaterialAction({ moduleId: String(formData.get('moduleId') ?? ''), lessonId: String(formData.get('lessonId') ?? ''), title: String(formData.get('title') ?? ''), type: 'NOTES', url: '/media/study-material-placeholder', isPremium: formData.get('isPremium') === 'on' }); redirect(`/admin/materials/${result.id}`) }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><label className="block text-sm font-medium text-slate-700">Title<input required name="title" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label><StudyMaterialBindingSelector modules={modules.map((module) => ({ id: module.id, title: module.title }))} lessons={lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, moduleId: lesson.moduleId }))} /><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input name="isPremium" type="checkbox" /> Premium material</label><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create draft</button></form></div>
}
