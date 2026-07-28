import { describe, expect, it } from 'vitest'

describe('question-analytics.service', () => {
  it('returns analytics summary for admins', async () => {
    const { getQuestionAnalytics } = await import('../../server/services/question-analytics.service')
    const analytics = await getQuestionAnalytics()

    expect(analytics.mostMissed.length).toBeGreaterThan(0)
    expect(analytics.topicCoverage[0].coverage).toBeGreaterThan(0)
    expect(analytics.qualityMetrics.publishRate).toBeGreaterThan(0)
  })
})
