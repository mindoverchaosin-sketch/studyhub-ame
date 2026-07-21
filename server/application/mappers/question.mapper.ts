import type { QuestionEntity } from '../../infrastructure/entities/question.entity'
import type { OptionDTO, QuestionDTO } from '../dto/question.dto'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isOptionObject(value: unknown): value is { text: unknown } {
  return typeof value === 'object' && value !== null && 'text' in value && typeof (value as { text: unknown }).text === 'string'
}

function parseOptions(value: unknown): OptionDTO[] {
  if (isStringArray(value)) {
    return value.map((text, index) => ({ id: String(index), text }))
  }

  if (Array.isArray(value)) {
    return value
      .filter(isOptionObject)
      .map((option, index) => ({ id: String(index), text: option.text as string }))
  }

  return []
}

function mapCorrectAnswer(options: OptionDTO[], correctOptionIndex: number | null): string | null {
  if (correctOptionIndex === null) {
    return null
  }

  return options[correctOptionIndex]?.text ?? null
}

function getOptionValue(options: OptionDTO[], index: number): string {
  return options[index]?.text ?? ''
}

export function mapQuestionEntityToDTO(question: QuestionEntity): QuestionDTO {
  const options = parseOptions(question.options)

  return {
    id: question.id,
    question: question.prompt,
    options,
    optionA: getOptionValue(options, 0),
    optionB: getOptionValue(options, 1),
    optionC: getOptionValue(options, 2),
    optionD: getOptionValue(options, 3),
    correctAnswer: mapCorrectAnswer(options, question.correctOptionIndex),
    explanation: question.explanation ?? null,
    difficulty: question.difficulty,
    questionBankId: question.questionBankId,
  }
}
