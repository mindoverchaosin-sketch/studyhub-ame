import type { Lesson, Module } from '@prisma/client'

export type TopicEntity = Lesson
export type TopicWithModuleEntity = Lesson & {
  module: Module | null
}
