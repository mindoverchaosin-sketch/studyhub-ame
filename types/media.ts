export type MediaAssetType = 'image' | 'pdf' | 'document' | 'video';

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaAssetType;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  storageKey: string;
  altText?: string;
  url?: string;
}

export interface MediaUploadInput {
  file: File;
  uploadedBy: string;
  altText?: string;
}

/**
 * Storage contract:
 * - update persists registry metadata only; metadata-only updates must never
 *   destroy existing object bytes.
 * - replacement flows write the new byte content through storeBytes and only
 *   then remove superseded storage via deleteObject.
 */
export interface MediaProvider {
  list(): Promise<MediaAsset[]>;
  get(id: string): Promise<MediaAsset | null>;
  create(asset: MediaAsset): Promise<MediaAsset>;
  update(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null>;
  delete(id: string): Promise<boolean>;
  storeBytes(path: string, body: Uint8Array, mimeType: string): Promise<void>;
  getObject(path: string): Promise<{ body: Uint8Array; mimeType: string; redirectPath?: string } | null>;
  deleteObject?(path: string): Promise<void>;
}

export interface MediaQuery {
  query?: string;
  type?: MediaAssetType;
  sortBy?: 'name' | 'uploadedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LessonAttachment {
  id: string;
  name: string;
  type: MediaAssetType;
  mimeType: string;
  url?: string;
}
