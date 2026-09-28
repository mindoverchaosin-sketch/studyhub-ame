import { describe, it, expect } from 'vitest'
import { mapTopicEntityToDTO } from '../../server/application/mappers/topic.mapper'
import type { TopicWithModuleEntity } from '../../server/infrastructure/entities/topic.entity'

describe('mapTopicEntityToDTO', () => {
  it('maps basic topic entity to DTO with defaults', () => {
    const entity: TopicWithModuleEntity = {
      id: 't1',
      moduleId: 'm1',
      slug: 'topic-1',
      title: 'Topic 1',
      description: 'Desc',
      durationMinutes: 15,
      displayOrder: 0,
      status: 'DRAFT',
      publishedAt: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      module: null,
    }

    const dto = mapTopicEntityToDTO(entity)

    expect(dto.id).toBe('t1')
    expect(dto.estimatedMinutes).toBe(15)
    expect(dto.difficulty).toBe('BEGINNER')
  })
})
