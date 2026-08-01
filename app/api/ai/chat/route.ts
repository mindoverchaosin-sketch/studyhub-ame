import { NextResponse } from 'next/server';
import { requireStudent } from '@/auth';
import { aiService } from '@/server/services/ai/ai-service';
import { toErrorResponse } from '@/server/services/ai/ai-error';
import { logAIEvent } from '@/server/services/ai/logging';

export async function POST(request: Request) {
  try {
    const session = await requireStudent();
    const payload = await request.json();
    const response = await aiService.handleChat(payload, session.user.id as string);

    logAIEvent({ event: 'ai.chat', userId: session.user.id, status: 'success', metadata: { conversationId: response.conversationId } });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse = toErrorResponse(error);
    logAIEvent({ event: 'ai.chat', status: 'error', metadata: { error: errorResponse.error } });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
