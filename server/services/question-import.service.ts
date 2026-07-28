import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import type { Prisma, $Enums } from '@prisma/client'

export type QuestionImportValidationError = {
  row: number
  message: string
}

export type QuestionImportSummary = {
  successCount: number
  failureCount: number
  validationErrors: string[]
}

export type QuestionImportResult = {
  summary: QuestionImportSummary
  rows: Array<{
    row: number
    prompt: string
    options: string[]
    correctAnswer: string | null
    difficulty: string
    status: string
    errors: string[]
  }>
}

function parseCsv(content: string) {
  const rows = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (!rows.length) {
    return []
  }

  const header = rows[0].split(',').map((cell) => cell.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'))
  return rows.slice(1).map((row) => {
    const values = row.split(',').map((cell) => cell.trim())
    return header.reduce<Record<string, string>>((accumulator, key, index) => {
      accumulator[key] = values[index] ?? ''
      return accumulator
    }, {})
  })
}

function normalizeOptions(value: string) {
  return value
    .split('|')
    .map((option) => option.trim())
    .filter(Boolean)
}

function normalizeCorrectAnswer(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized && normalized !== 'missing' && normalized !== 'none' ? value.trim() : ''
}

export class QuestionImportService {
  async importQuestions(input: { questionBankId: string; content: string }): Promise<QuestionImportResult> {
    const bank = await questionBankRepository.findById(input.questionBankId)
    if (!bank) {
      return {
        summary: { successCount: 0, failureCount: 0, validationErrors: ['Invalid question bank'] },
        rows: [],
      }
    }

    const parsedRows = parseCsv(input.content)
    if (!parsedRows.length) {
      return {
        summary: { successCount: 0, failureCount: 0, validationErrors: ['No rows to import'] },
        rows: [],
      }
    }

    const existingQuestions = await questionRepository.findByBank(input.questionBankId)
    const seenPrompts = new Set(existingQuestions.map((question: any) => question.prompt?.toLowerCase?.() ?? ''))
    const validRows: Array<{ prompt: string; options: string[]; correctAnswer: string | null; difficulty: string; status: string }> = []
    const resultRows: QuestionImportResult['rows'] = []
    const errors: string[] = []

    parsedRows.forEach((row, index) => {
      const prompt = row.question ?? row.prompt ?? ''
      const options = normalizeOptions(row.options ?? '')
      const correctAnswer = normalizeCorrectAnswer(row.correct_answer ?? row.correctAnswer ?? '')
      const difficulty = (row.difficulty ?? 'BEGINNER').toUpperCase()
      const moduleName = (row.module ?? '').trim()
      const status = (row.status ?? 'DRAFT').toUpperCase()
      const rowErrors: string[] = []

      if (!prompt) {
        rowErrors.push('Question text is required')
      }

      if (options.length < 2) {
        rowErrors.push('At least two options are required')
      }

      if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
        rowErrors.push('Duplicate options are not allowed')
      }

      if (!correctAnswer) {
        rowErrors.push('A correct answer is required')
      }

      if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(difficulty)) {
        rowErrors.push('Invalid difficulty')
      }

      if (!moduleName) {
        rowErrors.push('Module is required')
      }

      if (moduleName && moduleName.toLowerCase() !== bank.title.toLowerCase()) {
        rowErrors.push('Invalid module')
      }

      if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        rowErrors.push('Invalid status')
      }

      if (seenPrompts.has(prompt.toLowerCase())) {
        rowErrors.push('Duplicate question already exists')
      }

      resultRows.push({
        row: index + 2,
        prompt,
        options,
        correctAnswer: correctAnswer || null,
        difficulty,
        status,
        errors: rowErrors,
      })

      if (rowErrors.length === 0) {
        validRows.push({ prompt, options, correctAnswer, difficulty, status })
        seenPrompts.add(prompt.toLowerCase())
      } else {
        errors.push(`Row ${index + 2}: ${rowErrors.join('; ')}`)
      }
    })

    if (validRows.length) {
      const createInputs: Prisma.QuestionCreateInput[] = validRows.map((row) => ({
        prompt: row.prompt,
        questionBank: { connect: { id: input.questionBankId } },
        options: row.options as Prisma.InputJsonValue,
        correctOptionIndex: row.options.findIndex((option) => option.toLowerCase() === row.correctAnswer?.toLowerCase()),
        difficulty: row.difficulty as $Enums.Difficulty,
        status: row.status as $Enums.Status,
        explanation: null,
        metadata: { tags: [], timeEstimateMinutes: 3 } as Prisma.InputJsonValue,
      }))

      await questionRepository.createManyInTransaction?.(createInputs)
    }

    return {
      summary: {
        successCount: validRows.length,
        failureCount: resultRows.length - validRows.length,
        validationErrors: errors,
      },
      rows: resultRows,
    }
  }
}

export const questionImportService = new QuestionImportService()
