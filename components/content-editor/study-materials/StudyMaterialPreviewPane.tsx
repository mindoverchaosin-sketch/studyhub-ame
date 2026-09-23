"use client"

import { useMemo, useState } from 'react'
import { normalizeStudyMaterialDocument, type StudyMaterialDocument } from '@/lib/study-material/document-schema'

interface StudyMaterialPreviewPaneProps {
  document: StudyMaterialDocument
  pageIndex?: number
}

export function StudyMaterialPreviewPane({ document, pageIndex = 0 }: StudyMaterialPreviewPaneProps) {
  const normalizedDocument = useMemo(() => normalizeStudyMaterialDocument(document), [document])
  const totalPages = normalizedDocument.pages.length || 1
  const [currentPageIndex, setCurrentPageIndex] = useState(() => Math.min(pageIndex, totalPages - 1))

  const currentPage = normalizedDocument.pages[currentPageIndex] ?? normalizedDocument.pages[0]
  const blocks = currentPage?.blocks ?? []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setCurrentPageIndex((value) => Math.max(0, value - 1))} disabled={currentPageIndex === 0} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous Page</button>
        <div className="text-center text-sm font-medium text-slate-600">Page {currentPage?.pageNumber ?? currentPageIndex + 1} / {totalPages}</div>
        <button type="button" onClick={() => setCurrentPageIndex((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPageIndex >= totalPages - 1} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next Page</button>
      </div>

      <div className="mx-auto max-w-4xl rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">A</div>
            <div>
              <div className="text-lg font-black tracking-[0.2em] text-slate-900">AEROPREP</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">LEARN • PRACTICE • GET LICENSED</div>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">Page {currentPage?.pageNumber ?? currentPageIndex + 1}</div>
        </div>

        {currentPage?.title ? <h1 className="mb-6 text-3xl font-bold text-slate-900">{currentPage.title}</h1> : <h1 className="mb-6 text-3xl font-bold text-slate-900">{normalizedDocument.title}</h1>}

        <div className="space-y-5 text-slate-700">
          {blocks.map((block, index) => (
            <div key={`${block.type}-${block.id ?? index}`}>
              {block.type === 'heading' && <h2 className="text-2xl font-semibold text-slate-900">{block.text}</h2>}
              {block.type === 'paragraph' && <p>{block.children.map((child) => child.text).join('')}</p>}
              {block.type === 'list' && (
                <ul className="list-disc space-y-2 pl-6">
                  {block.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {block.type === 'table' && (
                <table className="w-full border-collapse border border-slate-300">
                  <thead>
                    <tr>
                      {block.headers.map((header) => <th key={header} className="border border-slate-300 bg-slate-100 px-2 py-2 text-left">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${rowIndex}`}>
                        {row.map((cell) => <td key={cell} className="border border-slate-300 px-2 py-2">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {block.type === 'callout' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 font-semibold text-amber-800">{block.title}</div>
                  <p>{block.text}</p>
                </div>
              )}
              {block.type === 'definition' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <strong>{block.term}</strong>
                  <p className="mt-2">{block.definition}</p>
                </div>
              )}
              {block.type === 'example' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="font-semibold text-emerald-800">{block.title}</div>
                  <p className="mt-2">{block.content}</p>
                </div>
              )}
              {block.type === 'examTip' && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 font-medium text-violet-800">{block.text}</div>
              )}
              {block.type === 'link' && (
                <a href={block.url} target={block.openInNewTab ? '_blank' : undefined} rel="noreferrer" className="text-blue-700 underline">{block.text}</a>
              )}
              {block.type === 'image' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-sm text-slate-500">Image: {block.mediaId}</div>
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">{block.altText}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          AEROPREP • LEARN • PRACTICE • GET LICENSED
        </footer>
      </div>
    </div>
  )
}
