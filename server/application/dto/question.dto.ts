export type OptionDTO = {
  id: string
  text: string
}

export type QuestionDTO = {
  id: string
  question: string
  options: OptionDTO[]
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string | null
  explanation: string | null
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  questionBankId: string
}
