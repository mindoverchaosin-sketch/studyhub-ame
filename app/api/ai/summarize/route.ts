import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse, ValidationError } from '@/server/services/ai/ai-error';
import { aiSummarizePayloadSchema } from '@/server/validators/ai.validator';
import { logAIEvent } from '@/server/services/ai/logging';
import { withRequestLogging } from '@/lib/request-logger';
import { aiRateLimiter, getAIRateLimitIdentity } from '@/server/services/ai/rate-limit.service';

export async function POST(request: Request) {
  return withRequestLogging(request, 'ai.summarize', async () => {
    try {
      const session = await requireStudent();
      const payload = await request.json();
      const parseResult = aiSummarizePayloadSchema.safeParse(payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid AI summarize request.');
      }

      aiRateLimiter.enforce('summarize', getAIRateLimitIdentity(session.user.id, request));

      const response = await aiService.handleSummarize(parseResult.data.prompt);

      logAIEvent({ event: 'ai.summarize', userId: session.user.id, status: 'success' });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      logAIEvent({ event: 'ai.summarize', status: 'error', metadata: { error: errorResponse.error } });
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
  }, { userId: undefined })
}
