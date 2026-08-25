import { randomUUID } from 'crypto';
import type { MediaAsset, MediaAssetType, MediaProvider, MediaQuery, LessonAttachment } from '@/types/media';

export class MediaLibraryService {
  private cachedAssets: MediaAsset[] = [];
  private readonly maxUploadSize = Number(process.env.MAX_MEDIA_UPLOAD_SIZE_BYTES ?? 10 * 1024 * 1024);

  constructor(private readonly provider: MediaProvider) {}

  validateUpload(file: File): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp4'];
    const name = file.name.trim();

    if (!name) {
      throw new Error('Filename is required.');
    }

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      throw new Error('Unsupported file type.');
    }

    if (file.size <= 0) {
      throw new Error('File is empty.');
    }

    if (file.size > this.maxUploadSize) {
      throw new Error(`File size exceeds the ${this.maxUploadSize} byte limit.`);
    }
  }

  async uploadAsset(file: File, options: { uploadedBy: string; altText?: string } = { uploadedBy: 'system' }): Promise<MediaAsset> {
    this.validateUpload(file);
    const safeName = this.sanitizeFileName(file.name);
    const assetType = this.inferAssetType(file.type, safeName);
    const storageKey = `media/${randomUUID()}-${safeName}`;

    const asset: MediaAsset = {
      id: randomUUID(),
      name: safeName,
      type: assetType,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.uploadedBy,
      storageKey,
      altText: options.altText,
      url: `/media/${storageKey}`,
    };

    const created = await this.provider.create(asset);
    await this.provider.storeBytes(asset.url ?? '', new Uint8Array(await file.arrayBuffer()), asset.mimeType)
    this.cachedAssets = [...this.cachedAssets, created];
    return created;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const deleted = await this.provider.delete(id);
    if (deleted) {
      this.cachedAssets = this.cachedAssets.filter((asset) => asset.id !== id);
    }
    return deleted;
  }

  async replaceAsset(id: string, file: File, options: { uploadedBy: string; altText?: string } = { uploadedBy: 'system' }): Promise<MediaAsset | null> {
    this.validateUpload(file);
    const safeName = this.sanitizeFileName(file.name);
    const assetType = this.inferAssetType(file.type, safeName);
    const storageKey = `media/${randomUUID()}-${safeName}`;

    const previous = await this.provider.get(id);

    const updated = await this.provider.update(id, {
      name: safeName,
      type: assetType,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.uploadedBy,
      storageKey,
      altText: options.altText,
      url: `/media/${storageKey}`,
    });

    if (updated) {
      await this.provider.storeBytes(updated.url ?? '', new Uint8Array(await file.arrayBuffer()), updated.mimeType)

      // Only after the new bytes are durably stored may the superseded
      // object be removed — a failed store must preserve the old media.
      if (previous && previous.storageKey !== updated.storageKey) {
        await this.provider.deleteObject?.(previous.url ?? `/media/${previous.storageKey}`)
      }

      this.cachedAssets = this.cachedAssets.map((asset) => (asset.id === id ? updated : asset));
    }

    return updated;
  }

  listAssets(query?: MediaQuery): MediaAsset[] {
    const source = this.cachedAssets.length > 0 ? this.cachedAssets : [];
    const filtered = source.filter((asset) => {
      const matchesQuery = !query?.query || asset.name.toLowerCase().includes(query.query.toLowerCase());
      const matchesType = !query?.type || asset.type === query.type;
      return matchesQuery && matchesType;
    });

    const sortBy = query?.sortBy ?? 'uploadedAt';
    const sortOrder = query?.sortOrder ?? 'desc';
    const direction = sortOrder === 'asc' ? 1 : -1;

    return filtered.sort((left, right) => {
      const leftValue = left[sortBy] ?? '';
      const rightValue = right[sortBy] ?? '';
      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });
  }

  attachAssetToLesson(attachments: LessonAttachment[], assetId: string): LessonAttachment[] {
    return [...attachments, { id: assetId, name: assetId, type: 'document', mimeType: 'application/octet-stream' }];
  }

  reorderLessonAttachments(attachments: LessonAttachment[], assetId: string, index: number): LessonAttachment[] {
    const target = attachments.find((attachment) => attachment.id === assetId);
    if (!target) {
      return attachments;
    }

    const current = attachments.filter((attachment) => attachment.id !== assetId);
    return [...current.slice(0, index), target, ...current.slice(index)];
  }

  removeAttachmentFromLesson(attachments: LessonAttachment[], assetId: string): LessonAttachment[] {
    return attachments.filter((attachment) => attachment.id !== assetId);
  }

  canManageMedia(role?: string | null): boolean {
    return role === 'ADMIN' || role === 'CONTENT_EDITOR';
  }

  canAttachMedia(role?: string | null): boolean {
    return role === 'ADMIN' || role === 'CONTENT_EDITOR' || role === 'INSTRUCTOR';
  }

  canViewMedia(role?: string | null): boolean {
    return role === 'ADMIN' || role === 'CONTENT_EDITOR' || role === 'INSTRUCTOR' || role === 'STUDENT';
  }

  private inferAssetType(mimeType: string, name: string): MediaAssetType {
    const lowerName = name.toLowerCase();
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  private sanitizeFileName(filename: string): string {
    const sanitized = filename
      .trim()
      .replace(/\\/g, '/')
      .split('/')
      .pop() ?? '';

    const safeName = sanitized
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/[-_.]{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);

    return safeName || 'upload-file';
  }
}
