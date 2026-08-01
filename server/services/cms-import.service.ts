import { lessonRepository } from '@/server/repositories/lesson.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { quizRepository } from '@/server/repositories/quiz.repository';
import type { MediaAsset } from '@/types/media';

export type CmsImportTarget = 'lessons' | 'questions' | 'mock-tests';

export type CmsImportRow = {
  row: number;
  type: CmsImportTarget;
  title: string;
  content?: string;
  moduleId?: string;
  status?: string;
  errors: string[];
};

export type CmsImportPreview = {
  rows: CmsImportRow[];
  duplicates: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
};

type ParsedImportRow = { row: number; values: Record<string, string> };

function parseCsv(content: string): string[][] {
  const rows = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!rows.length) return [];
  return rows.map((row) => row.split(',').map((cell) => cell.trim()));
}

function parseImportRows(content: string): ParsedImportRow[] {
  const rows = parseCsv(content);
  if (!rows.length) return [];

  const firstRow = rows[0];
  const looksLikeHeader = firstRow.some((cell) => /type|content_type|title|name|prompt|answer/.test(cell.toLowerCase()));

  if (looksLikeHeader) {
    const [header, ...body] = rows;
    return body.map((values, index) => {
      const normalized = header.reduce<Record<string, string>>((accumulator, key, columnIndex) => {
        accumulator[key] = values[columnIndex] ?? '';
        return accumulator;
      }, {});
      return { row: index + 2, values: normalized };
    });
  }

  return rows.map((values, index) => ({
    row: index + 1,
    values: {
      type: values[0] ?? 'lessons',
      title: values[1] ?? '',
      content: values[2] ?? '',
      module: values[3] ?? '',
      status: values[4] ?? '',
      prompt: values[2] ?? '',
      answer: values[3] ?? '',
    } as Record<string, string>,
  }));
}

export class CmsImportService {
  async previewImport(content: string): Promise<CmsImportPreview> {
    const parsed = parseImportRows(content);
    const rows: CmsImportRow[] = [];
    const duplicates: string[] = [];

    if (!parsed.length) {
      return { rows: [], duplicates: [], summary: { total: 0, valid: 0, invalid: 0 } };
    }

    const seen = new Set<string>();
    for (const entry of parsed) {
      const recordType = (entry.values.type || entry.values.content_type || 'lessons').toLowerCase();
      const title = entry.values.title || entry.values.name || '';
      const errors: string[] = [];

      if (!['lessons', 'questions', 'mock-tests'].includes(recordType)) {
        errors.push('Unsupported content type');
      }

      if (!title) {
        errors.push('Title is required');
      }

      if (recordType === 'lessons' && !entry.values.content) {
        errors.push('Lesson content is required');
      }

      if (recordType === 'questions' && (!entry.values.prompt || !entry.values.answer)) {
        errors.push('Question requires prompt and answer');
      }

      const normalizedTitle = title.trim().toLowerCase();
      if (normalizedTitle && seen.has(normalizedTitle)) {
        errors.push('Duplicate title detected');
        duplicates.push(title);
      } else if (normalizedTitle) {
        seen.add(normalizedTitle);
      }

      rows.push({ row: entry.row, type: recordType as CmsImportTarget, title, content: entry.values.content || entry.values.prompt, moduleId: entry.values.module_id || entry.values.module, status: entry.values.status, errors });
    }

    return {
      rows,
      duplicates,
      summary: {
        total: rows.length,
        valid: rows.filter((row) => row.errors.length === 0).length,
        invalid: rows.filter((row) => row.errors.length > 0).length,
      },
    };
  }

  async importFromPreview(preview: CmsImportPreview): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const row of preview.rows) {
      if (row.errors.length > 0) continue;
      try {
        if (row.type === 'lessons') {
          await lessonRepository.create({
            title: row.title,
            description: row.content ?? '',
            slug: row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            module: row.moduleId ? { connect: { id: row.moduleId } } : undefined,
            status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
            metadata: { objectives: [], attachments: [] },
          } as any);
        } else if (row.type === 'questions') {
          await questionRepository.create({
            prompt: row.title,
            explanation: row.content ?? '',
            difficulty: 'BEGINNER',
            status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
            metadata: { tags: [] },
          } as any);
        } else {
          await quizRepository.create({
            title: row.title,
            description: row.content ?? '',
            status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          } as any);
        }

        successCount += 1;
      } catch (error) {
        errors.push(`Row ${row.row}: ${error instanceof Error ? error.message : 'Import failed'}`);
      }
    }

    return { successCount, failureCount: preview.rows.length - successCount, errors };
  }
}

export const cmsImportService = new CmsImportService();
