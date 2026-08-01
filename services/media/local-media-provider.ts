import type { MediaAsset, MediaProvider } from '@/types/media';

export class LocalMediaProvider implements MediaProvider {
  private readonly assets: MediaAsset[] = [];

  async list(): Promise<MediaAsset[]> {
    return [...this.assets];
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
    const before = this.assets.length;
    const next = this.assets.filter((asset) => asset.id !== id);
    this.assets.splice(0, this.assets.length, ...next);
    return this.assets.length < before;
  }
}
