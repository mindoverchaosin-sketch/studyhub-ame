import type { AIConversation } from '@/types/ai';

export interface ConversationDTO {
  id: string;
  title: string;
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

/**
 * Conversation service.
 *
 * Persistence strategy:
 * - When a repository is available (production lazily loads the Prisma-backed
 *   repository; tests may inject one), every operation is delegated to the
 *   repository so conversations are durably stored with their owning user.
 * - When no repository is available (unit-test environment), an in-memory Map
 *   is used as a fallback so tests remain hermetic.
 *
 * Ownership:
 * - Every read/write method accepts an optional `userId`. When supplied, the
 *   operation only affects conversations owned by that user; otherwise it
 *   resolves to null/false instead of leaking or mutating another user's data.
 */
export class ConversationService {
  private static conversations = new Map<string, AIConversation>();
  private repository: any;

  constructor(repository?: any) {
    if (repository) {
      this.repository = repository;
      return;
    }

    // In test environment we avoid loading the real repository so tests
    // exercising the in-memory behaviour remain stable. In non-test
    // environments we lazy-load the repo so conversations persist durably.
    if (process.env.NODE_ENV === 'test') {
      this.repository = undefined;
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const repo = require('@/server/repositories/ai-conversation.repository');
      this.repository = repo.aiConversationRepository;
    } catch {
      this.repository = undefined;
    }
  }

  createConversation(title = 'New tutor conversation', userId?: string): AIConversation | Promise<AIConversation> {
    if (this.repository) {
      return this.repository.createConversation(title, userId);
    }

    const conversation: AIConversation = {
      id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...(userId ? { userId } : {}),
    };

    ConversationService.conversations.set(conversation.id, conversation);
    return conversation;
  }

  getConversation(conversationId: string, userId?: string): AIConversation | null | Promise<AIConversation | null> {
    if (this.repository) {
      if (userId) {
        return this.repository.findConversationForUser(conversationId, userId);
      }
      return this.repository.findConversation(conversationId);
    }

    const conversation = ConversationService.conversations.get(conversationId) ?? null;
    if (!conversation || !this.isOwnedBy(conversation, userId)) {
      return null;
    }
    return conversation;
  }

  listConversations(userId?: string): ConversationDTO[] | Promise<ConversationDTO[]> {
    if (this.repository) {
      return this.repository.listConversations({ userId }).then((conversations: AIConversation[]) =>
        conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          lastUpdated: conversation.lastUpdated,
          messageCount: conversation.messages.length,
        })),
      );
    }

    return Array.from(ConversationService.conversations.values())
      .filter((conversation) => this.isOwnedBy(conversation, userId))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        lastUpdated: conversation.lastUpdated,
        messageCount: conversation.messages.length,
      }));
  }

  async addMessage(conversationId: string, message: AIConversation['messages'][number], userId?: string): Promise<AIConversation | null> {
    if (this.repository) {
      if (userId && !(await this.repository.ownsConversation(conversationId, userId))) {
        return null;
      }
      return this.repository.addMessage(conversationId, message);
    }

    const conversation = ConversationService.conversations.get(conversationId);
    if (!conversation || !this.isOwnedBy(conversation, userId)) {
      return null;
    }

    conversation.messages = [...conversation.messages, message];
    conversation.lastUpdated = new Date().toISOString();
    ConversationService.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async renameConversation(conversationId: string, title: string, userId?: string): Promise<AIConversation | null> {
    if (this.repository) {
      if (userId && !(await this.repository.ownsConversation(conversationId, userId))) {
        return null;
      }
      return this.repository.renameConversation(conversationId, title);
    }

    const conversation = ConversationService.conversations.get(conversationId);
    if (!conversation || !this.isOwnedBy(conversation, userId)) {
      return null;
    }

    conversation.title = title;
    conversation.lastUpdated = new Date().toISOString();
    ConversationService.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async deleteConversation(conversationId: string, userId?: string): Promise<boolean> {
    if (this.repository) {
      if (userId && !(await this.repository.ownsConversation(conversationId, userId))) {
        return false;
      }
      return this.repository.deleteConversation(conversationId);
    }

    const conversation = ConversationService.conversations.get(conversationId);
    if (!conversation || !this.isOwnedBy(conversation, userId)) {
      return false;
    }
    return ConversationService.conversations.delete(conversationId);
  }

  private isOwnedBy(conversation: AIConversation, userId?: string): boolean {
    if (!userId) {
      return true;
    }
    return conversation.userId === userId;
  }
}

export const conversationService = new ConversationService();
