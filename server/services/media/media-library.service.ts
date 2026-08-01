import { randomUUID } from 'crypto';
import type { MediaAsset, MediaAssetType, MediaProvider, MediaQuery, LessonAttachment } from '@/types/media';

export class MediaLibraryService {
  private cachedAssets: MediaAsset[] = [];

  constructor(private readonly provider: MediaProvider) {}

  validateUpload(file: File): File {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp4'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      throw new Error('Unsupported file type');
    }

    if (file.size <= 0) {
      throw new Error('File is empty');
    }

    return file;
  }

  async uploadAsset(file: File, options: { uploadedBy: string; altText?: string } = { uploadedBy: 'system' }): Promise<MediaAsset> {
    const validatedFile = this.validateUpload(file);
    const assetType = this.inferAssetType(validatedFile.type, validatedFile.name);

    const asset: MediaAsset = {
      id: randomUUID(),
      name: validatedFile.name,
      type: assetType,
      mimeType: validatedFile.type || 'application/octet-stream',
      size: validatedFile.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.uploadedBy,
      storageKey: `media/${randomUUID()}-${validatedFile.name}`,
      altText: options.altText,
      url: `/media/${validatedFile.name}`,
    };

    const created = await this.provider.create(asset);
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
    const validatedFile = this.validateUpload(file);
    const assetType = this.inferAssetType(validatedFile.type, validatedFile.name);

    const updated = await this.provider.update(id, {
      name: validatedFile.name,
      type: assetType,
      mimeType: validatedFile.type || 'application/octet-stream',
      size: validatedFile.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.uploadedBy,
      storageKey: `media/${randomUUID()}-${validatedFile.name}`,
      altText: options.altText,
      url: `/media/${validatedFile.name}`,
    });

    if (updated) {
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
}
