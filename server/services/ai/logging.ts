export interface AIEventLog {
  event: string;
  userId?: string;
  conversationId?: string;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export function logAIEvent(entry: AIEventLog) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Placeholder hook for structured logging integration.
  console.info('[ai-service]', JSON.stringify(entry));
}
