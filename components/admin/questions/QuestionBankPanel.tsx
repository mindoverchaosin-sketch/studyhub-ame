'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  archiveQuestionBankAction,
  createQuestionBankAction,
  getQuestionBankAction,
  publishQuestionBankAction,
  updateQuestionBankAction,
} from '@/server/actions/question-bank-management.actions'
import type { QuestionBankManagementDTO } from '@/server/application/dto/question-bank.dto'

type Props = {
  initialQuestionBanks: QuestionBankManagementDTO[]
  initialTotal: number
}

export default function QuestionBankPanel({ initialQuestionBanks, initialTotal }: Props) {
  const [questionBanks, setQuestionBanks] = useState(initialQuestionBanks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'status'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedBankId, setSelectedBankId] = useState<string | null>(initialQuestionBanks[0]?.id ?? null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [total, setTotal] = useState(initialTotal)

  const filteredBanks = useMemo(() => {
    const lower = search.trim().toLowerCase()
    return questionBanks.filter((bank) => {
      const matchesSearch = !lower || bank.title.toLowerCase().includes(lower) || bank.description?.toLowerCase().includes(lower)
      const matchesStatus = statusFilter === 'ALL' || bank.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [questionBanks, search, statusFilter])

  const sortedBanks = useMemo(() => {
    const sorted = [...filteredBanks]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else if (sortBy === 'title') {
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
      } else if (sortBy === 'status') {
        aValue = a.status
        bValue = b.status
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
    return sorted
  }, [filteredBanks, sortBy, sortOrder])

  const selectedBank = sortedBanks.find((bank) => bank.id === selectedBankId) ?? null

  function resetForm() {
    setSelectedBankId(null)
    setTitle('')
    setDescription('')
    setIsPremium(false)
    setErrors([])
    setMessage('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setErrors([])
    setMessage('')
    setIsProcessing(true)

    try {
      const result = selectedBankId
        ? await updateQuestionBankAction(selectedBankId, { title, description, isPremium })
        : await createQuestionBankAction({ title, description, isPremium })

      if (!result.success) {
        setErrors(result.errors.map((error) => error.message))
        setIsProcessing(false)
        return
      }

      if (result.questionBank) {
        setQuestionBanks((current) => {
          const existingIndex = current.findIndex((bank) => bank.id === result.questionBank?.id)
          if (existingIndex >= 0) {
            return current.map((bank) => (bank.id === result.questionBank?.id ? result.questionBank! : bank))
          }
          return [result.questionBank!, ...current]
        })
        setSelectedBankId(result.questionBank.id)
      }

      setMessage(selectedBankId ? 'Question Bank updated.' : 'Question Bank created.')
      if (!selectedBankId) {
        resetForm()
      }
    } catch (error: any) {
      setErrors([error.message || 'An error occurred'])
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleArchive() {
    if (!selectedBankId) return
    setIsProcessing(true)

    try {
      const result = await archiveQuestionBankAction(selectedBankId)
      if (result.success) {
        setQuestionBanks((current) => current.map((bank) => (bank.id === selectedBankId ? { ...bank, status: 'ARCHIVED' } : bank)))
        setMessage('Question Bank archived.')
      } else {
        setErrors(result.errors.map((error) => error.message))
      }
    } catch (error: any) {
      setErrors([error.message || 'An error occurred'])
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePublish() {
    if (!selectedBankId) return
    setIsProcessing(true)

    try {
      const result = await publishQuestionBankAction(selectedBankId)
      if (result.success) {
        setQuestionBanks((current) => current.map((bank) => (bank.id === selectedBankId ? { ...bank, status: 'PUBLISHED' } : bank)))
        setMessage('Question Bank published.')
      } else {
        setErrors(result.errors.map((error) => error.message))
      }
    } catch (error: any) {
      setErrors([error.message || 'An error occurred'])
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleSelectBank(bankId: string) {
    setSelectedBankId(bankId)
    const result = await getQuestionBankAction(bankId)
    if (result) {
      setTitle(result.title)
      setDescription(result.description ?? '')
      setIsPremium(result.isPremium)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description..."
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            >
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* List */}
        <div className="col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Question Banks</h3>
            <p className="text-sm text-slate-600">{sortedBanks.length} of {total}</p>
          </div>

          {sortedBanks.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No question banks found.</p>
          ) : (
            <div className="space-y-2">
              {sortedBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => void handleSelectBank(bank.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedBankId === bank.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{bank.title}</div>
                      {bank.description && <div className="mt-1 line-clamp-1 text-xs text-slate-600">{bank.description}</div>}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{bank.status}</span>
                      {bank.isPremium && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Premium</span>}
                      <span className="text-xs text-slate-500">{bank.questionCount} Q</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">{selectedBankId ? 'Edit' : 'Create'} Question Bank</h3>

          {errors.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <ul className="list-inside list-disc">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {message && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Hydraulic Systems"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPremium"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="isPremium" className="text-sm font-medium text-slate-700">
                Premium Content
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Saving...' : selectedBankId ? 'Update' : 'Create'}
              </button>

              {selectedBankId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  New
                </button>
              )}
            </div>
          </form>

          {selectedBank && (
            <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
              <button
                onClick={handlePublish}
                disabled={isProcessing || selectedBank.status === 'PUBLISHED'}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Publish
              </button>

              <button
                onClick={handleArchive}
                disabled={isProcessing || selectedBank.status === 'ARCHIVED'}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
