import type { StudyMaterialDocument } from '@/lib/study-material/document-schema'
import { sanitizeStudyMaterialDocument } from '@/lib/study-material/document-schema'

interface StudyMaterialWebRendererProps {
  document: StudyMaterialDocument
  pageNumber?: number
  mediaBasePath?: string
}

const calloutStyles = {
  important: 'border-amber-200 bg-amber-50 text-amber-950',
  tip: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-red-200 bg-red-50 text-red-950',
}

export function StudyMaterialWebRenderer({ document: rawDocument, pageNumber = 1, mediaBasePath = '/media/' }: StudyMaterialWebRendererProps) {
  const document = sanitizeStudyMaterialDocument(rawDocument)
  const pages = document.pages.length > 0
    ? document.pages
    : [{ id: 'page-1', pageNumber, pageType: 'CONTENT' as const, title: document.title, blocks: document.blocks }]
  const moduleLabel = [document.metadata.module, document.metadata.submoduleNumber ?? document.metadata.lesson].filter(Boolean).join(' · ')

  return (
    <article className="mx-auto max-w-4xl overflow-hidden bg-white text-slate-800 shadow-sm">
      {pages.map((page) => <section key={page.id} className="break-after-page">
      <header className="border-b-4 border-blue-600 px-6 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white" aria-label="AeroPrep logo">A</div>
            <div><div className="text-xl font-black tracking-[0.2em] text-slate-950">AEROPREP</div><div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">LEARN • PRACTICE • GET LICENSED</div></div>
          </div>
          <span className="text-xs font-semibold text-slate-500" data-page-number>Page {page.pageNumber}</span>
        </div>
        {moduleLabel ? <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{moduleLabel}</div> : null}
      </header>

      <main className="space-y-6 px-6 py-8 sm:px-10">
        <h1 className="text-3xl font-bold text-slate-950">{page.title || document.title}</h1>
        {page.blocks.map((block) => {
          if (block.type === 'heading') return <h2 key={block.id} id={block.anchor} className="text-2xl font-bold text-slate-950">{block.text}</h2>
          if (block.type === 'paragraph') return <p key={block.id} className="leading-8">{block.children.map((child) => child.format.includes('bold') ? <strong key={child.text}>{child.text}</strong> : child.text)}</p>
          if (block.type === 'list') return block.listType === 'numbered' ? <ol key={block.id} className="list-decimal space-y-2 pl-6">{block.items.map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}</ol> : <ul key={block.id} className="list-disc space-y-2 pl-6">{block.items.map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}</ul>
          if (block.type === 'table') return <div key={block.id} className="overflow-x-auto"><table className="w-full border-collapse border border-slate-300"><thead><tr>{block.headers.map((header) => <th key={header} className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">{header}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={`${block.id}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="border border-slate-300 px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>
          if (block.type === 'image') return <figure key={block.id} className={`text-${block.alignment}`}><img src={block.mediaKey ? `${mediaBasePath}${block.mediaKey.replace(/^\//, '')}` : `${mediaBasePath}${block.mediaId}`} alt={block.altText} width={block.width} className="inline-block max-w-full rounded-lg" />{block.caption ? <figcaption className="mt-2 text-sm text-slate-500">{block.caption}</figcaption> : null}</figure>
          if (block.type === 'callout') return <aside key={block.id} className={`rounded-xl border p-4 ${calloutStyles[block.variant]}`}><h3 className="font-bold">{block.title}</h3><p className="mt-1">{block.text}</p></aside>
          if (block.type === 'definition') return <aside key={block.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4"><strong>{block.term}</strong><p className="mt-1">{block.definition}</p></aside>
          if (block.type === 'example') return <aside key={block.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-bold">{block.title}</h3><p className="mt-1">{block.content}</p></aside>
          if (block.type === 'examTip') return <aside key={block.id} className="rounded-xl border border-violet-200 bg-violet-50 p-4 font-medium text-violet-950">{block.text}</aside>
          return <a key={block.id} href={block.url} target={block.openInNewTab ? '_blank' : undefined} rel={block.openInNewTab ? 'noreferrer' : undefined} className="text-blue-700 underline">{block.text}</a>
        })}
      </main>

      <footer className="border-t border-slate-200 px-6 py-5 text-center text-xs font-semibold tracking-[0.18em] text-slate-500 sm:px-10">AEROPREP • LEARN • PRACTICE • GET LICENSED</footer>
      </section>)}
    </article>
  )
}
