import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse, ValidationError } from '@/server/services/ai/ai-error';
import { aiChatPayloadSchema } from '@/server/validators/ai.validator';
import { logAIEvent } from '@/server/services/ai/logging';
import { withRequestLogging } from '@/lib/request-logger';
import { aiRateLimiter, getAIRateLimitIdentity } from '@/server/services/ai/rate-limit.service';

export async function POST(request: Request) {
  return withRequestLogging(request, 'ai.chat', async () => {
    try {
      const session = await requireStudent();
      const payload = await request.json();
      const parseResult = aiChatPayloadSchema.safeParse(payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid AI chat request.');
      }

      aiRateLimiter.enforce('chat', getAIRateLimitIdentity(session.user.id, request));

      const response = await aiService.handleChat(parseResult.data, session.user.id as string);

      logAIEvent({ event: 'ai.chat', userId: session.user.id, status: 'success', metadata: { conversationId: response.conversationId } });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      logAIEvent({ event: 'ai.chat', status: 'error', metadata: { error: errorResponse.error } });
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
  }, { userId: undefined })
}
