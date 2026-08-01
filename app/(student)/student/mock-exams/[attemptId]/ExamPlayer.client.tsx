"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExamAttempt } from '@/types/exam'
import ExamHeader from '@/components/mock-tests/ExamHeader'
import Timer from '@/components/mock-tests/Timer'
import QuestionCard from '@/components/mock-tests/QuestionCard'
import QuestionPalette from '@/components/mock-tests/QuestionPalette'
import ReviewPanel from '@/components/mock-tests/ReviewPanel'

type Props = { initialAttempt: ExamAttempt }

type AnswerMap = Record<string, number | null>
type FlagMap = Record<string, boolean>

async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export default function ExamPlayer({ initialAttempt }: Props) {
  const questions = useMemo(() => {
    return [...(initialAttempt.questions ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }, [initialAttempt.questions])

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const key = `exam_attempt_${initialAttempt.id}_currentIndex`
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      if (raw) {
        const idx = parseInt(raw, 10)
        if (!Number.isNaN(idx) && idx >= 0 && idx < questions.length) return idx
      }
    } catch {
      // ignore localStorage failures
    }
    return 0
  })

  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const initial: AnswerMap = {}
    questions.forEach((question) => {
      initial[question.id] = typeof question.selectedOption === 'number' ? question.selectedOption : null
    })
    return initial
  })

  const [bookmarks, setBookmarks] = useState<FlagMap>(() => {
    const initial: FlagMap = {}
    questions.forEach((question) => {
      initial[question.id] = !!question.bookmarked
    })
    return initial
  })

  const [reviews, setReviews] = useState<FlagMap>(() => {
    const initial: FlagMap = {}
    questions.forEach((question) => {
      initial[question.id] = !!question.markedForReview
    })
    return initial
  })

  const [visited, setVisited] = useState<FlagMap>(() => {
    const initial: FlagMap = {}
    questions.forEach((question) => {
      initial[question.id] = Boolean(question.answeredAt || typeof question.selectedOption === 'number')
    })
    return initial
  })

  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const now = Date.now()
    if (initialAttempt.expiresAt) {
      const expiresAt = new Date(initialAttempt.expiresAt).getTime()
      return Math.max(0, expiresAt - now)
    }
    if (initialAttempt.durationMinutes) {
      return initialAttempt.durationMinutes * 60_000
    }
    return 0
  })

  const [submitting, setSubmitting] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const submittingRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const autoSubmitFired = useRef(false)
  const saveTimers = useRef<Record<string, number>>({})
  const inflightSaves = useRef<Record<string, Promise<unknown> | null>>({})

  const currentQuestion = useMemo(() => questions[currentIndex] ?? null, [questions, currentIndex])

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [])

  useEffect(() => {
    try {
      const key = `exam_attempt_${initialAttempt.id}_currentIndex`
      localStorage.setItem(key, String(currentIndex))
    } catch {
      // ignore storage errors
    }
  }, [initialAttempt.id, currentIndex])

  const enqueueSaveAnswer = useCallback(
    (attemptQuestionId: string, selectedOption: number | null | undefined) => {
      const existing = saveTimers.current[attemptQuestionId]
      if (existing) window.clearTimeout(existing)

      const timer = window.setTimeout(() => {
        const payload: Record<string, unknown> = { attemptQuestionId }
        if (typeof selectedOption !== 'undefined') payload.selectedOption = selectedOption
        payload.answeredAt = new Date().toISOString()

        const promise = fetchJson(`/api/exam/attempt/${initialAttempt.id}/save-answer`, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {
          setToast('Failed to save answer')
        })

        inflightSaves.current[attemptQuestionId] = promise
        promise.finally(() => {
          inflightSaves.current[attemptQuestionId] = null
        })
      }, 350)

      saveTimers.current[attemptQuestionId] = timer as unknown as number
    },
    [initialAttempt.id]
  )

  const doSaveBookmark = useCallback(
    async (attemptQuestionId: string, bookmarked: boolean) => {
      try {
        await fetchJson(`/api/exam/attempt/${initialAttempt.id}/bookmark`, {
          method: 'POST',
          body: JSON.stringify({ attemptQuestionId, bookmarked }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        setToast('Failed to save bookmark')
      }
    },
    [initialAttempt.id]
  )

  const doSaveReview = useCallback(
    async (attemptQuestionId: string, markedForReview: boolean) => {
      try {
        await fetchJson(`/api/exam/attempt/${initialAttempt.id}/mark-review`, {
          method: 'POST',
          body: JSON.stringify({ attemptQuestionId, markedForReview }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        setToast('Failed to save review flag')
      }
    },
    [initialAttempt.id]
  )

  const handleSelectOption = useCallback(
    (attemptQuestionId: string, optionIndex: number) => {
      setAnswers((current) => ({ ...current, [attemptQuestionId]: optionIndex }))
      enqueueSaveAnswer(attemptQuestionId, optionIndex)
    },
    [enqueueSaveAnswer]
  )

  const handleClearAnswer = useCallback(
    (attemptQuestionId: string) => {
      setAnswers((current) => ({ ...current, [attemptQuestionId]: null }))
      enqueueSaveAnswer(attemptQuestionId, null)
    },
    [enqueueSaveAnswer]
  )

  const handleBookmark = useCallback(
    (attemptQuestionId: string) => {
      const next = !bookmarks[attemptQuestionId]
      setBookmarks((current) => ({ ...current, [attemptQuestionId]: next }))
      void doSaveBookmark(attemptQuestionId, next)
    },
    [bookmarks, doSaveBookmark]
  )

  const handleMarkReview = useCallback(
    (attemptQuestionId: string) => {
      const next = !reviews[attemptQuestionId]
      setReviews((current) => ({ ...current, [attemptQuestionId]: next }))
      void doSaveReview(attemptQuestionId, next)
    },
    [reviews, doSaveReview]
  )

  const markVisited = useCallback(
    (attemptQuestionId: string) => {
      setVisited((current) => ({ ...current, [attemptQuestionId]: true }))
      enqueueSaveAnswer(attemptQuestionId, undefined)
    },
    [enqueueSaveAnswer]
  )

  const handleJumpTo = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      const question = questions[index]
      if (question) markVisited(question.id)
    },
    [markVisited, questions]
  )

  const handleNext = useCallback(() => {
    setCurrentIndex((current) => {
      const nextIndex = Math.min(questions.length - 1, current + 1)
      const question = questions[nextIndex]
      if (question) markVisited(question.id)
      return nextIndex
    })
  }, [markVisited, questions])

  const handlePrev = useCallback(() => {
    setCurrentIndex((current) => {
      const prevIndex = Math.max(0, current - 1)
      const question = questions[prevIndex]
      if (question) markVisited(question.id)
      return prevIndex
    })
  }, [markVisited, questions])

  const doSubmit = useCallback(
    async (isAuto = false) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)

      try {
        const timers = Object.values(saveTimers.current)
        for (const value of timers) if (value) window.clearTimeout(value)
        const inflight = Object.values(inflightSaves.current).filter(Boolean) as Promise<unknown>[]
        if (inflight.length) await Promise.allSettled(inflight)

        await fetchJson(`/api/exam/attempt/${initialAttempt.id}/submit`, { method: 'POST' })
        window.location.assign(`/student/mock-exams/${initialAttempt.id}/results`)
      } catch {
        setToast('Failed to submit attempt')
        submittingRef.current = false
        setSubmitting(false)
        if (isAuto) {
          autoSubmitFired.current = false
        }
      }
    },
    [initialAttempt.id]
  )

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setRemainingMs((current) => {
        if (current <= 1000) {
          if (!autoSubmitFired.current) {
            autoSubmitFired.current = true
            void doSubmit(true)
          }
          if (timerRef.current) window.clearInterval(timerRef.current)
          return 0
        }
        return current - 1000
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [doSubmit])

  const handleSubmit = useCallback(async () => {
    const unanswered = questions.reduce((count, question) => (answers[question.id] == null ? count + 1 : count), 0)
    if (!confirm(`You have ${unanswered} unanswered questions. Submit?`)) return
    await doSubmit(false)
  }, [answers, doSubmit, questions])

  const progressPercent = useMemo(() => {
    const answered = Object.values(answers).filter((value) => value != null).length
    return Math.round((answered / Math.max(1, questions.length)) * 100)
  }, [answers, questions.length])

  return (
    <div className="space-y-4 p-4">
      <ExamHeader title={initialAttempt.title ?? initialAttempt.templateId} timeLeft={formatTime(remainingMs)} progressPercent={progressPercent} onSubmit={handleSubmit} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_420px]">
        <section className="space-y-4">
          {currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              selectedOption={answers[currentQuestion.id] ?? null}
              bookmarked={bookmarks[currentQuestion.id] ?? false}
              markedForReview={reviews[currentQuestion.id] ?? false}
              onSelect={(index) => handleSelectOption(currentQuestion.id, index)}
              onBookmark={() => handleBookmark(currentQuestion.id)}
              onMarkReview={() => handleMarkReview(currentQuestion.id)}
              onClear={() => handleClearAnswer(currentQuestion.id)}
              isSubmitting={submitting}
            />
          ) : (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
              <p className="text-slate-600">No question found for this exam attempt.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={handlePrev} className="rounded border px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50" disabled={submitting}>Previous</button>
              <button onClick={handleNext} className="rounded border px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50" disabled={submitting}>Next</button>
              <button onClick={() => setShowReviewPanel((current) => !current)} className="rounded border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                {showReviewPanel ? 'Hide review' : 'Review answer'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Timer timeLeft={formatTime(remainingMs)} isExpired={remainingMs <= 0} />
              <button data-testid="submit-button" disabled={submitting} onClick={handleSubmit} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {showReviewPanel && currentQuestion ? (
            <ReviewPanel question={currentQuestion} userAnswer={answers[currentQuestion.id] ?? null} onPrev={handlePrev} onNext={handleNext} />
          ) : null}
        </section>

        <aside className="space-y-6">
          <QuestionPalette questions={questions} currentIndex={currentIndex} answers={answers} visited={visited} reviews={reviews} onSelect={handleJumpTo} />
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg" onClick={() => setToast(null)}>
          {toast}
        </div>
      ) : null}
    </div>
  )
}
