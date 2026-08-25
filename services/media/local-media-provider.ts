import type { MediaAsset, MediaProvider } from '@/types/media';

export class LocalMediaProvider implements MediaProvider {
  private readonly assets: MediaAsset[] = [];
  private readonly bytes = new Map<string, { body: Uint8Array; mimeType: string }>();

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
    const previous = this.assets[index];
    if ((updates.url ?? previous.url) !== previous.url && previous.url) {
      // Keep byte storage consistent with the re-keyed registry entry.
      this.bytes.delete(previous.url);
    }
    this.assets[index] = { ...previous, ...updates };
    return this.assets[index];
  }

  async delete(id: string): Promise<boolean> {
    const before = this.assets.length;
    const removed = this.assets.find((asset) => asset.id === id);
    const next = this.assets.filter((asset) => asset.id !== id);
    this.assets.splice(0, this.assets.length, ...next);
    if (removed?.url) this.bytes.delete(removed.url);
    return this.assets.length < before;
  }

  async storeBytes(path: string, body: Uint8Array, mimeType: string): Promise<void> {
    this.bytes.set(path, { body, mimeType });
  }

  async getObject(path: string): Promise<{ body: Uint8Array; mimeType: string; redirectPath?: string } | null> {
    return this.bytes.get(path) ?? null;
  }

  async deleteObject(path: string): Promise<void> {
    this.bytes.delete(path);
  }
}
