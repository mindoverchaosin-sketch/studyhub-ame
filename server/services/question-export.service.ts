import { questionRepository } from '@/server/repositories/question.repository'
import type { QuestionManagementListFilters } from '@/server/services/question-management.service'

export class QuestionExportService {
  async exportQuestions(filters: QuestionManagementListFilters = {}): Promise<string> {
    const rows = await questionRepository.findForAdmin({
      search: filters.search,
      status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
      difficulty: filters.difficulty && filters.difficulty !== 'ALL' ? filters.difficulty : undefined,
    })

    const moduleFilter = (filters as { module?: string }).module
    const filteredRows = moduleFilter ? rows.filter((row: any) => row.questionBankId === moduleFilter) : rows

    const header = 'question,options,correct_answer,explanation,module,difficulty,status'
    const body = filteredRows.map((row: any) => {
      const options = Array.isArray(row.options)
        ? (row.options as unknown[]).filter((option: unknown): option is string => typeof option === 'string')
        : []
      const correctAnswer = typeof row.correctOptionIndex === 'number' ? options[row.correctOptionIndex] ?? '' : ''
      return [
        JSON.stringify(row.prompt ?? ''),
        JSON.stringify(options.join(' | ')),
        JSON.stringify(correctAnswer),
        JSON.stringify(row.explanation ?? ''),
        JSON.stringify(row.questionBankId ?? ''),
        JSON.stringify(row.difficulty ?? ''),
        JSON.stringify(row.status ?? ''),
      ].join(',')
    })

    return [header, ...body].join('\n')
  }
}

export const questionExportService = new QuestionExportService()
