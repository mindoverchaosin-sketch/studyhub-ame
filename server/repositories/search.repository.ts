import prisma from '@/lib/prisma'
import type { SearchCategory, SearchResponse, SearchResultItem } from '@/features/search/types'

function createResult(category: SearchCategory, id: string, title: string, description: string | null | undefined, href: string, meta: string): SearchResultItem {
  return { id, category, title, description: description ?? undefined, href, meta }
}

export class SearchRepository {
  async searchAll(query: string): Promise<SearchResponse> {
    const normalized = query.trim().toLowerCase()
    const suggestions = ['Aircraft', 'Electrical', 'PDF', 'Quiz', 'Systems', 'Maintenance']

    if (!normalized) {
      return {
        query: '',
        groupedResults: { course: [], module: [], section: [], topic: [], resource: [], question: [] },
        totalResults: 0,
        suggestions,
      }
    }

    const [courses, modules] = await Promise.all([
      prisma.course.findMany({ where: { status: 'PUBLISHED', OR: [{ title: { contains: normalized, mode: 'insensitive' } }, { description: { contains: normalized, mode: 'insensitive' } }] }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.module.findMany({ where: { status: 'PUBLISHED', OR: [{ title: { contains: normalized, mode: 'insensitive' } }, { description: { contains: normalized, mode: 'insensitive' } }] }, include: { course: true }, orderBy: { displayOrder: 'asc' }, take: 8 }),
    ])

    const groupedResults = {
      course: courses.map((course) => createResult('course', course.id, course.title, course.description, `/student/courses/${course.slug}`, course.status)),
      module: modules.map((module) => createResult('module', module.id, module.title, module.description, `/student/courses/${module.course.slug}/modules/${module.slug}`, module.course.title)),
      section: [],
      topic: [],
      resource: [],
      question: [],
    } satisfies Record<SearchCategory, SearchResultItem[]>

    const totalResults = Object.values(groupedResults).reduce((sum, group) => sum + group.length, 0)

    return { query: normalized, groupedResults, totalResults, suggestions }
  }
}

export const searchRepository = new SearchRepository()
