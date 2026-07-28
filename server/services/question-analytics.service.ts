export type QuestionAnalyticsDTO = {
  mostMissed: Array<{ id: string; prompt: string; misses: number }>
  topicCoverage: Array<{ title: string; coverage: number }>
  qualityMetrics: {
    averageDifficulty: string
    publishRate: number
  }
}

export async function getQuestionAnalytics(): Promise<QuestionAnalyticsDTO> {
  return {
    mostMissed: [
      { id: 'q1', prompt: 'Hydraulic pressure principles', misses: 12 },
      { id: 'q2', prompt: 'Electrical circuit fault isolation', misses: 8 },
    ],
    topicCoverage: [
      { title: 'Airframes', coverage: 92 },
      { title: 'Systems', coverage: 78 },
    ],
    qualityMetrics: {
      averageDifficulty: 'INTERMEDIATE',
      publishRate: 84,
    },
  }
}
