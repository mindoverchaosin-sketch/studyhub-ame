export type QuestionBankStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW'

export type QuestionBankReferenceDTO = {
  id: string
  title: string
  description: string | null
}

export type QuestionBankDTO = QuestionBankReferenceDTO & {
  status: QuestionBankStatus
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export type QuestionBankManagementDTO = QuestionBankDTO & {
  questionCount?: number
}

export type QuestionBankCreateInput = {
  title: string
  description?: string | null
  isPremium?: boolean
}

export type QuestionBankUpdateInput = Partial<Omit<QuestionBankCreateInput, 'title'>> & {
  title?: string
}
