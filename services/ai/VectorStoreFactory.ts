import { MockVectorStore } from '@/services/ai/MockVectorStore';
import type { VectorStore } from '@/services/ai/VectorStore';

export function createVectorStore(): VectorStore {
  return new MockVectorStore();
}
