import type { PreviousOfficialPaperDTO, StudentPreviousOfficialPaperDTO } from '@/server/application/dto/previous-official-paper.dto'
import { courseRepository } from '@/server/repositories/course.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { previousOfficialPaperRepository, type PreviousOfficialPaperFilters } from '@/server/repositories/previous-official-paper.repository'
import { contentAccessService } from '@/server/services/content-access.service'
import { validateStudyMaterialUrl } from '@/server/services/study-material-management.service'

export type PreviousOfficialPaperCreateInput = {
  courseId: string
  moduleId: string
  year: number
  title: string
  paperType: string
  mediaPath: string
  isPremium?: boolean
}

export type PreviousOfficialPaperUpdateInput = Partial<PreviousOfficialPaperCreateInput>

function mapPaper(paper: any): PreviousOfficialPaperDTO {
  return {
    id: paper.id,
    courseId: paper.courseId,
    moduleId: paper.moduleId,
    courseTitle: paper.course.title,
    moduleTitle: paper.module.title,
    year: paper.year,
    title: paper.title,
    paperType: paper.paperType,
    mediaPath: paper.mediaPath,
    isPremium: paper.isPremium,
    status: paper.status,
    publishedAt: paper.publishedAt,
    createdAt: paper.createdAt,
    updatedAt: paper.updatedAt,
  }
}

function mapStudentPaper(paper: any): StudentPreviousOfficialPaperDTO {
  const mapped = mapPaper(paper)
  const { mediaPath: _mediaPath, status: _status, publishedAt: _publishedAt, createdAt: _createdAt, updatedAt: _updatedAt, ...studentPaper } = mapped
  return studentPaper
}

function validateMetadata(input: { year: number; title: string; paperType: string }) {
  const currentYear = new Date().getFullYear()
  if (!Number.isInteger(input.year) || input.year < 1950 || input.year > currentYear + 1) {
    throw new Error('Paper year is invalid')
  }
  if (!input.title.trim()) throw new Error('Paper title is required')
  if (!input.paperType.trim()) throw new Error('Paper type is required')
}

async function validateRelations(courseId: string, moduleId: string) {
  const [course, module] = await Promise.all([courseRepository.findById(courseId), moduleRepository.findById(moduleId)])
  if (!course || !module || module.courseId !== courseId) {
    throw new Error('Paper course and module relationship is invalid')
  }
}

export class PreviousOfficialPaperService {
  async listForAdmin(filters: PreviousOfficialPaperFilters = {}) {
    return (await previousOfficialPaperRepository.findForAdmin(filters)).map(mapPaper)
  }

  async listForStudent(filters: Pick<PreviousOfficialPaperFilters, 'courseId' | 'moduleId' | 'year' | 'isPremium'> = {}) {
    return (await previousOfficialPaperRepository.findPublished(filters)).map(mapStudentPaper)
  }

  async getById(id: string) {
    const paper = await previousOfficialPaperRepository.findById(id)
    return paper ? mapPaper(paper) : null
  }

  async create(input: PreviousOfficialPaperCreateInput) {
    validateMetadata(input)
    await validateRelations(input.courseId, input.moduleId)
    const mediaPath = validateStudyMaterialUrl(input.mediaPath)
    return mapPaper(await previousOfficialPaperRepository.create({
      course: { connect: { id: input.courseId } },
      module: { connect: { id: input.moduleId } },
      year: input.year,
      title: input.title.trim(),
      paperType: input.paperType.trim(),
      mediaPath,
      isPremium: input.isPremium ?? false,
    }))
  }

  async update(id: string, input: PreviousOfficialPaperUpdateInput) {
    const existing = await previousOfficialPaperRepository.findById(id)
    if (!existing) throw new Error('Paper not found')
    const courseId = input.courseId ?? existing.courseId
    const moduleId = input.moduleId ?? existing.moduleId
    await validateRelations(courseId, moduleId)
    validateMetadata({
      year: input.year ?? existing.year,
      title: input.title ?? existing.title,
      paperType: input.paperType ?? existing.paperType,
    })

    return mapPaper(await previousOfficialPaperRepository.update(id, {
      ...(input.courseId ? { course: { connect: { id: input.courseId } } } : {}),
      ...(input.moduleId ? { module: { connect: { id: input.moduleId } } } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.paperType !== undefined ? { paperType: input.paperType.trim() } : {}),
      ...(input.mediaPath !== undefined ? { mediaPath: validateStudyMaterialUrl(input.mediaPath) } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
    }))
  }

  async archive(id: string) {
    return mapPaper(await previousOfficialPaperRepository.update(id, { status: 'ARCHIVED' }))
  }

  async publish(id: string) {
    return mapPaper(await previousOfficialPaperRepository.update(id, { status: 'PUBLISHED', publishedAt: new Date() }))
  }

  async unpublish(id: string) {
    return mapPaper(await previousOfficialPaperRepository.update(id, { status: 'DRAFT', publishedAt: null }))
  }

  async getStudentAccess(studentId: string, id: string) {
    const paper = await previousOfficialPaperRepository.findPublishedById(id)
    if (!paper) return null
    const access = await contentAccessService.canAccessStudyMaterial(studentId, paper.isPremium)
    return { paper: mapPaper(paper), ...access }
  }
}

export const previousOfficialPaperService = new PreviousOfficialPaperService()
