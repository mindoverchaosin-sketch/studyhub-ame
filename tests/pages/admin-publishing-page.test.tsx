import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`) }),
  PageHeader: vi.fn(() => <div data-testid="page-header" />),
  PublishingInventory: vi.fn(() => <div data-testid="publishing-inventory" />),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/features/admin/components/PageHeader', () => ({ default: mocks.PageHeader }))
vi.mock('@/components/admin/publishing/PublishingInventory', () => ({ default: mocks.PublishingInventory }))

import AdminPublishingPage from '@/app/(admin)/admin/publishing/page'

describe('AdminPublishingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'editor-1', role: 'CONTENT_EDITOR' } })
  })

  it('requires publishing permission and renders the central inventory', async () => {
    render(await AdminPublishingPage())

    expect(mocks.requirePermission).toHaveBeenCalledWith('publishContent')
    expect(screen.getByTestId('publishing-inventory')).toBeInTheDocument()
  })

  it('redirects callers without publishing permission', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    await expect(AdminPublishingPage()).rejects.toThrow('REDIRECT:/login')
    expect(mocks.PublishingInventory).not.toHaveBeenCalled()
  })
})
