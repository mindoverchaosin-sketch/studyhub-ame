import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ModuleDirectoryPanel from '@/components/admin/modules/ModuleDirectoryPanel'
import type { ModuleDirectoryDTO } from '@/server/application/dto/module-management.dto'

vi.mock('next/link', () => ({
  default: (props: { href: string; className?: string; children?: React.ReactNode }) => (
    <a href={props.href} className={props.className} data-testid="module-link">
      {props.children}
    </a>
  ),
}))

const directory: ModuleDirectoryDTO = {
  summary: { totalCount: 1, publishedCount: 1, draftCount: 0, archivedCount: 0 },
  pagination: { page: 1, totalPages: 1, pageSize: 10, totalItems: 1 },
  items: [
    {
      id: 'm1',
      title: 'Airframes',
      slug: 'airframes',
      moduleNumber: '01',
      examType: 'DGCA',
      status: 'PUBLISHED',
      description: 'Intro',
      lessonCount: 2,
      resourceCount: 1,
      updatedAt: '2024-02-01',
      createdAt: '2024-01-01',
    },
  ],
}

describe('ModuleDirectoryPanel', () => {
  it('produces /admin/modules links when no basePath is provided', () => {
    render(<ModuleDirectoryPanel directory={directory} query="" examType="ALL" status="ALL" sortBy="updated" page={1} />)
    const links = screen.getAllByTestId('module-link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs.every((href) => href?.startsWith('/admin/modules'))).toBe(true)
})

  it('produces /content-editor/modules links when basePath is provided', () => {
    render(
      <ModuleDirectoryPanel
        directory={directory}
        query=""
        examType="ALL"
        status="ALL"
        sortBy="updated"
        page={1}
        basePath="/content-editor/modules"
      />,
    )
    const links = screen.getAllByTestId('module-link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs.every((href) => href?.startsWith('/content-editor/modules'))).toBe(true)
  })
})
