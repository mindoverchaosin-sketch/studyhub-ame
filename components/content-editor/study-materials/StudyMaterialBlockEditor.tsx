"use client"

import { useEffect, useState } from 'react'
import type { StudyMaterialBlock } from '@/lib/study-material/document-schema'
import type { MediaAsset } from '@/types/media'

interface StudyMaterialBlockEditorProps {
  block: StudyMaterialBlock
  onChange: (block: StudyMaterialBlock) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

const inputClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500'

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700"><span>{label}</span><input className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700"><span>{label}</span><textarea className={inputClassName} rows={3} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function StudyMaterialBlockEditor({ block, onChange, onRemove, onMove, canMoveUp, canMoveDown }: StudyMaterialBlockEditorProps) {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const update = (changes: Partial<StudyMaterialBlock>) => onChange({ ...block, ...changes } as StudyMaterialBlock)

  useEffect(() => {
    if (block.type !== 'image') return
    fetch('/api/media').then((response) => response.ok ? response.json() : { assets: [] }).then((data: { assets?: MediaAsset[] }) => setMediaAssets(data.assets ?? [])).catch(() => setMediaAssets([]))
  }, [block.type])

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label={`${block.type} block`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{block.type}</span>
        <div className="flex gap-1">
          <button type="button" title="Move block up" disabled={!canMoveUp} onClick={() => onMove(-1)} className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40">↑</button>
          <button type="button" title="Move block down" disabled={!canMoveDown} onClick={() => onMove(1)} className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40">↓</button>
          <button type="button" title="Remove block" onClick={onRemove} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">Remove</button>
        </div>
      </div>

      {block.type === 'heading' && <div className="grid gap-3 sm:grid-cols-[120px_1fr]"><label className="space-y-1 text-sm font-medium text-slate-700"><span>Level</span><select className={inputClassName} value={block.level} onChange={(event) => update({ level: Number(event.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}><option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option><option value={5}>H5</option><option value={6}>H6</option></select></label><TextInput label="Text" value={block.text} onChange={(text) => update({ text })} /></div>}
      {block.type === 'paragraph' && <TextArea label="Paragraph" value={block.children.map((child) => child.text).join('')} onChange={(text) => update({ children: [{ text, format: [] }] })} />}
      {block.type === 'list' && <div className="space-y-3"><label className="block space-y-1 text-sm font-medium text-slate-700"><span>List type</span><select className={inputClassName} value={block.listType} onChange={(event) => update({ listType: event.target.value as 'bullet' | 'numbered' })}><option value="bullet">Bullet</option><option value="numbered">Numbered</option></select></label><TextArea label="Items (one per line)" value={block.items.join('\n')} onChange={(text) => update({ items: text.split('\n').filter((item) => item.trim()) })} /></div>}
      {block.type === 'table' && <div className="space-y-3"><TextInput label="Headers (comma separated)" value={block.headers.join(', ')} onChange={(text) => update({ headers: text.split(',').map((item) => item.trim()).filter(Boolean) })} /><TextArea label="Rows (one row per line, cells separated by |)" value={block.rows.map((row) => row.join(' | ')).join('\n')} onChange={(text) => update({ rows: text.split('\n').filter(Boolean).map((row) => row.split('|').map((cell) => cell.trim())) })} /></div>}
      {block.type === 'image' && <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium text-slate-700"><span>Media library asset</span><select className={inputClassName} value={block.mediaId} onChange={(event) => { const asset = mediaAssets.find((item) => item.id === event.target.value); update({ mediaId: event.target.value, mediaKey: asset?.storageKey, altText: asset?.altText ?? block.altText }) }}><option value="">Select an image asset</option>{mediaAssets.filter((asset) => asset.type === 'image').map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><TextInput label="Media ID" value={block.mediaId} onChange={(mediaId) => update({ mediaId })} /><TextInput label="Media key (optional)" value={block.mediaKey ?? ''} onChange={(mediaKey) => update({ mediaKey: mediaKey || undefined })} /><TextInput label="Alt text" value={block.altText} onChange={(altText) => update({ altText })} /><TextInput label="Caption (optional)" value={block.caption ?? ''} onChange={(caption) => update({ caption: caption || undefined })} /><label className="space-y-1 text-sm font-medium text-slate-700"><span>Alignment</span><select className={inputClassName} value={block.alignment} onChange={(event) => update({ alignment: event.target.value as 'left' | 'center' | 'right' })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><TextInput label="Width (optional)" value={block.width?.toString() ?? ''} onChange={(width) => update({ width: width ? Math.max(1, Number(width)) : undefined })} /></div>}
      {block.type === 'callout' && <div className="space-y-3"><TextInput label="Title" value={block.title} onChange={(title) => update({ title })} /><TextArea label="Text" value={block.text} onChange={(text) => update({ text })} /><label className="block space-y-1 text-sm font-medium text-slate-700"><span>Variant</span><select className={inputClassName} value={block.variant} onChange={(event) => update({ variant: event.target.value as 'important' | 'tip' | 'warning' })}><option value="important">Important</option><option value="tip">Tip</option><option value="warning">Warning</option></select></label></div>}
      {block.type === 'definition' && <div className="space-y-3"><TextInput label="Term" value={block.term} onChange={(term) => update({ term })} /><TextArea label="Definition" value={block.definition} onChange={(definition) => update({ definition })} /></div>}
      {block.type === 'example' && <div className="space-y-3"><TextInput label="Title" value={block.title} onChange={(title) => update({ title })} /><TextArea label="Content" value={block.content} onChange={(content) => update({ content })} /></div>}
      {block.type === 'examTip' && <TextArea label="Exam tip" value={block.text} onChange={(text) => update({ text })} />}
      {block.type === 'link' && <div className="space-y-3"><TextInput label="Link text" value={block.text} onChange={(text) => update({ text })} /><TextInput label="URL" value={block.url} onChange={(url) => update({ url })} /><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={block.openInNewTab} onChange={(event) => update({ openInNewTab: event.target.checked })} /> Open in new tab</label></div>}
    </section>
  )
}
