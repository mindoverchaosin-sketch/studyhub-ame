import { describe, expect, it } from 'vitest';
import { CmsImportService } from '@/server/services/cms-import.service';
import { CmsBulkService } from '@/server/services/cms-bulk.service';
import { CmsSearchService } from '@/server/services/cms-search.service';

describe('cms content management helpers', () => {
  it('validates csv import preview and surfaces duplicates', async () => {
    const service = new CmsImportService();
    const preview = await service.previewImport('lessons,Corrosion Basics,Intro content\nlessons,Corrosion Basics,Intro content\nquestions,Hydraulic question,Prompt,Answer');

    expect(preview.summary.total).toBe(3);
    expect(preview.summary.invalid).toBeGreaterThan(0);
    expect(preview.duplicates).toContain('Corrosion Basics');
  });

  it('supports bulk operations and exports', async () => {
    const service = new CmsBulkService();
    const result = await service.applyBulkAction('lessons', ['lesson-1'], 'publish');
    const exportCsv = await service.exportSelection('lessons', ['lesson-1']);

    expect(result.successCount).toBe(1);
    expect(exportCsv).toContain('lesson-1');
  });

  it('searches across content types with filters', () => {
    const service = new CmsSearchService();
    const items = [
      { id: '1', type: 'lesson' as const, title: 'Corrosion Basics', status: 'Published' },
      { id: '2', type: 'module' as const, title: 'Hydraulic Systems', status: 'Draft' },
    ];

    const results = service.search(items, 'corrosion', 'lesson', 'Published');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Corrosion Basics');
  });
});
