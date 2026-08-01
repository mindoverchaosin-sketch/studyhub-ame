import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AIChatPanel from '@/components/ai/AIChatPanel'

const createStreamResponse = (chunks: string[]) => {
  let index = 0
  const reader = {
    read: async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined }
      }
      return { done: false, value: new TextEncoder().encode(chunks[index++]) }
    },
  }

  return {
    ok: true,
    body: {
      getReader: () => reader,
    },
  }
}

describe('AIChatPanel streaming UI', () => {
  beforeEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders streaming assistant text from complete chunks', async () => {
    const response = createStreamResponse([
      JSON.stringify({ type: 'delta', content: 'Hello ' }) + '\n',
      JSON.stringify({ type: 'delta', content: 'world' }) + '\n',
      JSON.stringify({ type: 'done' }) + '\n',
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<AIChatPanel />)
    fireEvent.change(screen.getByPlaceholderText(/Ask the tutor/i), { target: { value: 'Explain corrosion' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(screen.getByText('Thinking…')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Hello world')).toBeInTheDocument())
    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument()
  })

  it('buffers partial chunks and merges text correctly', async () => {
    const delta = JSON.stringify({ type: 'delta', content: 'Hello world' })
    const response = createStreamResponse([
      delta.slice(0, 20),
      delta.slice(20) + '\n' + JSON.stringify({ type: 'done' }) + '\n',
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<AIChatPanel />)
    fireEvent.change(screen.getByPlaceholderText(/Ask the tutor/i), { target: { value: 'Explain corrosion' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(screen.getByText('Hello world')).toBeInTheDocument())
    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument()
  })

  it('handles malformed stream lines without breaking the UI', async () => {
    const response = createStreamResponse([
      '{invalid json}\n',
      JSON.stringify({ type: 'delta', content: 'Hello' }) + '\n',
      JSON.stringify({ type: 'done' }) + '\n',
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<AIChatPanel />)
    fireEvent.change(screen.getByPlaceholderText(/Ask the tutor/i), { target: { value: 'Explain corrosion' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument())
  })

  it('shows cancel button while streaming and stops updates after cancellation', async () => {
    let aborted = false
    const reader = {
      read: async () => {
        if (aborted) {
          return { done: true, value: undefined }
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { done: false, value: new TextEncoder().encode(JSON.stringify({ type: 'delta', content: 'partial' }) + '\n') }
      },
    }
    const response = {
      ok: true,
      body: {
        getReader: () => reader,
      },
    }

    const abortSpy = vi.fn()
    const controller = new AbortController()
    vi.stubGlobal('AbortController', vi.fn(() => ({
      signal: controller.signal,
      abort: () => {
        aborted = true
        abortSpy()
      },
      addEventListener: controller.signal.addEventListener.bind(controller.signal),
      removeEventListener: controller.signal.removeEventListener.bind(controller.signal),
    })))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<AIChatPanel />)
    fireEvent.change(screen.getByPlaceholderText(/Ask the tutor/i), { target: { value: 'Explain corrosion' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    await waitFor(() => expect(screen.queryByText('partial')).not.toBeInTheDocument())
    expect(abortSpy).toHaveBeenCalled()
    expect(screen.getByText(/Generation cancelled/i)).toBeInTheDocument()
  })

  it('renders provider error from stream as an error message', async () => {
    const response = createStreamResponse([
      JSON.stringify({ type: 'error', error: 'Stream failure' }) + '\n',
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<AIChatPanel />)
    fireEvent.change(screen.getByPlaceholderText(/Ask the tutor/i), { target: { value: 'Explain corrosion' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(screen.getByText(/Stream failure/i)).toBeInTheDocument())
  })
})
