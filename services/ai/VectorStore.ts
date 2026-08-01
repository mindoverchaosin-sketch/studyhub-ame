import type { AIContentSourceType } from '@/types/ai';

export interface VectorStore {
  insert(document: VectorDocument): Promise<void>;
  update(document: VectorDocument): Promise<void>;
  delete(chunkId: string): Promise<void>;
  search(embedding: number[], topK: number): Promise<VectorSearchResult[]>;
}

export interface VectorIndexOptions {
  name?: string;
  dimensions?: number;
  distanceMetric?: 'cosine' | 'dot' | 'euclidean';
}

export interface VectorDocument {
  chunkId: string;
  sourceId: string;
  sourceType: AIContentSourceType;
  lessonId?: string;
  moduleId?: string;
  title: string;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface VectorSearchResult {
  document: VectorDocument;
  similarity: number;
}
