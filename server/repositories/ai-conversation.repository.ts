import prisma from '@/lib/prisma';
import type { AIConversation, AIMessage } from '@/types/ai';
import type { Prisma } from '@prisma/client';

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

  async listConversations(params: ConversationQueryParams = {}): Promise<AIConversation[]> {
    const where: any = {};
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

  private mapConversation(conversation: any, messages: any[]): AIConversation {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      lastUpdated: conversation.updatedAt.toISOString(),
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        finishReason: message.finishReason ?? undefined,
        usage: message.usage ?? undefined,
        model: message.model ?? undefined,
        metadata: message.metadata ?? undefined,
      })),
    };
  }
}

export const aiConversationRepository = new AIConversationRepository();
