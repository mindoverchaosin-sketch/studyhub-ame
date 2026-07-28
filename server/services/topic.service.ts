import { topicRepository } from '@/server/repositories/topic.repository'
import type { TopicDTO } from '@/server/application/dto/topic.dto'
import { mapTopicEntityToDTO } from '@/server/application/mappers/topic.mapper'
import { NotFoundError } from '@/auth'

/**
 * TopicService
 * Handles topic-related database operations
 */

export async function getTopicsBySection(sectionId: string): Promise<TopicDTO[]> {
  return (await topicRepository.findBySection(sectionId)).map(mapTopicEntityToDTO)
}

export async function getTopicBySlug(slug: string): Promise<TopicDTO | null> {
  const topic = await topicRepository.findBySlug(slug)
  return topic ? mapTopicEntityToDTO(topic) : null
}

export async function getTopicById(id: string): Promise<TopicDTO | null> {
  const topic = await topicRepository.findById(id)
  return topic ? mapTopicEntityToDTO(topic) : null
}

export async function getTopicCount(): Promise<number> {
  return topicRepository.countAll()
}

export async function getTopicWithResources(id: string): Promise<TopicDTO> {
  const topic = await topicRepository.findById(id)
  if (!topic) {
    throw new NotFoundError(`Topic not found: ${id}`)
  }
  return mapTopicEntityToDTO(topic)
}

export async function getTopicWithQuestions(id: string): Promise<TopicDTO> {
  const topic = await topicRepository.findById(id)
  if (!topic) {
    throw new NotFoundError(`Topic not found: ${id}`)
  }
  return mapTopicEntityToDTO(topic)
}
