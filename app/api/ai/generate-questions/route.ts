import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse, ValidationError } from '@/server/services/ai/ai-error';
import { aiGenerateQuestionsPayloadSchema } from '@/server/validators/ai.validator';
import { logAIEvent } from '@/server/services/ai/logging';
import { withRequestLogging } from '@/lib/request-logger';

export async function POST(request: Request) {
  return withRequestLogging(request, 'ai.generate-questions', async () => {
    try {
      const session = await requireStudent();
      const payload = await request.json();
      const parseResult = aiGenerateQuestionsPayloadSchema.safeParse(payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid AI generate questions request.');
      }

      const response = await aiService.handleGenerateQuestions(parseResult.data.topic);

      logAIEvent({ event: 'ai.generate-questions', userId: session.user.id, status: 'success' });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      logAIEvent({ event: 'ai.generate-questions', status: 'error', metadata: { error: errorResponse.error } });
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
  }, { userId: undefined })
}
