"use client"

import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import SearchToolbar from '@/features/admin/components/SearchToolbar'
import StatusBadge from '@/features/admin/components/StatusBadge'
import Pagination from '@/features/admin/components/Pagination'
import {
  addReviewCommentAction,
  assignReviewerAction,
  archiveQuestionAction,
  bulkApproveQuestionsAction,
  bulkArchiveQuestionsAction,
  bulkAssignReviewerToQuestionsAction,
  bulkPublishQuestionsAction,
  bulkUpdateReviewQueueAction,
  createVersionSnapshotAction,
  getAdminQuestionLibraryAction,
  getEditorialWorkflowAction,
  getQuestionByIdAction,
  publishQuestionAction,
  restoreArchivedQuestionAction,
  restoreVersionAction,
  unpublishQuestionAction,
  updateEditorialStatusAction,
} from '@/features/admin/actions/editorial-workflow.actions'
import type { AdminQuestionLibraryDTO, QuestionStatus } from '@/server/services/question.service'
import type { QuestionDTO } from '@/server/application/dto/question.dto'
import type {
  EditorialAuditEntryDTO,
  EditorialReviewQueueItemDTO,
  EditorialStatus,
  EditorialVersionDTO,
  EditorialWorkflowDTO,
} from '@/server/services/editorial-workflow.service'

type EditorialWorkspaceProps = {
  initialLibrary: AdminQuestionLibraryDTO
  initialQuestionId: string
  initialWorkflow: EditorialWorkflowDTO | null
}

const statusToneMap: Record<EditorialStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  APPROVED: 'success',
  PUBLISHED: 'success',
  ARCHIVED: 'danger',
}

const pageSize = 10

export default function EditorialWorkspace({ initialLibrary, initialQuestionId, initialWorkflow }: EditorialWorkspaceProps) {
  const [library, setLibrary] = useState(initialLibrary)
  const [selectedQuestionId, setSelectedQuestionId] = useState(initialQuestionId)
  const [workflow, setWorkflow] = useState(initialWorkflow)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDTO | null>(null)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [reviewSearchQuery, setReviewSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | ''>('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'difficulty' | 'status' | 'prompt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [selectedVersionId, setSelectedVersionId] = useState<string>(initialWorkflow?.versions[0]?.id ?? '')

  useEffect(() => {
    if (!initialQuestionId) return
    const matched = library.items.find((item) => item.id === initialQuestionId)
    setSelectedQuestion(matched ?? null)
  }, [library.items, initialQuestionId])

  useEffect(() => {
    void handleFetchLibrary()
  }, [librarySearchQuery, statusFilter, difficultyFilter, sortBy, sortOrder, page])

  const totalPages = Math.max(1, Math.ceil(library.total / library.pageSize))

  const selectedQuestionItem = useMemo(
    () => library.items.find((item) => item.id === selectedQuestionId) ?? null,
    [library.items, selectedQuestionId],
  )

  const filteredReviewQueue = useMemo(
    () => workflow?.reviewQueue.filter((item) => item.prompt.toLowerCase().includes(reviewSearchQuery.toLowerCase())) ?? [],
    [workflow, reviewSearchQuery],
  )

  const pagedAuditTrail = useMemo(() => {
    const auditPageSize = 4
    const startIndex = (auditPage - 1) * auditPageSize
    return workflow?.auditTrail.slice(startIndex, startIndex + auditPageSize) ?? []
  }, [workflow, auditPage])

  const handleFetchLibrary = async () => {
    const libraryResult = await getAdminQuestionLibraryAction({
      search: librarySearchQuery || undefined,
      status: statusFilter || undefined,
      difficulty: difficultyFilter || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize,
    })
    setLibrary(libraryResult)
  }

  const handleSelectQuestion = async (questionId: string) => {
    setSelectedQuestionId(questionId)

    const question = await getQuestionByIdAction(questionId)
    setSelectedQuestion(question)

    const workflowResult = await getEditorialWorkflowAction(questionId)
    setWorkflow(workflowResult)
    setSelectedVersionId(workflowResult.versions[0]?.id ?? '')
  }

  const handlePublish = async () => {
    if (!selectedQuestionId) return
    const result = await publishQuestionAction(selectedQuestionId, 'Admin')
    setWorkflow(result)
  }

  const handleUnpublish = async () => {
    if (!selectedQuestionId) return
    const result = await unpublishQuestionAction(selectedQuestionId, 'Admin')
    setWorkflow(result)
  }

  const handleArchive = async () => {
    if (!selectedQuestionId) return
    const result = await archiveQuestionAction(selectedQuestionId, 'Admin')
    setWorkflow(result)
  }

  const handleRestoreArchived = async () => {
    if (!selectedQuestionId) return
    const result = await restoreArchivedQuestionAction(selectedQuestionId, 'Admin')
    setWorkflow(result)
  }

  const handleStatusChange = async (status: EditorialStatus) => {
    if (!selectedQuestionId) return
    const result = await updateEditorialStatusAction(selectedQuestionId, status, 'Admin', `Workflow action to ${status}`)
    setWorkflow(result)
  }

  const handleAssignReviewer = async (reviewId: string) => {
    if (!selectedQuestionId) return
    const result = await assignReviewerAction(selectedQuestionId, reviewId, 'Reviewer')
    setWorkflow(result)
  }

  const handleAddComment = async (reviewId: string) => {
    if (!selectedQuestionId) return
    const comment = window.prompt('Add a review comment:')
    if (!comment) return
    const result = await addReviewCommentAction(selectedQuestionId, reviewId, comment, 'Reviewer')
    setWorkflow(result)
  }

  const handleBulkReview = async () => {
    if (!selectedQuestionId) return
    const result = await bulkUpdateReviewQueueAction(selectedQuestionId, selectedReviews, 'IN_REVIEW')
    setWorkflow(result)
    setSelectedReviews([])
  }

  const handleBulkPublish = async () => {
    if (!selectedQuestionIds.length) return
    await bulkPublishQuestionsAction(selectedQuestionIds)
    await handleFetchLibrary()
  }

  const handleBulkArchive = async () => {
    if (!selectedQuestionIds.length) return
    await bulkArchiveQuestionsAction(selectedQuestionIds)
    await handleFetchLibrary()
  }

  const handleBulkApprove = async () => {
    if (!selectedQuestionIds.length) return
    await bulkApproveQuestionsAction(selectedQuestionIds)
    await handleFetchLibrary()
    if (selectedQuestionIds.includes(selectedQuestionId) && selectedQuestionId) {
      const workflowResult = await getEditorialWorkflowAction(selectedQuestionId)
      setWorkflow(workflowResult)
    }
  }

  const handleBulkAssignReviewer = async () => {
    if (!selectedQuestionIds.length) return
    const reviewer = window.prompt('Assign reviewer to selected questions:')
    if (!reviewer) return
    await bulkAssignReviewerToQuestionsAction(selectedQuestionIds, reviewer)
    if (selectedQuestionIds.includes(selectedQuestionId) && selectedQuestionId) {
      const workflowResult = await getEditorialWorkflowAction(selectedQuestionId)
      setWorkflow(workflowResult)
    }
  }

  const handleSnapshot = async () => {
    if (!selectedQuestionId) return
    const summary = window.prompt('Snapshot summary:')
    if (!summary) return
    const snapshot = await createVersionSnapshotAction(selectedQuestionId, summary, 'Admin')
    setWorkflow((current) => current ? { ...current, versions: [...current.versions, snapshot] } : current)
  }

  const handleRestoreVersion = async () => {
    if (!selectedQuestionId || !selectedVersionId) return
    const result = await restoreVersionAction(selectedQuestionId, selectedVersionId)
    setWorkflow(result)
  }

  const currentVersion = workflow?.versions.find((version) => version.id === selectedVersionId)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Question library</h2>
              <p className="mt-1 text-sm text-slate-600">Search, filter, paginate, and select a question for editorial review.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleBulkPublish} disabled={selectedQuestionIds.length === 0}>Bulk publish</Button>
              <Button variant="secondary" size="sm" onClick={handleBulkArchive} disabled={selectedQuestionIds.length === 0}>Bulk archive</Button>
              <Button variant="secondary" size="sm" onClick={handleBulkApprove} disabled={selectedQuestionIds.length === 0}>Bulk approve</Button>
              <Button variant="ghost" size="sm" onClick={handleBulkAssignReviewer} disabled={selectedQuestionIds.length === 0}>Assign reviewer</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SearchToolbar query={librarySearchQuery} onQueryChange={setLibrarySearchQuery} placeholder="Search questions" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as QuestionStatus | '')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | '')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="">All difficulties</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-medium text-slate-700">Sort by</label>
              <div className="mt-2 flex gap-2">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none w-full">
                  <option value="createdAt">Newest</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="status">Status</option>
                  <option value="prompt">Prompt</option>
                </select>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none w-full">
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Library size</p>
              <p className="mt-2 text-sm text-slate-700">{library.total} questions · page {library.page} of {totalPages}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3 font-medium">Question</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {library.items.map((item) => (
                  <tr key={item.id} className={item.id === selectedQuestionId ? 'bg-slate-50' : undefined}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(item.id)}
                        onChange={() => setSelectedQuestionIds((current) =>
                          current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                        )}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="text-left text-slate-900 hover:text-blue-600" onClick={() => handleSelectQuestion(item.id)}>
                        {item.question}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={item.status} tone={item.status === 'PUBLISHED' ? 'success' : item.status === 'ARCHIVED' ? 'danger' : 'neutral'} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.difficulty}</td>
                    <td className="px-4 py-3 text-slate-600">{item.metadata.tags.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Editorial workflow</h2>
                <p className="mt-1 text-sm text-slate-600">Selected question: {selectedQuestionItem?.question ?? 'None selected'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange('IN_REVIEW')} disabled={!selectedQuestionId}>In review</Button>
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange('APPROVED')} disabled={!selectedQuestionId}>Approve</Button>
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange('DRAFT')} disabled={!selectedQuestionId}>Reject</Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Current status</p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge label={workflow?.status ?? 'DRAFT'} tone={workflow ? statusToneMap[workflow.status] : 'neutral'} />
                  <span className="text-sm text-slate-600">Backlog {workflow?.analytics.reviewBacklog ?? 0}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Publishing</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={handlePublish} disabled={!selectedQuestionId}>Publish</Button>
                  <Button variant="secondary" size="sm" onClick={handleUnpublish} disabled={!selectedQuestionId}>Unpublish</Button>
                  {workflow?.status === 'ARCHIVED' ? (
                    <Button variant="ghost" size="sm" onClick={handleRestoreArchived} disabled={!selectedQuestionId}>Restore</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={handleArchive} disabled={!selectedQuestionId}>Archive</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">Review queue</p>
                <Button variant="secondary" size="sm" onClick={handleBulkReview} disabled={!selectedQuestionId || selectedReviews.length === 0}>Bulk review</Button>
              </div>
              <div className="mt-4 space-y-3">
                <SearchToolbar query={reviewSearchQuery} onQueryChange={setReviewSearchQuery} placeholder="Search review prompts" />
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3"></th>
                        <th className="px-4 py-3 font-medium">Prompt</th>
                        <th className="px-4 py-3 font-medium">Warnings</th>
                        <th className="px-4 py-3 font-medium">Reviewer</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredReviewQueue.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedReviews.includes(item.id)}
                              onChange={() => {
                                setSelectedReviews((current) =>
                                  current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                                )
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-800">{item.prompt}</td>
                          <td className="px-4 py-3 space-y-1 text-sm text-slate-600">
                            {item.warnings.map((warning) => (
                              <StatusBadge key={warning} label={warning} tone="warning" />
                            ))}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.reviewer ?? 'Unassigned'}</td>
                          <td className="px-4 py-3 space-x-2">
                            <Button variant="secondary" size="sm" onClick={() => handleAssignReviewer(item.id)} disabled={!selectedQuestionId}>Assign</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleAddComment(item.id)} disabled={!selectedQuestionId}>Comment</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Version history</h3>
                <p className="mt-1 text-sm text-slate-600">Restore snapshots and compare versions.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleSnapshot} disabled={!selectedQuestionId}>New snapshot</Button>
            </div>
            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Compare versions</label>
                <div className="flex items-center gap-2">
                  <select value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none w-full">
                    {workflow?.versions.map((version) => (
                      <option key={version.id} value={version.id}>{`Version ${version.version}`}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" onClick={handleRestoreVersion} disabled={!selectedQuestionId || !selectedVersionId}>Restore</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Selected version</p>
                <p className="mt-2 text-sm text-slate-700">{currentVersion?.summary ?? 'No version selected'}</p>
                <p className="mt-1 text-xs text-slate-500">{currentVersion?.author} · {currentVersion?.changedAt}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Audit timeline</h3>
                <p className="mt-1 text-sm text-slate-600">Recent editorial activity and workflow changes.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {pagedAuditTrail.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{entry.actor}</p>
                  <p className="mt-1 text-sm text-slate-700">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.timestamp}</p>
                </div>
              ))}
              <Pagination page={auditPage} totalPages={Math.max(1, Math.ceil((workflow?.auditTrail.length ?? 0) / 4))} onPageChange={setAuditPage} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
