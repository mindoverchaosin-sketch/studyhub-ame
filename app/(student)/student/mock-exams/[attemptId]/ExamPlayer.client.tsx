"use client"

import React, { useEffect, useMemo, useState, useRef } from 'react'

type AttemptDTO = any

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export default function ExamPlayer({ initialAttempt }: { initialAttempt: AttemptDTO }) {
  const [attempt] = useState<AttemptDTO>(initialAttempt)
  const [questions, setQuestions] = useState<any[]>(() => (initialAttempt.questions || []).slice())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [reviews, setReviews] = useState<Record<string, boolean>>({})
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [remainingMs, setRemainingMs] = useState(() => {
    const now = Date.now()
    const exp = initialAttempt.expiresAt ? new Date(initialAttempt.expiresAt).getTime() : now
    return Math.max(0, exp - now)
  })
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const timerRef = useRef<number | null>(null)
  const autoSubmitFired = useRef(false)
  const saveTimers = useRef<Record<string, number>>({})
  const inflightSaves = useRef<Record<string, Promise<any> | null>>({})

  // ensure questions are in displayOrder
  useEffect(() => {
    const sorted = (initialAttempt.questions || []).slice().sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    setQuestions(sorted)
  }, [initialAttempt.questions])

  // restore currentIndex from localStorage if available
  useEffect(() => {
    try {
      const key = `exam_attempt_${initialAttempt.id}_currentIndex`
      const raw = localStorage.getItem(key)
      if (raw) {
        const idx = parseInt(raw, 10)
        if (!Number.isNaN(idx) && idx >= 0 && idx < (initialAttempt.questions || []).length) setCurrentIndex(idx)
      }
    } catch (e) {
      // ignore
    }
  }, [initialAttempt.id, initialAttempt.questions])

  useEffect(() => {
    const ans: any = {}
    const b: any = {}
    const r: any = {}
    const v: any = {}
    questions.forEach((q: any) => {
      const id = q.id
      ans[id] = typeof q.selectedOption === 'number' ? q.selectedOption : null
      b[id] = !!q.bookmarked
      r[id] = !!q.markedForReview
      v[id] = Boolean(q.answeredAt || typeof q.selectedOption === 'number')
    })
    setAnswers(ans)
    setBookmarks(b)
    setReviews(r)
    setVisited(v)
  }, [questions])

  useEffect(() => {
    // countdown timer
    timerRef.current = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          // auto-submit once
          if (!autoSubmitFired.current) {
            autoSubmitFired.current = true
            void doSubmit(true)
          }
          if (timerRef.current) window.clearInterval(timerRef.current)
          return 0
        }
        return prev - 1000
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [initialAttempt.id])

  const currentQuestion = useMemo(() => questions?.[currentIndex] ?? null, [questions, currentIndex])

  const formatTime = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // helper: persist currentIndex to localStorage
  useEffect(() => {
    try {
      const key = `exam_attempt_${initialAttempt.id}_currentIndex`
      localStorage.setItem(key, String(currentIndex))
    } catch (e) {
      // ignore
    }
  }, [initialAttempt.id, currentIndex])

  // debounced save answer per question
  const enqueueSaveAnswer = (attemptQuestionId: string, selectedOption: number | null) => {
    // clear existing timer
    const existing = saveTimers.current[attemptQuestionId]
    if (existing) window.clearTimeout(existing)
    const timer = window.setTimeout(() => {
      // perform save
      const payload: any = { attemptQuestionId }
      if (typeof selectedOption !== 'undefined') payload.selectedOption = selectedOption
      payload.answeredAt = new Date().toISOString()
      setSavingMap((m) => ({ ...m, [attemptQuestionId]: true }))
      const p = fetchJson(`/api/exam/attempt/${initialAttempt.id}/save-answer`, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
        .catch((err) => {
          setToast('Failed to save answer')
        })
        .finally(() => {
          setSavingMap((m) => ({ ...m, [attemptQuestionId]: false }))
          inflightSaves.current[attemptQuestionId] = null
        })
      inflightSaves.current[attemptQuestionId] = p
    }, 350)
    saveTimers.current[attemptQuestionId] = timer as unknown as number
  }

  const doSaveBookmark = async (attemptQuestionId: string, bookmarked: boolean) => {
    setSavingMap((m) => ({ ...m, [attemptQuestionId]: true }))
    try {
      await fetchJson(`/api/exam/attempt/${initialAttempt.id}/bookmark`, { method: 'POST', body: JSON.stringify({ attemptQuestionId, bookmarked }), headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      setToast('Failed to save bookmark')
    } finally {
      setSavingMap((m) => ({ ...m, [attemptQuestionId]: false }))
    }
  }

  const doSaveReview = async (attemptQuestionId: string, markedForReview: boolean) => {
    setSavingMap((m) => ({ ...m, [attemptQuestionId]: true }))
    try {
      await fetchJson(`/api/exam/attempt/${initialAttempt.id}/mark-review`, { method: 'POST', body: JSON.stringify({ attemptQuestionId, markedForReview }), headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      setToast('Failed to save review flag')
    } finally {
      setSavingMap((m) => ({ ...m, [attemptQuestionId]: false }))
    }
  }

  const handleSelectOption = (attemptQuestionId: string, optionIndex: number) => {
    setAnswers((cur) => ({ ...cur, [attemptQuestionId]: optionIndex }))
    // enqueue debounced save
    enqueueSaveAnswer(attemptQuestionId, optionIndex)
  }

  const handleBookmark = (attemptQuestionId: string) => {
    const newVal = !bookmarks[attemptQuestionId]
    setBookmarks((cur) => ({ ...cur, [attemptQuestionId]: newVal }))
    void doSaveBookmark(attemptQuestionId, newVal)
  }

  const handleMarkReview = (attemptQuestionId: string) => {
    const newVal = !reviews[attemptQuestionId]
    setReviews((cur) => ({ ...cur, [attemptQuestionId]: newVal }))
    void doSaveReview(attemptQuestionId, newVal)
  }

  const markVisited = (attemptQuestionId: string) => {
    setVisited((cur) => ({ ...cur, [attemptQuestionId]: true }))
    // save an answeredAt timestamp only to mark visited
    enqueueSaveAnswer(attemptQuestionId, undefined as unknown as number | null)
  }

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index)
    const q = questions?.[index]
    if (q) markVisited(q.id)
  }

  const handleNext = () => {
    setCurrentIndex((i) => {
      const ni = Math.min((questions?.length ?? 1) - 1, i + 1)
      const q = questions?.[ni]
      if (q) markVisited(q.id)
      return ni
    })
  }
  const handlePrev = () => {
    setCurrentIndex((i) => {
      const ni = Math.max(0, i - 1)
      const q = questions?.[ni]
      if (q) markVisited(q.id)
      return ni
    })
  }

  const doSubmit = async (isAuto = false) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      // ensure all pending saves are flushed
      const timers = Object.values(saveTimers.current)
      for (const t of timers) if (t) window.clearTimeout(t)
      const inflight = Object.values(inflightSaves.current).filter(Boolean) as Promise<any>[]
      if (inflight.length) await Promise.allSettled(inflight)

      await fetchJson(`/api/exam/attempt/${initialAttempt.id}/submit`, { method: 'POST' })
      // redirect to results placeholder
      window.location.assign(`/student/mock-exams/${initialAttempt.id}/results`)
    } catch (e) {
      setToast('Failed to submit attempt')
      submittingRef.current = false
      setSubmitting(false)
      if (isAuto) {
        // if auto submit failed, keep autoSubmitFired false so retry on next tick
        autoSubmitFired.current = false
      }
    }
  }

  const handleSubmit = async () => {
    // show confirmation with unanswered count
    const unanswered = questions.reduce((acc, q) => (answers[q.id] == null ? acc + 1 : acc), 0)
    if (!confirm(`You have ${unanswered} unanswered questions. Submit?`)) return
    await doSubmit(false)
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg" data-testid="time-left">Time left: {formatTime(remainingMs)}</div>
          <button data-testid="submit-button" disabled={submitting} onClick={handleSubmit} className="rounded bg-red-600 text-white px-3 py-1 disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Question {currentIndex + 1}</h2>
          <p className="mt-2">{currentQuestion?.question}</p>
          <div className="mt-4 space-y-2">
            {(currentQuestion?.options || []).map((opt: any, idx: number) => (
              <div key={idx}>
                <label className="flex items-center gap-2">
                  <input type="radio" name={`opt-${currentQuestion?.id}`} checked={answers[currentQuestion.id] === idx} onChange={() => handleSelectOption(currentQuestion.id, idx)} disabled={submitting || !!savingMap[currentQuestion.id]} />
                  <span>{opt}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handlePrev} className="rounded border px-3 py-1" disabled={submitting}>Previous</button>
            <button onClick={handleNext} className="rounded border px-3 py-1" disabled={submitting}>Next</button>
            <button data-testid="bookmark-button" onClick={() => handleBookmark(currentQuestion.id)} className="rounded border px-3 py-1" disabled={submitting || !!savingMap[currentQuestion.id]}>{bookmarks[currentQuestion.id] ? 'Unbookmark' : 'Bookmark'}</button>
            <button data-testid="review-button" onClick={() => handleMarkReview(currentQuestion.id)} className="rounded border px-3 py-1" disabled={submitting || !!savingMap[currentQuestion.id]}>{reviews[currentQuestion.id] ? 'Unmark Review' : 'Mark for Review'}</button>
          </div>
        </div>
      </div>

      <aside className="p-4 border rounded">
        <h3 className="font-semibold">Question Palette</h3>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {questions.map((q: any, idx: number) => {
            const state = answers[q.id] != null ? 'answered' : visited[q.id] ? 'visited' : 'not-visited'
            const baseClass = idx === currentIndex ? 'bg-blue-600 text-white' : visited[q.id] ? 'bg-slate-200' : 'bg-slate-100'
            const className = `p-2 rounded ${baseClass}`
            return (
              <button key={q.id} data-testid={`palette-button-${idx}`} onClick={() => handleJumpTo(idx)} className={className} disabled={submitting} title={`Q ${idx + 1} - ${state}`}>
                {idx + 1}
              </button>
            )
          })}
        </div>
      </aside>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  )
}
