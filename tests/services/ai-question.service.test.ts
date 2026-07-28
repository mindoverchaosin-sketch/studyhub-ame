import { describe, expect, it } from 'vitest'

describe('ai-question.service', () => {
  it('generates and reviews AI question suggestions', async () => {
    const { generateAiQuestion, reviewAiQuestion, bulkAnalyzeAiQuestions } = await import('../../server/services/ai-question.service')

    const generated = await generateAiQuestion({ lessonContent: 'Hydraulic pressure is essential for aircraft systems.', questionBankId: 'bank-1' })
    const reviewed = await reviewAiQuestion({ prompt: 'What is hydraulic pressure?', options: ['A', 'B', 'C', 'D'], explanation: 'It is fluid pressure in a system.' })
    const bulk = await bulkAnalyzeAiQuestions([{ prompt: 'How does hydraulics work?', options: ['A', 'B', 'C', 'D'] }])

    expect(generated.requiresApproval).toBe(true)
    expect(generated.tags).toContain('ai-generated')
    expect(reviewed.review.missingExplanation).toBe(false)
    expect(bulk[0].review.grammarIssues).toEqual([])
  })
})
