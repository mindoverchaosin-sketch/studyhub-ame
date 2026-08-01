export interface RetrievedCitation {
  sourceType: 'lesson' | 'module' | 'question' | 'mockTest';
  sourceId: string;
  title: string;
  chunkId: string;
  relevanceScore: number;
}

export interface RetrievalCandidate {
  chunk: AIContentChunk;
  keywordScore?: number;
  semanticScore?: number;
  metadataScore?: number;
  recencyScore?: number;
  lessonPriority?: number;
  moduleRelevance?: number;
  rankingScore?: number;
  citation: RetrievedCitation;
}

export interface RankedRetrievalResult extends RetrievalCandidate {}
