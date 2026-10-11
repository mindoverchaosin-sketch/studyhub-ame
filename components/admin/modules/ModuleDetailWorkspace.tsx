'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ModuleResourcesPanel from './ModuleResourcesPanel'
import { LessonForm } from '@/components/admin/cms/LessonForm'
import { Modal } from '@/components/admin/cms/Modal'
import { adminContentService } from '@/services/admin/content.service'
import { validateLessonForm } from '@/services/admin/cms-utils'
import type { ModuleDetailDTO } from '@/server/application/dto/module-management.dto'
import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import type { AdminLesson, AdminModuleOption } from '@/types/admin'

type QuizSummary = {
  id: string
  title: string
  status: string
  attemptCount: number
  questionBankTitles: string[]
}

type QuestionBankSummary = {
  id: string
  title: string
  status: string
  questionCount: number
}

type MockTestSummary = {
  id: string
  title: string
  status: string
  durationMinutes: number
  questionCount: number
}

type Props = {
  module: ModuleDetailDTO
  lessons: AdminLesson[]
  resources: ResourceDTO[]
  quizzes: QuizSummary[]
  questionBanks: QuestionBankSummary[]
  mockTests: MockTestSummary[]
  basePath: '/admin' | '/content-editor'
}

const tabs = ['Overview', 'Lessons', 'Study Materials', 'Questions', 'Quizzes', 'Mock Tests', 'Videos'] as const
type Tab = (typeof tabs)[number]

export function ModuleDetailWorkspace({ module, lessons: initialLessons, resources, quizzes, questionBanks, mockTests, basePath }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [lessons, setLessons] = useState(initialLessons)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null)
  const [lessonDraft, setLessonDraft] = useState<Partial<AdminLesson>>({})
  const [lessonErrors, setLessonErrors] = useState<string[]>([])
  const [lessonSaving, setLessonSaving] = useState(false)
  const [lessonMessage, setLessonMessage] = useState<string | null>(null)
  const uniqueQuestionCount = useMemo(() => questionBanks.reduce((total, bank) => total + bank.questionCount, 0), [questionBanks])
  const videos = resources.filter((resource) => resource.type === 'VIDEO')
  const moduleOption: AdminModuleOption = { id: module.id, title: module.title }

  function openCreateLesson() {
    setEditingLesson(null)
    setLessonDraft({
      title: '',
      content: '',
      objectives: [],
      keyPoints: [],
      resources: [],
      attachments: [],
      referenceLinks: [],
      status: 'Draft',
      order: lessons.length + 1,
      moduleId: module.id,
      moduleTitle: module.title,
      module: module.title,
    })
    setLessonErrors([])
    setLessonMessage(null)
    setLessonModalOpen(true)
  }

  function openEditLesson(lesson: AdminLesson) {
    setEditingLesson(lesson)
    setLessonDraft(lesson)
    setLessonErrors([])
    setLessonMessage(null)
    setLessonModalOpen(true)
  }

  async function saveLesson() {
    const errors = validateLessonForm(lessonDraft, lessons, editingLesson?.id)
    if (errors.length) {
      setLessonErrors(errors)
      return
    }
    setLessonSaving(true)
    const input = { ...lessonDraft, moduleId: module.id, module: module.title, moduleTitle: module.title }
    const saved = editingLesson
      ? await adminContentService.updateLesson(editingLesson.id, input)
      : await adminContentService.createLesson(input)
    setLessonSaving(false)
    if (!saved) {
      setLessonMessage('Unable to save this lesson. Please try again.')
      return
    }
    setLessons((current) => editingLesson
      ? current.map((lesson) => lesson.id === editingLesson.id ? saved : lesson)
      : [saved, ...current])
    setLessonModalOpen(false)
    setLessonMessage(null)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <nav aria-label="Module content sections" className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-current={activeTab === tab ? 'page' : undefined}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-950'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Overview' ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Module resource counts">
          {[
            ['Lessons', lessons.length],
            ['Study Materials', resources.length],
            ['Questions available through banks', uniqueQuestionCount],
            ['Quizzes', quizzes.length],
            ['Mock Tests', mockTests.length],
            ['Module Videos', videos.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Difficulty</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{module.difficulty}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Estimated time</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{module.estimatedHours} hours</p>
          </div>
        </section>
      ) : null}

      {activeTab === 'Lessons' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Lessons</h2>
              <p className="text-sm text-slate-600">Lessons attached to {module.title}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={openCreateLesson} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create lesson</button>
              <Link href={`${basePath}/lessons?moduleId=${encodeURIComponent(module.id)}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Manage lessons</Link>
            </div>
          </div>
          {lessons.length ? (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{lesson.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{lesson.status}</p>
                  </div>
                  <button type="button" onClick={() => openEditLesson(lesson)} className="text-sm font-semibold text-blue-700">Edit</button>
                </div>
              ))}
            </div>
          ) : <EmptyPanel text="No lessons are assigned to this module yet." />}
        </section>
      ) : null}

      {activeTab === 'Study Materials' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Study Materials</h2>
              <p className="text-sm text-slate-600">Create a module-level material or optionally link it to a lesson.</p>
            </div>
            <Link href={`${basePath}/materials/new?moduleId=${encodeURIComponent(module.id)}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create study material</Link>
          </div>
          <ModuleResourcesPanel moduleId={module.id} resources={resources} />
        </section>
      ) : null}

      {activeTab === 'Questions' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Question Banks used by this Module</h2>
              <p className="text-sm text-slate-600">Banks are derived from the module’s quizzes; QuestionBanks remain reusable and are not owned by a single module.</p>
            </div>
            <Link href={`${basePath}/questions?moduleId=${encodeURIComponent(module.id)}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Manage module questions</Link>
          </div>
          {questionBanks.length ? (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {questionBanks.map((bank) => (
                <div key={bank.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{bank.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{bank.status}</p>
                  </div>
                  <p className="text-sm text-slate-700">{bank.questionCount} questions available through this bank</p>
                </div>
              ))}
            </div>
          ) : <EmptyPanel text="No question banks are currently associated through this module’s quizzes." />}
        </section>
      ) : null}

      {activeTab === 'Quizzes' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Quizzes</h2>
              <p className="text-sm text-slate-600">Quizzes belong to this module. Attempts are retained when a quiz is archived.</p>
            </div>
            <Link href={`${basePath}/quizzes?moduleId=${encodeURIComponent(module.id)}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Manage module quizzes</Link>
          </div>
          {quizzes.length ? (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{quiz.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{quiz.status}{quiz.questionBankTitles.length ? ` · ${quiz.questionBankTitles.join(', ')}` : ''}</p>
                  </div>
                  <p className="text-sm text-slate-700">{quiz.attemptCount} attempts</p>
                </div>
              ))}
            </div>
          ) : <EmptyPanel text="No quizzes are assigned to this module yet." />}
        </section>
      ) : null}

      {activeTab === 'Mock Tests' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Mock Tests</h2>
              <p className="text-sm text-slate-600">This section shows Exam Templates linked to this module. Course-level templates remain available in the global view.</p>
            </div>
            <Link href={`${basePath}/mock-tests?moduleId=${encodeURIComponent(module.id)}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Manage module mock tests</Link>
          </div>
          {mockTests.length ? (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {mockTests.map((mockTest) => (
                <div key={mockTest.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{mockTest.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{mockTest.status}</p>
                  </div>
                  <p className="text-sm text-slate-700">{mockTest.questionCount} questions · {mockTest.durationMinutes} min</p>
                </div>
              ))}
            </div>
          ) : <EmptyPanel text="No Exam Templates are linked to this module." />}
        </section>
      ) : null}

      {activeTab === 'Videos' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Module Videos</h2>
              <p className="text-sm text-slate-600">Videos currently use the StudyMaterial VIDEO type and module relationship.</p>
            </div>
            <Link href={`${basePath}/materials/new?moduleId=${encodeURIComponent(module.id)}&type=VIDEO`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add module video</Link>
          </div>
          {videos.length ? (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {videos.map((video) => (
                <div key={video.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{video.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{video.status}</p>
                  </div>
                  <Link href={`${basePath}/materials/${video.id}`} className="text-sm font-semibold text-blue-700">Edit video material</Link>
                </div>
              ))}
            </div>
          ) : <EmptyPanel text="No module videos are assigned yet." />}
          <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Accident &amp; Incident case studies are not available here. The current schema has no safe category or dedicated case-study model, so they are intentionally unsupported rather than inferred from existing videos.
          </div>
        </section>
      ) : null}

      {lessonMessage ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{lessonMessage}</p> : null}

      <Modal
        open={lessonModalOpen}
        title={editingLesson ? 'Edit lesson' : 'Create lesson'}
        description={`This lesson will belong to ${module.title}.`}
        onClose={() => setLessonModalOpen(false)}
        footer={(
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setLessonModalOpen(false)} disabled={lessonSaving} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">Cancel</button>
            <button type="button" onClick={saveLesson} disabled={lessonSaving} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{lessonSaving ? 'Saving...' : 'Save lesson'}</button>
          </div>
        )}
      >
        <LessonForm
          value={lessonDraft}
          modules={[moduleOption]}
          lockedModule={moduleOption}
          onChange={(changes) => setLessonDraft((current) => ({ ...current, ...changes }))}
          errors={lessonErrors}
        />
      </Modal>
    </div>
  )
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">{text}</div>
}
