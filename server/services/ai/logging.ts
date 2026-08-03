import { logger } from '@/lib/logger'

export interface AIEventLog {
  event: string;
  userId?: string;
  conversationId?: string;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export function logAIEvent(entry: AIEventLog) {
  if (process.env.NODE_ENV === 'test') return
  logger.info('ai.event', {
    service: 'AIService',
    operation: entry.event,
    userId: entry.userId,
    conversationId: entry.conversationId,
    status: entry.status,
    metadata: entry.metadata,
  })
}
