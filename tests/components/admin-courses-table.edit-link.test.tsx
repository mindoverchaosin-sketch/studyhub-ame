import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminCoursesTable from '@/features/admin/components/AdminCoursesTable'

describe('AdminCoursesTable Edit navigation', () => {
  it('uses the canonical Admin course route and database ID', () => {
    render(<AdminCoursesTable courses={[{
      id: 'course-db-id',
      title: 'DGCA Airframe',
      slug: 'dgca-airframe',
      examType: 'DGCA',
      isPublished: true,
      moduleCount: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    }]} />)

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/courses/course-db-id')
  })
})