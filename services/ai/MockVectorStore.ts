import type { VectorDocument, VectorSearchResult, VectorStore } from '@/services/ai/VectorStore';

function cosineSimilarity(a: number[], b: number[]): number {
  const minLength = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < minLength; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export class MockVectorStore implements VectorStore {
  private documents = new Map<string, VectorDocument>();

  async insert(document: VectorDocument): Promise<void> {
    this.documents.set(document.chunkId, document);
  }

  async update(document: VectorDocument): Promise<void> {
    this.documents.set(document.chunkId, document);
  }

  async delete(chunkId: string): Promise<void> {
    this.documents.delete(chunkId);
  }

  async search(embedding: number[], topK: number): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const document of this.documents.values()) {
      const similarity = cosineSimilarity(document.embedding, embedding);
      if (similarity > 0) {
        results.push({ document, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
