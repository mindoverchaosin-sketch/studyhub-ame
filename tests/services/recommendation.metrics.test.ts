import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service'
import { MasteryService } from '@/server/services/learning/mastery.service'
import { StudyPlannerService } from '@/server/services/learning/study-planner.service'
import { ReadinessService } from '@/server/services/learning/readiness.service'
import { RecommendationService } from '@/server/services/learning/recommendation.service'
import { metricsService } from '@/server/services/metrics.service'

describe('Recommendation metrics', () => {
  beforeEach(() => {
    metricsService.reset()
    vi.restoreAllMocks()
  })

  async function setupGraph(kg: KnowledgeGraphService) {
    await kg.upsertNode({ id: 'topic1', type: 'topic', title: 'Algebra' })
    await kg.upsertNode({ id: 'topic2', type: 'topic', title: 'Geometry' })
    await kg.upsertNode({ id: 'lesson1', type: 'lesson', title: 'Linear equations' })
    await kg.upsertNode({ id: 'lesson2', type: 'lesson', title: 'Triangles' })
    await kg.upsertEdge({ id: 'edge1', sourceId: 'topic1', targetId: 'lesson1', relation: 'parent' })
    await kg.upsertEdge({ id: 'edge2', sourceId: 'topic2', targetId: 'lesson2', relation: 'parent' })
    await kg.upsertEdge({ id: 'edge3', sourceId: 'topic1', targetId: 'topic2', relation: 'prerequisite' })
  }

  it('records metrics for successful recommendation generation', async () => {
    const kg = new KnowledgeGraphService()
    await setupGraph(kg)
    const mastery = new MasteryService(undefined, kg)
    const planner = new StudyPlannerService(undefined, kg, mastery)
    const readiness = new ReadinessService(undefined, kg, mastery, planner)
    const service = new RecommendationService(undefined, kg, mastery, planner, readiness)

    await kg.recordStudentSignal('studentMetrics', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 })
    await kg.recordStudentSignal('studentMetrics', 'lesson2', { kind: 'mockPerformance', score: 45, maxScore: 100, timestamp: Date.now() - 1000 })

    const recommendations = await service.getRecommendations('studentMetrics', { currentDate: '2026-08-02', examDate: '2026-09-01' })

    const snapshot = metricsService.getSnapshot()

    expect(recommendations.length).toBeGreaterThan(0)
    expect(snapshot.services.executions).toBeGreaterThanOrEqual(1)
    expect(snapshot.services.averageDurationMs).toBeGreaterThanOrEqual(0)
  })

  it('records metrics when recommendation generation fails', async () => {
    const kg = new KnowledgeGraphService()
    await setupGraph(kg)
    const failingMastery = {
      createRequestContext: vi.fn().mockRejectedValue(new Error('mastery failure')),
    } as unknown as MasteryService
    const planner = new StudyPlannerService(undefined, kg, failingMastery)
    const readiness = new ReadinessService(undefined, kg, failingMastery, planner)
    const service = new RecommendationService(undefined, kg, failingMastery, planner, readiness)

    await expect(service.getRecommendations('studentFail', { currentDate: '2026-08-02', examDate: '2026-09-01' })).rejects.toThrow('mastery failure')

    const snapshot = metricsService.getSnapshot()
    expect(snapshot.services.executions).toBeGreaterThanOrEqual(1)
    expect(snapshot.services.averageDurationMs).toBeGreaterThanOrEqual(0)
  })
})
