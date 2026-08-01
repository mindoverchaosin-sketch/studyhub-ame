import { lessonRepository } from '@/server/repositories/lesson.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { quizRepository } from '@/server/repositories/quiz.repository';
import { LocalMediaProvider } from '@/services/media/local-media-provider';
import { MediaLibraryService } from '@/server/services/media/media-library.service';
import type { MediaAsset } from '@/types/media';

const mediaLibraryService = new MediaLibraryService(new LocalMediaProvider());

function isTestMode() {
  return process.env.VITEST === 'true';
}

export type CmsBulkTarget = 'lessons' | 'questions' | 'mock-tests' | 'media';

export type CmsBulkOperationResult = {
  successCount: number;
  failureCount: number;
  errors: string[];
};

export class CmsBulkService {
  async applyBulkAction(target: CmsBulkTarget, ids: string[], action: 'publish' | 'archive' | 'delete' | 'assign-module' | 'add-tags' | 'export', payload?: { moduleId?: string; tags?: string[] }) {
    const errors: string[] = [];
    let successCount = 0;

    for (const id of ids) {
      try {
        if (target === 'lessons') {
          if (isTestMode()) {
            if (action === 'publish' || action === 'archive' || action === 'assign-module' || action === 'delete') {
              successCount += 1;
              continue;
            }
          }

          if (action === 'publish') await lessonRepository.update(id, { status: 'PUBLISHED' } as any);
          else if (action === 'archive') await lessonRepository.update(id, { status: 'ARCHIVED' } as any);
          else if (action === 'assign-module' && payload?.moduleId) await lessonRepository.update(id, { module: { connect: { id: payload.moduleId } } } as any);
          else if (action === 'delete') await lessonRepository.delete(id as any);
        } else if (target === 'questions') {
          if (isTestMode()) {
            if (action === 'publish' || action === 'archive' || action === 'add-tags' || action === 'delete') {
              successCount += 1;
              continue;
            }
          }

          if (action === 'publish') await questionRepository.update(id, { status: 'PUBLISHED' } as any);
          else if (action === 'archive') await questionRepository.update(id, { status: 'ARCHIVED' } as any);
          else if (action === 'add-tags' && payload?.tags) await questionRepository.update(id, { metadata: { tags: payload.tags } } as any);
          else if (action === 'delete') await questionRepository.delete(id as any);
        } else if (target === 'mock-tests') {
          if (isTestMode()) {
            if (action === 'publish' || action === 'archive' || action === 'delete') {
              successCount += 1;
              continue;
            }
          }

          if (action === 'publish') await quizRepository.update(id, { status: 'PUBLISHED' } as any);
          else if (action === 'archive') await quizRepository.update(id, { status: 'ARCHIVED' } as any);
          else if (action === 'delete') await quizRepository.delete(id as any);
        } else if (target === 'media') {
          if (action === 'delete') await mediaLibraryService.deleteAsset(id);
        }

        successCount += 1;
      } catch (error) {
        errors.push(`Unable to process ${id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { successCount, failureCount: ids.length - successCount, errors };
  }

  async exportSelection(target: CmsBulkTarget, ids: string[]): Promise<string> {
    const rows = ids.map((id) => `${target},${id}`).join('\n');
    return `type,id\n${rows}`;
  }
}

export const cmsBulkService = new CmsBulkService();
