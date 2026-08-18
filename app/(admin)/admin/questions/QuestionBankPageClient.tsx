'use client'

import { useState } from 'react'
import QuestionBankDirectoryPanel from '@/components/admin/questions/QuestionBankDirectoryPanel'
import QuestionBankPanel from '@/components/admin/questions/QuestionBankPanel'
import type { QuestionManagementStatus } from '@/server/services/question.service'
import type { QuestionBankManagementDTO } from '@/server/application/dto/question-bank.dto'

type Props = {
  initialQuestions: Array<any & { status: QuestionManagementStatus; metadata: { tags: string[]; timeEstimateMinutes: number }; createdAt: string }>
  initialQuestionsTotal: number
  questionBanksForSelect: Array<{ id: string; title: string }>
  initialQuestionBanks: QuestionBankManagementDTO[]
  initialQuestionBanksTotal: number
}

export default function QuestionBankPageClient({
  initialQuestions,
  initialQuestionsTotal,
  questionBanksForSelect,
  initialQuestionBanks,
  initialQuestionBanksTotal,
}: Props) {
  const [activeTab, setActiveTab] = useState<'questions' | 'banks'>('questions')

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'questions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('banks')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'banks'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Question Banks
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'questions' && (
        <QuestionBankDirectoryPanel
          initialQuestions={initialQuestions}
          initialTotal={initialQuestionsTotal}
          questionBanks={questionBanksForSelect}
        />
      )}

      {activeTab === 'banks' && (
        <QuestionBankPanel
          initialQuestionBanks={initialQuestionBanks}
          initialTotal={initialQuestionBanksTotal}
        />
      )}
    </div>
  )
}
