import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import prisma from '@/lib/prisma';
import { AIConversationRepository } from '@/server/repositories/ai-conversation.repository';

vi.mock('@/lib/prisma', () => ({
  default: {
    aIConversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    aIMessage: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('AIConversationRepository', () => {
  const repository = new AIConversationRepository();
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a conversation', async () => {
    mockPrisma.aIConversation.create.mockResolvedValue({ id: 'conv-1', title: 'Tutor session', createdAt: new Date(), updatedAt: new Date(), messages: [] });
    const conversation = await repository.createConversation('Tutor session', 'user-1');
    expect(mockPrisma.aIConversation.create).toHaveBeenCalled();
    expect(conversation.id).toBe('conv-1');
  });

  it('finds a conversation', async () => {
    mockPrisma.aIConversation.findUnique.mockResolvedValue({ id: 'conv-1', title: 'Test', createdAt: new Date(), updatedAt: new Date(), messages: [] });
    const conversation = await repository.findConversation('conv-1');
    expect(mockPrisma.aIConversation.findUnique).toHaveBeenCalledWith({ where: { id: 'conv-1' }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    expect(conversation?.id).toBe('conv-1');
  });

  it('deletes a conversation', async () => {
    mockPrisma.aIConversation.deleteMany.mockResolvedValue({ count: 1 });
    const result = await repository.deleteConversation('conv-1');
    expect(mockPrisma.aIConversation.deleteMany).toHaveBeenCalledWith({ where: { id: 'conv-1' } });
    expect(result).toBe(true);
  });
});
