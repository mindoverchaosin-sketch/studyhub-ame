import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`) }),
  listExamTemplates: vi.fn(),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/server/actions/exam.actions', () => ({ listExamTemplates: mocks.listExamTemplates }))

describe('AdminExamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.listExamTemplates.mockResolvedValue([])
  })

  it('redirects to login when unauthenticated or unauthorized', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    const { default: AdminExamsPage } = await import('@/app/(admin)/admin/exams/page')
    await expect(AdminExamsPage()).rejects.toThrow('REDIRECT:/login')
    expect(mocks.requirePermission).toHaveBeenCalledWith('manageModules')
    expect(mocks.listExamTemplates).not.toHaveBeenCalled()
  })

  it('renders the page for an authorized admin', async () => {
    const { default: AdminExamsPage } = await import('@/app/(admin)/admin/exams/page')
    const result = await AdminExamsPage()

    expect(mocks.requirePermission).toHaveBeenCalledWith('manageModules')
    expect(mocks.listExamTemplates).toHaveBeenCalledWith({ pageSize: 50 })

    render(result)
    expect(screen.getByRole('heading', { name: /mock exams/i })).toBeInTheDocument()
    expect(screen.getByText('No templates found')).toBeInTheDocument()
  })
})
