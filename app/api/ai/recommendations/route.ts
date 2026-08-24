import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse } from '@/server/services/ai/ai-error';
import { logAIEvent } from '@/server/services/ai/logging';
import { withRequestLogging } from '@/lib/request-logger';
import { aiRateLimiter, getAIRateLimitIdentity } from '@/server/services/ai/rate-limit.service';

export async function GET(request: Request) {
  return withRequestLogging(request, 'ai.recommendations', async () => {
    try {
      const session = await requireStudent();

      aiRateLimiter.enforce('recommendations', getAIRateLimitIdentity(session.user.id, request));

      const response = await aiService.handleRecommendations(session.user.id as string);

      logAIEvent({ event: 'ai.recommendations', userId: session.user.id, status: 'success' });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      logAIEvent({ event: 'ai.recommendations', status: 'error', metadata: { error: errorResponse.error } });
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
  }, { userId: undefined })
}
