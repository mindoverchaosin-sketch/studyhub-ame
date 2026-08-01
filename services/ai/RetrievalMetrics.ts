export interface RetrievalMetrics {
  chunksSearched: number;
  chunksSelected: number;
  keywordHits: number;
  vectorHits: number;
  retrievalLatencyMs: number;
  rankingLatencyMs: number;
  totalRetrievalTimeMs: number;
}

export class RetrievalMetricsCollector {
  startTime = Date.now();
  retrievalLatencyMs = 0;
  rankingLatencyMs = 0;
  chunksSearched = 0;
  chunksSelected = 0;
  keywordHits = 0;
  vectorHits = 0;

  markRetrievalComplete() {
    this.retrievalLatencyMs = Date.now() - this.startTime;
  }

  markRankingComplete() {
    this.rankingLatencyMs = Date.now() - this.startTime - this.retrievalLatencyMs;
  }

  finish(): RetrievalMetrics {
    return {
      chunksSearched: this.chunksSearched,
      chunksSelected: this.chunksSelected,
      keywordHits: this.keywordHits,
      vectorHits: this.vectorHits,
      retrievalLatencyMs: this.retrievalLatencyMs,
      rankingLatencyMs: this.rankingLatencyMs,
      totalRetrievalTimeMs: Date.now() - this.startTime,
    };
  }
}

export const retrievalMetricsCollector = new RetrievalMetricsCollector();
