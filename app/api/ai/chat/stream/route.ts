import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse, ValidationError } from '@/server/services/ai/ai-error';
import { aiChatPayloadSchema } from '@/server/validators/ai.validator';
import { logAIEvent } from '@/server/services/ai/logging';
import { withRequestLogging } from '@/lib/request-logger';
import { aiRateLimiter, getAIRateLimitIdentity } from '@/server/services/ai/rate-limit.service';

async function streamToResponse(stream: AsyncGenerator<unknown>) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async pull(controller) {
      const { value, done } = await stream.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
  });
  return new Response(readable, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(request: Request) {
  return withRequestLogging(request, 'ai.chat.stream', async () => {
    try {
      const session = await requireStudent();
      const payload = await request.json();
      const parseResult = aiChatPayloadSchema.safeParse(payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid AI chat stream request.');
      }

      aiRateLimiter.enforce('chat-stream', getAIRateLimitIdentity(session.user.id, request));

      const abortSignal = request.signal;
      const stream = aiService.streamChat(parseResult.data, session.user.id as string, { timeoutMs: 30000, signal: abortSignal });
      logAIEvent({ event: 'ai.chat.stream', userId: session.user.id, status: 'success', metadata: { conversationId: parseResult.data.conversationId } });
      return streamToResponse(stream);
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      logAIEvent({ event: 'ai.chat.stream', status: 'error', metadata: { error: errorResponse.error } });
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
  }, { userId: undefined })
}
