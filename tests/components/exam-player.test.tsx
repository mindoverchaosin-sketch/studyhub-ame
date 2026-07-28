import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExamPlayer from '@/app/(student)/student/mock-exams/[attemptId]/ExamPlayer.client'

const originalLocation = window.location

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('ExamPlayer', () => {
  beforeEach(() => {
    cleanup()
    vi.restoreAllMocks()
    localStorage.clear()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: vi.fn(),
      },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  const makeAttempt = (overrides: any = {}) => ({
    id: 'attempt-1',
    templateId: 'template-1',
    expiresAt: new Date(Date.now() + 30000).toISOString(),
    questions: [
      { id: 'q1', questionId: 'question-1', displayOrder: 1, question: 'Question 1', options: ['A', 'B', 'C'] },
      { id: 'q2', questionId: 'question-2', displayOrder: 2, question: 'Question 2', options: ['A', 'B', 'C'] },
    ],
    answers: [],
    ...overrides,
  })

  it('restores currentIndex from localStorage', () => {
    localStorage.setItem('exam_attempt_attempt-1_currentIndex', '1')
    render(<ExamPlayer initialAttempt={makeAttempt()} />)
    expect(screen.getByRole('heading', { name: /Question 2/ })).toBeInTheDocument()
  })

  it('auto-submits when timer expires once', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    render(<ExamPlayer initialAttempt={makeAttempt({ expiresAt: new Date(Date.now() + 1100).toISOString() })} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/exam/attempt/attempt-1/submit', { method: 'POST' }), { timeout: 3000 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('debounces autosave on answer selection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    render(<ExamPlayer initialAttempt={makeAttempt()} />)

    fireEvent.click(screen.getAllByLabelText('A')[0])
    fireEvent.click(screen.getAllByLabelText('B')[0])

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })

  it('persists bookmark and review state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    render(<ExamPlayer initialAttempt={makeAttempt()} />)

    fireEvent.click(screen.getByTestId('bookmark-button'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), { timeout: 3000 })

    fireEvent.click(screen.getByTestId('review-button'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 3000 })

    expect(screen.getByTestId('bookmark-button')).toHaveTextContent('Unbookmark')
    expect(screen.getByTestId('review-button')).toHaveTextContent('Unmark Review')
  })

  it('prevents duplicate submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    render(<ExamPlayer initialAttempt={makeAttempt()} />)

    fireEvent.click(screen.getByTestId('submit-button'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), { timeout: 3000 })

    fireEvent.click(screen.getByTestId('submit-button'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
