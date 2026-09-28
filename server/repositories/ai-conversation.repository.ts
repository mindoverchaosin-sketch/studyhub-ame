import prisma from '@/lib/prisma';
import type { AIConversation, AIMessage } from '@/types/ai';
import type { Prisma } from '@prisma/client';

type ConversationRow = Prisma.AIConversationGetPayload<null>;
type ConversationWithMessagesRow = Prisma.AIConversationGetPayload<{ include: { messages: true } }>;
type MessageRow = Prisma.AIMessageGetPayload<null>;

function toJsonRecord(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined;
}

function toAIUsage(value: Prisma.JsonValue | null): AIMessage['usage'] {
  const usage = toJsonRecord(value);
  if (!usage) return undefined;
  return {
    ...(typeof usage.promptTokens === 'number' ? { promptTokens: usage.promptTokens } : {}),
    ...(typeof usage.completionTokens === 'number' ? { completionTokens: usage.completionTokens } : {}),
    ...(typeof usage.totalTokens === 'number' ? { totalTokens: usage.totalTokens } : {}),
  };
}

function toAIMessageRole(role: string): AIMessage['role'] {
  return role === 'assistant' || role === 'system' ? role : 'user';
}

export interface ConversationQueryParams {
  userId?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export class AIConversationRepository {
  async createConversation(title: string, userId?: string): Promise<AIConversation> {
    const conversation = await prisma.aIConversation.create({
      data: {
        title,
        userId,
      },
    });

    return this.mapConversation(conversation, []);
  }

  async findConversation(id: string): Promise<AIConversation | null> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return conversation ? this.mapConversation(conversation, conversation.messages) : null;
  }

  async findConversationForUser(id: string, userId: string): Promise<AIConversation | null> {
    if (!id || !userId) {
      return null;
    }
    const conversation = await prisma.aIConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return conversation ? this.mapConversation(conversation, conversation.messages) : null;
  }

  async ownsConversation(id: string, userId: string): Promise<boolean> {
    if (!id || !userId) {
      return false;
    }
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
      select: { userId: true },
    });
    return conversation?.userId === userId;
  }

  async listConversations(params: ConversationQueryParams = {}): Promise<AIConversation[]> {
    const where: Prisma.AIConversationWhereInput = {};
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }

    const conversations = await prisma.aIConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return conversations.map((conversation) => this.mapConversation(conversation, conversation.messages));
  }

  async addMessage(conversationId: string, message: AIMessage): Promise<AIConversation | null> {
    const conversation = await prisma.aIConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) {
      return null;
    }

    await prisma.$transaction([
      prisma.aIMessage.create({
        data: {
          id: message.id,
          conversationId,
          role: message.role,
          content: message.content,
          createdAt: new Date(message.createdAt),
          finishReason: message.finishReason,
          usage: message.usage ? (message.usage as unknown as Prisma.InputJsonValue) : undefined,
          model: message.model,
          metadata: message.metadata ? (message.metadata as unknown as Prisma.InputJsonValue) : undefined,
        },
      }),
      prisma.aIConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return this.findConversation(conversationId);
  }

  async renameConversation(conversationId: string, title: string): Promise<AIConversation | null> {
    const conversation = await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title, updatedAt: new Date() },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return this.mapConversation(conversation, conversation.messages);
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    await prisma.aIConversation.deleteMany({ where: { id: conversationId } });
    return true;
  }

  private mapConversation(conversation: ConversationRow | ConversationWithMessagesRow, messages: MessageRow[]): AIConversation {
    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId ?? undefined,
      createdAt: conversation.createdAt.toISOString(),
      lastUpdated: conversation.updatedAt.toISOString(),
      messages: messages.map((message) => ({
        id: message.id,
        role: toAIMessageRole(message.role),
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        finishReason: message.finishReason ?? undefined,
        usage: toAIUsage(message.usage),
        model: message.model ?? undefined,
        metadata: toJsonRecord(message.metadata),
      })),
    };
  }
}

export const aiConversationRepository = new AIConversationRepository();
