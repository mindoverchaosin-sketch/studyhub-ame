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

export interface MediaProvider {
  list(): Promise<MediaAsset[]>;
  get(id: string): Promise<MediaAsset | null>;
  create(asset: MediaAsset): Promise<MediaAsset>;
  update(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null>;
  delete(id: string): Promise<boolean>;
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
