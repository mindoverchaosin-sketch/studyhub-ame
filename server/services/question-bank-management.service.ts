import type { QuestionBankDTO, QuestionBankManagementDTO, QuestionBankStatus } from '@/server/application/dto/question-bank.dto'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'

export type QuestionBankManagementValidationError = {
  field: 'title' | 'description' | 'isPremium'
  message: string
}

export type QuestionBankManagementResult<T = QuestionBankManagementDTO> = {
  success: boolean
  errors: QuestionBankManagementValidationError[]
  questionBank?: T
}

export type QuestionBankListFilters = {
  search?: string
  status?: QuestionBankStatus | 'ALL'
  sortBy?: 'createdAt' | 'title' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type QuestionBankListResult = {
  items: QuestionBankManagementDTO[]
  total: number
  page: number
  pageSize: number
}

function mapQuestionBankEntityToDTO(entity: any): QuestionBankDTO {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    status: entity.status,
    isPremium: entity.isPremium,
    createdAt: entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

function mapQuestionBankEntityToManagementDTO(entity: any): QuestionBankManagementDTO {
  return {
    ...mapQuestionBankEntityToDTO(entity),
    questionCount: entity.questionCount ?? 0,
  }
}

export class QuestionBankManagementService {
  async createQuestionBank(input: {
    title: string
    description?: string | null
    isPremium?: boolean
  }): Promise<QuestionBankManagementResult> {
    const errors: QuestionBankManagementValidationError[] = []

    // Validate title
    if (!input.title || !input.title.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
      })
    }

    if (input.title && input.title.length > 255) {
      errors.push({
        field: 'title',
        message: 'Title must be 255 characters or less',
      })
    }

    // Validate isPremium
    if (input.isPremium !== undefined && typeof input.isPremium !== 'boolean') {
      errors.push({
        field: 'isPremium',
        message: 'isPremium must be a boolean',
      })
    }

    // Validate description
    if (input.description !== undefined && input.description !== null && input.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description must be 1000 characters or less',
      })
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    try {
      const created = await questionBankRepository.create({
        title: input.title.trim(),
        description: input.description?.trim() ?? null,
        isPremium: input.isPremium ?? false,
      })

      const withCount = await questionBankRepository.findByIdWithCount(created.id)

      return {
        success: true,
        errors: [],
        questionBank: withCount ? mapQuestionBankEntityToManagementDTO(withCount) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Failed to create question bank' }],
      }
    }
  }

  async updateQuestionBank(
    id: string,
    input: {
      title?: string
      description?: string | null
      isPremium?: boolean
    }
  ): Promise<QuestionBankManagementResult> {
    const errors: QuestionBankManagementValidationError[] = []

    // Validate title if provided
    if (input.title !== undefined) {
      if (!input.title || !input.title.trim()) {
        errors.push({
          field: 'title',
          message: 'Title is required',
        })
      }

      if (input.title && input.title.length > 255) {
        errors.push({
          field: 'title',
          message: 'Title must be 255 characters or less',
        })
      }
    }

    // Validate isPremium if provided
    if (input.isPremium !== undefined && typeof input.isPremium !== 'boolean') {
      errors.push({
        field: 'isPremium',
        message: 'isPremium must be a boolean',
      })
    }

    // Validate description if provided
    if (input.description !== undefined && input.description !== null && input.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description must be 1000 characters or less',
      })
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    try {
      const updateData: any = {}

      if (input.title !== undefined) {
        updateData.title = input.title.trim()
      }

      if (input.description !== undefined) {
        updateData.description = input.description?.trim() ?? null
      }

      if (input.isPremium !== undefined) {
        updateData.isPremium = input.isPremium
      }

      const updated = await questionBankRepository.update(id, updateData)
      const withCount = await questionBankRepository.findByIdWithCount(updated.id)

      return {
        success: true,
        errors: [],
        questionBank: withCount ? mapQuestionBankEntityToManagementDTO(withCount) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Failed to update question bank' }],
      }
    }
  }

  async archiveQuestionBank(id: string): Promise<QuestionBankManagementResult> {
    const existing = await questionBankRepository.findById(id)
    if (!existing) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Question bank not found.' }],
      }
    }
    try {
      const archived = await questionBankRepository.archive(id)
      const withCount = await questionBankRepository.findByIdWithCount(archived.id)

      return {
        success: true,
        errors: [],
        questionBank: withCount ? mapQuestionBankEntityToManagementDTO(withCount) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Failed to archive question bank' }],
      }
    }
  }

  async publishQuestionBank(id: string): Promise<QuestionBankManagementResult> {
    const existing = await questionBankRepository.findById(id)
    if (!existing) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Question bank not found.' }],
      }
    }
    try {
      const published = await questionBankRepository.publish(id)
      const withCount = await questionBankRepository.findByIdWithCount(published.id)

      return {
        success: true,
        errors: [],
        questionBank: withCount ? mapQuestionBankEntityToManagementDTO(withCount) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'title', message: 'Failed to publish question bank' }],
      }
    }
  }

  async listQuestionBanks(filters: QuestionBankListFilters = {}): Promise<QuestionBankListResult> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const sortBy = filters.sortBy ?? 'createdAt'
    const sortOrder = filters.sortOrder ?? 'desc'

    const items = await questionBankRepository.findForAdmin({
      search: filters.search,
      status: filters.status,
      sortBy,
      sortOrder,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const total = await questionBankRepository.countForAdmin({
      search: filters.search,
      status: filters.status,
    })

    return {
      items: items.map((item) => mapQuestionBankEntityToManagementDTO(item)),
      total,
      page,
      pageSize,
    }
  }

  async getQuestionBank(id: string): Promise<QuestionBankManagementDTO | null> {
    const qb = await questionBankRepository.findByIdWithCount(id)
    return qb ? mapQuestionBankEntityToManagementDTO(qb) : null
  }
}

export const questionBankManagementService = new QuestionBankManagementService()
