import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse } from '@/server/services/ai/ai-error';
import { logAIEvent } from '@/server/services/ai/logging';

export async function GET() {
  try {
    const session = await requireStudent();
    const response = await aiService.handleRecommendations(session.user.id as string);

    logAIEvent({ event: 'ai.recommendations', userId: session.user.id, status: 'success' });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse = toErrorResponse(error);
    logAIEvent({ event: 'ai.recommendations', status: 'error', metadata: { error: errorResponse.error } });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
