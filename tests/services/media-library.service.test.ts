import { describe, expect, it } from 'vitest';
import { MediaLibraryService } from '@/server/services/media/media-library.service';
import type { MediaAsset, MediaProvider, MediaAssetType } from '@/types/media';

class InMemoryMediaProvider implements MediaProvider {
  private assets: MediaAsset[] = [];

  async list(): Promise<MediaAsset[]> {
    return this.assets;
  }

  async get(id: string): Promise<MediaAsset | null> {
    return this.assets.find((asset) => asset.id === id) ?? null;
  }

  async create(asset: MediaAsset): Promise<MediaAsset> {
    this.assets.push(asset);
    return asset;
  }

  async update(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null> {
    const index = this.assets.findIndex((asset) => asset.id === id);
    if (index < 0) return null;
    this.assets[index] = { ...this.assets[index], ...updates };
    return this.assets[index];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.assets.length;
    this.assets = this.assets.filter((asset) => asset.id !== id);
    return this.assets.length < initialLength;
  }
}

describe('media library service', () => {
  it('validates uploads before persisting them', async () => {
    const service = new MediaLibraryService(new InMemoryMediaProvider());
    const invalidFile = new File(['bad data'], 'malware.exe', { type: 'application/x-msdownload' });

    expect(() => service.validateUpload(invalidFile)).toThrow('Unsupported file type');
  });

  it('uses the provider abstraction for create and list operations', async () => {
    const provider = new InMemoryMediaProvider();
    const service = new MediaLibraryService(provider);
    const asset = await service.uploadAsset(new File(['sunset'], 'sunset.png', { type: 'image/png' }), { uploadedBy: 'editor' });

    expect(asset.name).toBe('sunset.png');
    expect(await provider.list()).toHaveLength(1);
  });

  it('filters assets by type and query', async () => {
    const service = new MediaLibraryService(new InMemoryMediaProvider());
    await service.uploadAsset(new File(['img'], 'hero.png', { type: 'image/png' }), { uploadedBy: 'editor' });
    await service.uploadAsset(new File(['doc'], 'guide.pdf', { type: 'application/pdf' }), { uploadedBy: 'editor' });

    const results = service.listAssets({ query: 'guide', type: 'pdf' as MediaAssetType });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('guide.pdf');
  });

  it('manages lesson attachments by add, remove, and reorder operations', async () => {
    const service = new MediaLibraryService(new InMemoryMediaProvider());
    const first = await service.uploadAsset(new File(['one'], 'one.png', { type: 'image/png' }), { uploadedBy: 'editor' });
    const second = await service.uploadAsset(new File(['two'], 'two.pdf', { type: 'application/pdf' }), { uploadedBy: 'editor' });

    const attached = service.attachAssetToLesson([], first.id);
    const updated = service.attachAssetToLesson(attached, second.id);
    const reordered = service.reorderLessonAttachments(updated, second.id, 0);
    const removed = service.removeAttachmentFromLesson(reordered, first.id);

    expect(removed).toHaveLength(1);
    expect(removed[0]?.id).toBe(second.id);
  });

  it('enforces media permissions by role', () => {
    const service = new MediaLibraryService(new InMemoryMediaProvider());
    expect(service.canManageMedia('ADMIN')).toBe(true);
    expect(service.canManageMedia('CONTENT_EDITOR')).toBe(true);
    expect(service.canManageMedia('INSTRUCTOR')).toBe(false);
    expect(service.canAttachMedia('INSTRUCTOR')).toBe(true);
    expect(service.canViewMedia('STUDENT')).toBe(true);
  });
});
