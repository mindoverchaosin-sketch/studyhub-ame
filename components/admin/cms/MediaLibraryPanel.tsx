"use client";

import { useEffect, useMemo, useState } from 'react';
import type { LessonAttachment, MediaAsset, MediaAssetType } from '@/types/media';

export function MediaLibraryPanel({
  attachedIds,
  onSelect,
  onUpload,
  onRemove,
}: {
  attachedIds: string[];
  onSelect: (assetId: string) => void;
  onUpload: (file: File) => Promise<void>;
  onRemove: (assetId: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<MediaAssetType | 'all'>('all');

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = (await response.json()) as { assets: MediaAsset[] };
        setAssets(data.assets);
      }
    })();
  }, []);

  const visibleAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesQuery = !query || asset.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = type === 'all' || asset.type === type;
      return matchesQuery && matchesType;
    });
  }, [assets, query, type]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search library" className="w-full rounded-2xl border border-slate-200 px-3 py-2 md:max-w-xs" />
        <select value={type} onChange={(event) => setType(event.target.value as MediaAssetType | 'all')} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
        </select>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Upload a new asset
        <input type="file" className="mt-2 block w-full text-sm" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onUpload(file);
          }
        }} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleAssets.map((asset) => {
          const isAttached = attachedIds.includes(asset.id);
          return (
            <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{asset.name}</p>
                  <p className="text-xs text-slate-500">{asset.type} • {asset.mimeType}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => window.open(asset.url ?? '#', '_blank', 'noopener,noreferrer')} className="rounded-full border border-slate-200 px-3 py-1 text-xs">Preview</button>
                  <button type="button" onClick={() => onSelect(asset.id)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">{isAttached ? 'Attached' : 'Attach'}</button>
                  <button type="button" onClick={() => onRemove(asset.id)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600">Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
