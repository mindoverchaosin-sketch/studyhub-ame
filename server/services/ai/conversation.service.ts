import type { AIConversation } from '@/types/ai';

export interface ConversationDTO {
  id: string;
  title: string;
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

export class ConversationService {
  private static conversations = new Map<string, AIConversation>();
  private repository: any;
  private useProvidedRepository = false;

  constructor(repository?: any) {
    if (repository) {
      this.repository = repository;
      this.useProvidedRepository = true;
      return;
    }

    // In test environment we avoid loading the real repository so tests
    // exercising the in-memory sync behaviour remain stable. In non-test
    // environments we lazy-load the repo to enable background persistence.
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
    // If a repository was explicitly provided (tests), delegate to it.
    if (this.repository && this.useProvidedRepository) {
      return this.repository.createConversation(title, userId);
    }

    const conversation: AIConversation = {
      id: `conversation-${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    ConversationService.conversations.set(conversation.id, conversation);

    // Fire-and-forget persistence when repository is available (production)
    try {
      this.repository?.createConversation?.(title, userId)?.catch(() => {});
    } catch {
      // ignore persistence errors for now
    }

    return conversation;
  }

  getConversation(conversationId: string): AIConversation | null | Promise<AIConversation | null> {
    if (this.repository && this.useProvidedRepository) {
      return this.repository.findConversation(conversationId);
    }
    return ConversationService.conversations.get(conversationId) ?? null;
  }

  listConversations(): ConversationDTO[] {
    return Array.from(ConversationService.conversations.values())
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        lastUpdated: conversation.lastUpdated,
        messageCount: conversation.messages.length,
      }));
  }

  addMessage(conversationId: string, message: AIConversation['messages'][number]): AIConversation | null | Promise<AIConversation | null> {
    if (this.repository && this.useProvidedRepository) {
      return this.repository.addMessage(conversationId, message);
    }

    const conversation = ConversationService.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    conversation.messages = [...conversation.messages, message];
    conversation.lastUpdated = new Date().toISOString();
    ConversationService.conversations.set(conversation.id, conversation);

    // Persist in background
    try {
      this.repository?.addMessage?.(conversationId, message)?.catch(() => {});
    } catch {
      // ignore
    }

    return conversation;
  }

  renameConversation(conversationId: string, title: string): AIConversation | null | Promise<AIConversation | null> {
    if (this.repository && this.useProvidedRepository) {
      return this.repository.renameConversation(conversationId, title);
    }

    const conversation = ConversationService.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    conversation.title = title;
    conversation.lastUpdated = new Date().toISOString();
    ConversationService.conversations.set(conversation.id, conversation);

    try {
      this.repository?.renameConversation?.(conversationId, title)?.catch(() => {});
    } catch {}

    return conversation;
  }

  deleteConversation(conversationId: string): boolean | Promise<boolean> {
    if (this.repository && this.useProvidedRepository) {
      return this.repository.deleteConversation(conversationId);
    }
    try {
      this.repository?.deleteConversation?.(conversationId)?.catch(() => {});
    } catch {}
    return ConversationService.conversations.delete(conversationId);
  }
}

export const conversationService = new ConversationService();
