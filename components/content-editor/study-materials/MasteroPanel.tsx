"use client"

import { useState } from 'react'
import { sanitizeStudyMaterialDocument, type StudyMaterialBlock, type StudyMaterialDocument } from '@/lib/study-material/document-schema'
import type { MasteroAction, MasteroGenerationResult } from '@/types/mastero'
import type { MasteroGenerateApiResponse, MasteroApiErrorResponse } from '@/types/mastero-api'
import { analyzeMasteroOutput, type MasteroQualityReport } from '@/lib/mastero/quality-check'
import { StudyMaterialBlockEditor } from './StudyMaterialBlockEditor'

type MasteroMode = 'STUDY_MATERIAL' | 'REVISION_NOTES'
type StudyDepth = 'Standard' | 'Detailed' | 'Comprehensive'
type RevisionLength = 'Short' | 'Standard' | 'Detailed'

const revisionFocusOptions = ['Key points', 'Definitions', 'Exam focus', 'Differences', 'Memory aids', 'Important values/formulas'] as const

interface MasteroPanelProps {
  materialId?: string
  document: StudyMaterialDocument
  activePageIndex: number
  selectedBlockId?: string
  onApply: (result: MasteroGenerationResult, selectedBlockId?: string) => void
}

export function MasteroPanel({ materialId, document, activePageIndex, selectedBlockId, onApply }: MasteroPanelProps) {
  const [mode, setMode] = useState<MasteroMode>('STUDY_MATERIAL')
  const [depth, setDepth] = useState<StudyDepth>('Standard')
  const [length, setLength] = useState<RevisionLength>('Standard')
  const [focus, setFocus] = useState<string[]>([...revisionFocusOptions])
  const [rawContent, setRawContent] = useState('')
  const [instruction, setInstruction] = useState('')
  const [generated, setGenerated] = useState<MasteroGenerationResult | null>(null)
  const [editableBlocks, setEditableBlocks] = useState<StudyMaterialBlock[]>([])
  const [quality, setQuality] = useState<MasteroQualityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activePage = document.pages[activePageIndex] ?? document.pages[0]
  const activePageDocument = activePage
    ? { ...document, pages: [{ ...activePage, blocks: editableBlocks }], blocks: editableBlocks }
    : { ...document, blocks: editableBlocks }

  const previewDocument = (() => {
    if (!generated) return null
    try {
      return sanitizeStudyMaterialDocument(activePageDocument)
    } catch (previewError) {
      return { error: previewError instanceof Error ? previewError.message : 'Generated preview is invalid.' }
    }
  })()

  const action: MasteroAction = mode === 'STUDY_MATERIAL' ? 'GENERATE_SECTION' : 'GENERATE_STUDY_NOTES'
  const sourceText = rawContent.trim() || (activePage?.blocks ?? []).map((block) => JSON.stringify(block)).join('\n')

  const generate = async () => {
    if (!materialId) return
    setLoading(true)
    setError(null)
    try {
      const sourceContext = [
        `[MASTERO_MODE=${mode}]`,
        mode === 'STUDY_MATERIAL' ? `[DEPTH=${depth}]` : `[LENGTH=${length}]`,
        mode === 'REVISION_NOTES' ? `[FOCUS=${focus.join(', ')}]` : '',
        instruction.trim() ? `[EDITOR_INSTRUCTION]\n${instruction.trim()}` : '',
        `[SOURCE_CONTENT]\n${sourceText}`,
      ].filter(Boolean).join('\n\n')
      const response = await fetch('/api/v1/mastero/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-request-id': crypto.randomUUID() }, body: JSON.stringify({ materialId, action, selectedBlockId: mode === 'STUDY_MATERIAL' ? selectedBlockId : undefined, instruction: sourceContext }) })
      const payload = await response.json() as MasteroGenerateApiResponse | MasteroApiErrorResponse
      if (!response.ok || !('result' in payload)) throw new Error('error' in payload ? payload.error.message : 'Mastero could not generate content.')
      setGenerated(payload.result)
      setEditableBlocks(payload.result.blocks)
      setQuality(analyzeMasteroOutput(sourceText, payload.result.blocks))
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Mastero could not generate content.')
    } finally {
      setLoading(false)
    }
  }

  const reject = () => {
    setGenerated(null)
    setEditableBlocks([])
    setQuality(null)
    setError(null)
  }

  const accept = () => {
    if (!materialId || !generated || !previewDocument || 'error' in previewDocument) return
    const result = { ...generated, blocks: previewDocument.blocks }
    onApply(result, selectedBlockId)
    setGenerated(null)
    setEditableBlocks([])
    setQuality(null)
    setError(null)
  }

  const applySafeContent = () => {
    if (!materialId || !generated || !previewDocument || 'error' in previewDocument || !quality) return
    const warnedIds = new Set(quality.unsupportedClaimDetails.map((detail) => detail.blockId))
    const safeIds = new Set(quality.claimResults.filter((claim) => (claim.classification === 'SUPPORTED' || claim.classification === 'PARAPHRASE') && !warnedIds.has(claim.blockId)).map((claim) => claim.blockId))
    const safeBlocks = previewDocument.blocks.filter((block) => safeIds.has(block.id))
    if (!safeBlocks.length) {
      setError('No generated blocks passed the source-fidelity check. Review the warnings before applying content.')
      return
    }
    onApply({ ...generated, blocks: safeBlocks }, selectedBlockId)
    setGenerated(null)
    setEditableBlocks([])
    setQuality(null)
    setError(null)
  }

  return (
    <section className="space-y-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm" aria-label="Mastero assistant">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">AeroPrep internal tool</div>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Mastero AI</h2>
        <p className="mt-1 text-sm text-slate-600">Create source-faithful structured content for editorial review.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Mastero content modes">
        <button type="button" role="tab" aria-selected={mode === 'STUDY_MATERIAL'} onClick={() => setMode('STUDY_MATERIAL')} className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === 'STUDY_MATERIAL' ? 'bg-slate-900 text-white' : 'border border-amber-200 bg-white text-slate-700'}`}>📘 Study Material</button>
        <button type="button" role="tab" aria-selected={mode === 'REVISION_NOTES'} onClick={() => setMode('REVISION_NOTES')} className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === 'REVISION_NOTES' ? 'bg-slate-900 text-white' : 'border border-amber-200 bg-white text-slate-700'}`}>📝 Revision Notes</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Title</span>
          <input className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2" value={document.title} readOnly />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Source</span>
          <input className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2" value={document.metadata.status} readOnly />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Source Content</span>
        <textarea className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" rows={10} value={rawContent} onChange={(event) => setRawContent(event.target.value)} placeholder="Paste your study material, notes, textbook content, or draft explanation here..." disabled={loading} />
      </label>

      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Mastero instruction <span className="font-normal text-slate-500">(optional)</span></span>
        <textarea className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" rows={4} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Make this suitable for AME students. Keep the technical meaning unchanged. Use clear headings and exam-focused explanations." disabled={loading} />
      </label>

      {mode === 'STUDY_MATERIAL' ? (
        <label className="block max-w-md space-y-1 text-sm font-medium text-slate-700">
          <span>Depth</span>
          <select className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2" value={depth} onChange={(event) => setDepth(event.target.value as StudyDepth)} disabled={loading}>
            <option>Standard</option><option>Detailed</option><option>Comprehensive</option>
          </select>
        </label>
      ) : (
        <div className="space-y-4">
          <label className="block max-w-md space-y-1 text-sm font-medium text-slate-700">
            <span>Length</span>
            <select className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2" value={length} onChange={(event) => setLength(event.target.value as RevisionLength)} disabled={loading}>
              <option>Short</option><option>Standard</option><option>Detailed</option>
            </select>
          </label>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">Focus</legend>
            {revisionFocusOptions.map((item) => <label key={item} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={focus.includes(item)} onChange={(event) => setFocus((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} disabled={loading} />{item}</label>)}
          </fieldset>
        </div>
      )}

      <button type="button" onClick={generate} disabled={!materialId || loading || (!rawContent.trim() && !(activePage?.blocks.length ?? 0))} className="w-full rounded-lg bg-amber-700 px-3 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Generating...' : mode === 'STUDY_MATERIAL' ? '✨ Generate Study Material' : '✨ Generate Revision Notes'}
      </button>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div> : null}

      {generated ? (
        <div className="space-y-3 border-t border-amber-200 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">Mastero generated {mode === 'STUDY_MATERIAL' ? 'study material' : 'revision notes'}</h3>
            <span className="text-xs font-medium text-slate-500">Not saved</span>
          </div>
          <p className="text-xs text-slate-600">Source blocks: {generated.sourceBlockIds.length ? generated.sourceBlockIds.join(', ') : 'current document context'}</p>
          {quality ? <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-semibold text-slate-900">Mastero Quality Review</h4><div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2"><span>Source fidelity: <strong>{quality.sourceFidelity.score}/100</strong></span><span>Source coverage: <strong>{quality.sourceCoverage}</strong></span><span>Structure: <strong>{quality.structure}</strong></span><span>Grammar: <strong>{quality.grammar}</strong></span><span>Supported/paraphrased: <strong>{quality.sourceFidelity.supportedClaims + quality.sourceFidelity.paraphrasedClaims}</strong></span><span>Unsupported/uncertain: <strong>{quality.sourceFidelity.unsupportedClaims + quality.sourceFidelity.uncertainClaims}</strong></span></div>{quality.warnings.length ? <ul className="mt-3 space-y-1 text-sm text-amber-800">{quality.warnings.map((warning) => <li key={warning}>⚠ Needs Verification: {warning}</li>)}</ul> : <p className="mt-3 text-sm text-emerald-700">No local quality warnings detected. Human review is still required.</p>}</div> : null}
          {previewDocument && 'error' in previewDocument ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{previewDocument.error}</div> : null}
          <div className="space-y-3">
            {editableBlocks.map((block, index) => <StudyMaterialBlockEditor key={block.id} block={block} onChange={(nextBlock) => setEditableBlocks((current) => current.map((item, itemIndex) => itemIndex === index ? nextBlock : item))} onRemove={() => setEditableBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index))} onMove={(direction) => setEditableBlocks((current) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= current.length) return current; const next = [...current]; const [moved] = next.splice(index, 1); next.splice(nextIndex, 0, moved); return next })} canMoveUp={index > 0} canMoveDown={index < editableBlocks.length - 1} />)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={applySafeContent} disabled={!previewDocument || 'error' in previewDocument || !quality} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply Safe Content</button>
            <button type="button" onClick={accept} disabled={!previewDocument || 'error' in previewDocument} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply to Editor</button>
            <button type="button" onClick={() => previewDocument && !('error' in previewDocument) && setEditableBlocks(previewDocument.blocks)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Review</button>
            <button type="button" onClick={reject} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Reject</button>
            <button type="button" onClick={generate} disabled={loading} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50">Generate Again</button>
          </div>
        </div>
      ) : null}
    </section>
  )
}