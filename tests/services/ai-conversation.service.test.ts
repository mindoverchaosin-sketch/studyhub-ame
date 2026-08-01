import { describe, expect, it, vi } from 'vitest';
import { ConversationService } from '@/server/services/ai/conversation.service';
import type { AIMessage, AIConversation } from '@/types/ai';

const fakeMessage: AIMessage = {
  id: 'msg-1',
  role: 'assistant',
  content: 'Hello',
  createdAt: new Date().toISOString(),
};

class MockRepository {
  createConversation = vi.fn(async (title: string, userId?: string) => ({
    id: 'conv-1',
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }));
  findConversation = vi.fn(async (id: string) => ({
    id,
    title: 'Test',
    messages: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }));
  listConversations = vi.fn(async () => []);
  addMessage = vi.fn(async () => ({
    id: 'conv-1',
    title: 'Test',
    messages: [fakeMessage],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }));
  renameConversation = vi.fn(async (conversationId: string, title: string) => ({
    id: conversationId,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }));
  deleteConversation = vi.fn(async () => true);
}

describe('ConversationService', () => {
  const repository = new MockRepository();
  const service = new ConversationService(repository as never);

  it('creates a conversation with user ownership', async () => {
    const conversation = await service.createConversation('Tutor session', 'user-1');
    expect(repository.createConversation).toHaveBeenCalledWith('Tutor session', 'user-1');
    expect(conversation.title).toBe('Tutor session');
  });

  it('retrieves a conversation by id', async () => {
    const conversation = await service.getConversation('conv-1');
    expect(repository.findConversation).toHaveBeenCalledWith('conv-1');
    expect(conversation?.id).toBe('conv-1');
  });

  it('appends messages to a conversation', async () => {
    const conversation = await service.addMessage('conv-1', fakeMessage);
    expect(repository.addMessage).toHaveBeenCalledWith('conv-1', fakeMessage);
    expect(conversation?.messages).toHaveLength(1);
  });

  it('renames a conversation', async () => {
    const updated = await service.renameConversation('conv-1', 'New title');
    expect(repository.renameConversation).toHaveBeenCalledWith('conv-1', 'New title');
    expect(updated?.title).toBe('New title');
  });

  it('deletes a conversation', async () => {
    const result = await service.deleteConversation('conv-1');
    expect(repository.deleteConversation).toHaveBeenCalledWith('conv-1');
    expect(result).toBe(true);
  });
});
