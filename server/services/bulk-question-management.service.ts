import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { questionRepository } from '@/server/repositories/question.repository'

export type BulkQuestionOperationSummary = {
  successCount: number
  failureCount: number
  validationErrors: string[]
}

export type BulkQuestionOperationResult<T> = {
  summary: BulkQuestionOperationSummary
  items: T[]
}

export class BulkQuestionManagementService {
  async archiveQuestions(ids: string[]): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyStatusChange(ids, 'ARCHIVED', async (id) => questionRepository.archive(id))
  }

  async restoreQuestions(ids: string[]): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyStatusChange(ids, 'DRAFT', async (id) => questionRepository.restore(id))
  }

  async updateModule(ids: string[], questionBankId: string): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyBulkUpdate(ids, async (id) => questionRepository.update(id, { questionBankId } as any))
  }

  async updateDifficulty(ids: string[], difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyBulkUpdate(ids, async (id) => questionRepository.update(id, { difficulty } as any))
  }

  async updateTags(ids: string[], tags: string[]): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyBulkUpdate(ids, async (id) => questionRepository.update(id, { metadata: { tags } } as any))
  }

  async publishQuestions(ids: string[]): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyStatusChange(ids, 'PUBLISHED', async (id) => questionRepository.update(id, { status: 'PUBLISHED' } as any))
  }

  async unpublishQuestions(ids: string[]): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    return this.applyStatusChange(ids, 'DRAFT', async (id) => questionRepository.update(id, { status: 'DRAFT' } as any))
  }

  private async applyStatusChange(ids: string[], status: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED', operation: (id: string) => Promise<any>): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    const items: QuestionDTO[] = []
    const errors: string[] = []

    for (const id of ids) {
      try {
        const result = await operation(id)
        items.push(this.mapQuestion(result))
      } catch {
        errors.push(`Unable to update question ${id}`)
      }
    }

    return {
      summary: {
        successCount: items.length,
        failureCount: ids.length - items.length,
        validationErrors: errors,
      },
      items,
    }
  }

  private async applyBulkUpdate(ids: string[], operation: (id: string) => Promise<any>): Promise<BulkQuestionOperationResult<QuestionDTO>> {
    const items: QuestionDTO[] = []
    const errors: string[] = []

    for (const id of ids) {
      try {
        const result = await operation(id)
        items.push(this.mapQuestion(result))
      } catch {
        errors.push(`Unable to update question ${id}`)
      }
    }

    return {
      summary: {
        successCount: items.length,
        failureCount: ids.length - items.length,
        validationErrors: errors,
      },
      items,
    }
  }

  private mapQuestion(question: any): QuestionDTO {
    const options = Array.isArray(question.options)
      ? (question.options as unknown[]).filter((option: unknown): option is string => typeof option === 'string')
      : []
    return {
      id: question.id,
      question: question.prompt,
      options: options.map((text: string, index: number) => ({ id: String(index), text })),
      optionA: options[0] ?? '',
      optionB: options[1] ?? '',
      optionC: options[2] ?? '',
      optionD: options[3] ?? '',
      correctAnswer: typeof question.correctOptionIndex === 'number' ? options[question.correctOptionIndex] ?? null : null,
      explanation: question.explanation ?? null,
      difficulty: question.difficulty,
      questionBankId: question.questionBankId,
    }
  }
}

export const bulkQuestionManagementService = new BulkQuestionManagementService()
