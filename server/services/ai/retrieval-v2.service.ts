import { createEmbeddingProvider } from '@/services/ai/EmbeddingProviderFactory';
import { createVectorStore } from '@/services/ai/VectorStoreFactory';
import { rankingService } from '@/services/ai/RankingService';
import { retrievalMetricsCollector } from '@/services/ai/RetrievalMetrics';
import { questionRepository } from '@/server/repositories/question.repository';
import { lessonRepository } from '@/server/repositories/lesson.repository';
import { moduleRepository } from '@/server/repositories/module.repository';
import { logger } from '@/lib/logger';
import { timeAsync, timeSync } from '@/lib/timing';
import type {
  AIRetrievalContext,
  AIContentSource,
  AIContentChunk,
  RetrievalCandidate,
} from '@/types/ai';

type QuestionRecord = {
  id: string;
  prompt?: string;
  question?: string;
  explanation?: string;
  difficulty?: string;
  createdAt?: Date | string;
};

type LessonMetadata = {
  tags?: unknown;
};

const embeddingProvider = createEmbeddingProvider();
const vectorStore = createVectorStore();

function buildMetadataScores(chunk: AIContentChunk): number {
  let score = 0;

  if (chunk.metadata?.difficulty === 'Hard') score += 0.4;
  if (chunk.metadata?.difficulty === 'Medium') score += 0.2;
  if (Array.isArray(chunk.metadata?.tags) && chunk.metadata.tags.length) score += 0.1;
  if (chunk.metadata?.contentType === 'lesson') score += 0.2;

  return Math.min(score, 1);
}

function buildRecencyScore(chunk: AIContentChunk): number {
  const updatedAt = chunk.metadata?.updatedAt ? Date.parse(String(chunk.metadata.updatedAt)) : 0;
  if (!updatedAt) return 0;
  const ageDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - Math.min(ageDays / 365, 1));
}

function buildCitation(chunk: AIContentChunk) {
  const allowed: Array<import('@/types/ai').AIContentSourceType | 'mockTest'> = ['lesson', 'module', 'question', 'note', 'mockTest'];
  const sourceType = allowed.includes(chunk.sourceType)
    ? chunk.sourceType
    : 'lesson';

  return {
    sourceType,
    sourceId: chunk.sourceId,
    title: chunk.title,
    chunkId: chunk.id,
    relevanceScore: Number(chunk.metadata?.relevance ?? 0),
  };
}

function toChunkFromSource(source: AIContentSource): AIContentChunk[] {
  const chunkId = `${source.id}-chunk-1`;
  return [
    {
      id: chunkId,
      sourceId: source.id,
      sourceType: source.type,
      title: source.title,
      text: source.excerpt,
      metadata: {
        ...source.metadata,
        lessonId: source.metadata?.lessonId,
        moduleId: source.metadata?.moduleId,
        lessonTitle: source.metadata?.lessonTitle,
        moduleTitle: source.metadata?.moduleTitle,
        contentType: source.type,
        updatedAt: source.metadata?.updatedAt,
        relevance: 0,
      },
    },
  ];
}

async function keywordSearch(query: string): Promise<RetrievalCandidate[]> {
  const results: RetrievalCandidate[] = [];

  try {
    const lessons = await lessonRepository.list({ search: query, take: 10 });
    const questions = await questionRepository.findForAdmin({ search: query, take: 10 });

    for (const lesson of lessons) {
      let moduleTitle: string | undefined = undefined;
      try {
        if (lesson.moduleId) {
          const mod = await moduleRepository.findById(lesson.moduleId);
          moduleTitle = mod?.title;
        }
      } catch {
        // ignore module lookup failures
      }

      const lessonMetadata = lesson.metadata as LessonMetadata | undefined;
      const source: AIContentSource = {
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        excerpt: lesson.description ?? '',
        metadata: {
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          lessonTitle: lesson.title,
          moduleTitle: moduleTitle,
          difficulty: lesson.status,
          tags: Array.isArray(lessonMetadata?.tags) ? lessonMetadata.tags : [],
          contentType: 'lesson',
          updatedAt: lesson.updatedAt,
        },
      };

    const chunk = toChunkFromSource(source)[0];
    results.push({
      chunk,
      keywordScore: 1,
      semanticScore: 0,
      metadataScore: buildMetadataScores(chunk),
      recencyScore: buildRecencyScore(chunk),
      lessonPriority: 0.5,
      moduleRelevance: 0.2,
      citation: buildCitation(chunk),
    });
  }

    questions.forEach((question) => {
      const questionRecord = question as unknown as QuestionRecord;
      const source: AIContentSource = {
      id: questionRecord.id,
      type: 'question',
      title: questionRecord.prompt ?? questionRecord.question ?? 'Question',
      excerpt: questionRecord.explanation ?? questionRecord.prompt ?? questionRecord.question ?? '',
      metadata: {
        lessonId: undefined,
        moduleId: undefined,
        lessonTitle: undefined,
        moduleTitle: undefined,
        difficulty: questionRecord.difficulty,
        tags: [],
        contentType: 'question',
        updatedAt: questionRecord.createdAt,
      },
    };

      const chunk = toChunkFromSource(source)[0];
      results.push({
        chunk,
        keywordScore: 1,
        semanticScore: 0,
        metadataScore: buildMetadataScores(chunk),
        recencyScore: buildRecencyScore(chunk),
        lessonPriority: 0,
        moduleRelevance: 0,
        citation: buildCitation(chunk),
      });
    });
  } catch (error) {
    logger.warn('retrieval.keyword_search.failure', {
      query,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  retrievalMetricsCollector.keywordHits += results.length;
  return results;
}

async function vectorSearch(query: string): Promise<RetrievalCandidate[]> {
  const embedding = await timeAsync('retrieval', 'embedding', async () => {
    const embeddingResult = await embeddingProvider.createEmbedding(query);
    logger.info('retrieval.embedding.complete', { model: embeddingProvider.constructor.name });
    return embeddingResult;
  });

  const results = await timeAsync('retrieval', 'vector_search', async () => {
    const vectorResults = await vectorStore.search(embedding, 8);
    logger.info('retrieval.vector_search.complete', { model: vectorStore.constructor.name, vectorCount: vectorResults.length });
    return vectorResults;
  });

  retrievalMetricsCollector.vectorHits += results.length;
  return results.map((result) => {
    const doc = result.document;
    const chunk: AIContentChunk = {
      id: doc.chunkId,
      sourceId: doc.sourceId,
      sourceType: doc.sourceType,
      title: doc.title,
      text: doc.text,
      metadata: doc.metadata ?? {},
    };

    return {
      chunk,
      keywordScore: 0,
      semanticScore: Number(result.similarity),
      metadataScore: buildMetadataScores(chunk),
      recencyScore: buildRecencyScore(chunk),
      lessonPriority: 0.2,
      moduleRelevance: 0.1,
      citation: buildCitation(chunk),
    };
  });
}

export class RetrievalV2Service {
  async buildRetrievalContext(input?: { lessonId?: string; moduleId?: string; questionId?: string; query?: string; }): Promise<AIRetrievalContext> {
    return timeAsync('retrieval', 'total', async () => {
      const safeInput = input ?? {};
      const queryType = safeInput.query?.trim() ? 'explicit' : 'fallback';

      const query = timeSync('retrieval', 'query_normalization', () => {
        return (safeInput.query?.trim && safeInput.query.trim()) || this.buildFallbackQuery(safeInput);
      });

      const idResults = await timeAsync('retrieval', 'cache_lookup', async () => {
        const results: RetrievalCandidate[] = [];

        if (safeInput.lessonId) {
          try {
            const lesson = await lessonRepository.findById(safeInput.lessonId);
            if (lesson) {
              let moduleTitle: string | undefined = undefined;
              try {
                if (lesson.moduleId) {
                  const mod = await moduleRepository.findById(lesson.moduleId);
                  moduleTitle = mod?.title;
                }
              } catch {
                // ignore module lookup failures
              }

              const lessonMetadata = lesson.metadata as LessonMetadata | undefined;
              const source: AIContentSource = {
                id: lesson.id,
                type: 'lesson',
                title: lesson.title,
                excerpt: lesson.description ?? '',
                metadata: {
                  lessonId: lesson.id,
                  moduleId: lesson.moduleId,
                  lessonTitle: lesson.title,
                  moduleTitle,
                  difficulty: lesson.status,
                  tags: Array.isArray(lessonMetadata?.tags) ? lessonMetadata.tags : [],
                  contentType: 'lesson',
                  updatedAt: lesson.updatedAt,
                },
              };
              const chunk = toChunkFromSource(source)[0];
              results.push({
                chunk,
                keywordScore: 1,
                semanticScore: 0,
                metadataScore: buildMetadataScores(chunk),
                recencyScore: buildRecencyScore(chunk),
                lessonPriority: 0.5,
                moduleRelevance: 0.2,
                citation: buildCitation(chunk),
              });
            }
          } catch (e) {
            logger.warn('retrieval.cache_lookup.failure', { queryType, lessonId: safeInput.lessonId, errorMessage: e instanceof Error ? e.message : String(e) });
          }
        }

        if (safeInput.questionId) {
          try {
            const question = await questionRepository.findById(safeInput.questionId);
            if (question) {
              const questionRecord = question as unknown as QuestionRecord;
              const source: AIContentSource = {
                id: questionRecord.id,
                type: 'question',
                title: questionRecord.prompt ?? questionRecord.question ?? 'Question',
                excerpt: questionRecord.explanation ?? questionRecord.prompt ?? questionRecord.question ?? '',
                metadata: {
                  lessonId: undefined,
                  moduleId: undefined,
                  lessonTitle: undefined,
                  moduleTitle: undefined,
                  difficulty: questionRecord.difficulty,
                  tags: [],
                  contentType: 'question',
                  updatedAt: questionRecord.createdAt,
                },
              };
              const chunk = toChunkFromSource(source)[0];
              results.push({
                chunk,
                keywordScore: 1,
                semanticScore: 0,
                metadataScore: buildMetadataScores(chunk),
                recencyScore: buildRecencyScore(chunk),
                lessonPriority: 0,
                moduleRelevance: 0,
                citation: buildCitation(chunk),
              });
            }
          } catch (e) {
            logger.warn('retrieval.cache_lookup.failure', { queryType, questionId: safeInput.questionId, errorMessage: e instanceof Error ? e.message : String(e) });
          }
        }

        logger.info('retrieval.cache_lookup.complete', { queryType, itemCount: results.length });
        return results;
      });

      const keywordResults = await timeAsync('retrieval', 'keyword_search', async () => {
        const results = await keywordSearch(query);
        logger.info('retrieval.keyword_search.complete', { queryType, keywordCount: results.length });
        return results;
      });

      const vectorResults = await timeAsync('retrieval', 'vector_search', async () => {
        const results = await vectorSearch(query);
        logger.info('retrieval.vector_search.complete', { queryType, vectorCount: results.length });
        return results;
      });

      retrievalMetricsCollector.chunksSearched = keywordResults.length + vectorResults.length;
      retrievalMetricsCollector.markRetrievalComplete();

      // Include cached ID lookup results (lesson/question) when merging hybrid results
      const merged = timeSync('retrieval', 'hybrid_merge', () => this.mergeResults([...idResults, ...keywordResults], vectorResults));
      logger.info('retrieval.hybrid_merge.complete', { queryType, mergedCount: merged.length });

      const ranked = timeSync('retrieval', 'rerank', () => rankingService.rankResults(merged));
      logger.info('retrieval.rerank.complete', { queryType, rankedCount: ranked.length });

      const filtered = timeSync('retrieval', 'filter', () => ranked);
      logger.info('retrieval.filter.complete', { queryType, filteredCount: filtered.length });

      retrievalMetricsCollector.chunksSelected = filtered.length;
      retrievalMetricsCollector.markRankingComplete();

      return timeSync('retrieval', 'context_build', () => {
        const retrievalContext: AIRetrievalContext = {
          retrievalQuery: query,
          sourceSummary: filtered.slice(0, 3).map((item) => `${item.chunk.sourceType.toUpperCase()} - ${item.chunk.title}: ${item.chunk.text}`).join(' | '),
          retrievedSources: filtered.slice(0, 4).map((item) => ({
            id: item.chunk.sourceId,
            type: item.chunk.sourceType,
            title: item.chunk.title,
            excerpt: item.chunk.text,
            metadata: item.chunk.metadata,
          })),
          retrievedChunks: filtered.slice(0, 8).map((item) => ({
            ...item.chunk,
            metadata: {
              ...item.chunk.metadata,
              relevance: item.rankingScore,
              citation: item.citation,
            },
          })),
        };

        logger.info('retrieval.context_build.complete', {
          queryType,
          retrievedSourceCount: retrievalContext.retrievedSources.length,
          retrievedChunkCount: retrievalContext.retrievedChunks.length,
        });

        return retrievalContext;
      });
    });
  }

  private mergeResults(keywordResults: RetrievalCandidate[], vectorResults: RetrievalCandidate[]): RetrievalCandidate[] {
    const lookup = new Map<string, RetrievalCandidate>();

    keywordResults.forEach((candidate) => {
      lookup.set(candidate.chunk.id, candidate);
    });

    vectorResults.forEach((candidate) => {
      const existing = lookup.get(candidate.chunk.id);
      if (!existing) {
        lookup.set(candidate.chunk.id, candidate);
      } else {
        lookup.set(candidate.chunk.id, {
          ...candidate,
          keywordScore: Math.max(existing.keywordScore ?? 0, candidate.keywordScore ?? 0),
          semanticScore: Math.max(existing.semanticScore ?? 0, candidate.semanticScore ?? 0),
          metadataScore: Math.max(existing.metadataScore ?? 0, candidate.metadataScore ?? 0),
          recencyScore: Math.max(existing.recencyScore ?? 0, candidate.recencyScore ?? 0),
          lessonPriority: Math.max(existing.lessonPriority ?? 0, candidate.lessonPriority ?? 0),
          moduleRelevance: Math.max(existing.moduleRelevance ?? 0, candidate.moduleRelevance ?? 0),
        });
      }
    });

    return Array.from(lookup.values());
  }

  private buildFallbackQuery(input: { lessonId?: string; moduleId?: string; questionId?: string }): string {
    const parts: string[] = [];
    if (input.lessonId) parts.push(`lesson ${input.lessonId}`);
    if (input.moduleId) parts.push(`module ${input.moduleId}`);
    if (input.questionId) parts.push(`question ${input.questionId}`);
    return parts.join(' ') || 'recent lesson and exam context';
  }
}

export const retrievalV2Service = new RetrievalV2Service();
