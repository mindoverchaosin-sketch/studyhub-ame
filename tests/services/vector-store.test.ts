import { describe, expect, it } from 'vitest';
import { MockVectorStore } from '@/services/ai/MockVectorStore';

describe('MockVectorStore', () => {
  it('stores and retrieves vector documents by similarity', async () => {
    const store = new MockVectorStore();
    await store.insert({
      chunkId: 'chunk-1',
      sourceId: 'lesson-1',
      sourceType: 'lesson',
      title: 'Lesson one',
      text: 'This is a lesson about corrosion.',
      metadata: { difficulty: 'Hard' },
      embedding: [0.1, 0.2, 0.3, 0.4],
    });

    const results = await store.search([0.1, 0.2, 0.3, 0.4], 5);
    expect(results.length).toBe(1);
    expect(results[0].document.chunkId).toBe('chunk-1');
  });

  it('removes documents when deleted', async () => {
    const store = new MockVectorStore();
    await store.insert({
      chunkId: 'chunk-2',
      sourceId: 'lesson-2',
      sourceType: 'lesson',
      title: 'Lesson two',
      text: 'Another lesson text.',
      metadata: {},
      embedding: [0.1, 0.1, 0.1, 0.1],
    });
    await store.delete('chunk-2');
    const results = await store.search([0.1, 0.1, 0.1, 0.1], 5);
    expect(results).toHaveLength(0);
  });
});
