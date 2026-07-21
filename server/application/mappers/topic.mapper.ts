import type { TopicWithModuleEntity } from '../../infrastructure/entities/topic.entity'
import type { TopicDTO } from '../dto/topic.dto'

export function mapTopicEntityToDTO(topic: TopicWithModuleEntity): TopicDTO {
  return {
    id: topic.id,
    moduleId: topic.moduleId,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    estimatedMinutes: topic.durationMinutes,
    difficulty: topic.module?.difficulty ?? 'BEGINNER',
  }
}
