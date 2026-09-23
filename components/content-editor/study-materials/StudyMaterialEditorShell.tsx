"use client"

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createEmptyStudyPage, normalizeStudyMaterialDocument, studyMaterialPageTypes, type StudyMaterialBlock, type StudyMaterialDocument, type StudyMaterialPage, type StudyMaterialPageType } from '@/lib/study-material/document-schema'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { convertTextDocumentToStudyMaterial } from '@/lib/study-material/text-document-converter'
import { extractTextFromStudyMaterialFile, supportedStudyMaterialImportExtensions } from '@/lib/study-material/document-import'
import { saveStudyMaterialDraftAction } from '@/server/actions/study-material-editorial.actions'
import { StudyMaterialBlockEditor } from './StudyMaterialBlockEditor'

interface StudyMaterialEditorShellProps {
  initialDoc?: StudyMaterialDocument
  resourceId?: string
  basicInformation?: {
    course?: string
    module?: string
    lesson?: string
    source?: string
  }
}

interface ImportPreviewState {
  sourceName: string
  sourceType: string
  sourcePageCount?: number
  characterCount: number
  paragraphCount: number
  headingCount: number
  listCount: number
  tableCount: number
  sourceText: string
  document: StudyMaterialDocument
}

type UploadStatus = 'IDLE' | 'EXTRACTING' | 'READY_FOR_PREVIEW' | 'ERROR'

const createPageId = () => `page-${Date.now()}-${Math.random().toString(16).slice(2)}`

const getDetectedImportType = (fileName: string, mime: string): string => {
  const normalizedName = fileName.toLowerCase()
  const normalizedMime = mime.toLowerCase()

  if (normalizedName.endsWith('.txt') || normalizedMime.includes('text/plain')) return 'TXT'
  if (normalizedName.endsWith('.docx') || normalizedMime.includes('wordprocessingml') || normalizedMime.includes('docx')) return 'DOCX'
  if (normalizedName.endsWith('.pdf') || normalizedMime.includes('pdf')) return 'PDF'
  return 'TEXT'
}

const getImportStats = (sourceText: string) => {
  const normalized = sourceText.replace(/\r\n?/g, '\n').trim()
  const paragraphs = normalized ? normalized.split(/\n\s*\n/).filter((block) => block.trim().length > 0).length : 0
  const headings = normalized ? (normalized.match(/^#{1,6}\s+/gm) ?? []).length : 0
  const listItems = normalized ? (normalized.match(/^(?:[-*]|\d+[.)])\s+/gm) ?? []).length : 0
  const tableRows = normalized ? normalized.split(/\n/).filter((line) => line.includes('|')).length : 0

  return {
    characterCount: normalized.length,
    paragraphCount: paragraphs,
    headingCount: headings,
    listCount: listItems,
    tableCount: tableRows,
  }
}

export function StudyMaterialEditorShell({ initialDoc, resourceId, basicInformation }: StudyMaterialEditorShellProps) {
  const [mode, setMode] = useState<'manual' | 'convert'>('manual')
  const [document, setDocument] = useState<StudyMaterialDocument>(() => normalizeStudyMaterialDocument(initialDoc ?? defaultAeroPrepStudyDocument('New study material')))
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(document.pages[0]?.blocks[0]?.id)
  const [showPageMenu, setShowPageMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceText, setSourceText] = useState('')
  const sourceTextRef = useRef(sourceText)
  const [sourceName, setSourceName] = useState('')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('IDLE')
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null)
  const uploadRequestIdRef = useRef(0)

  const pages = useMemo(() => document.pages.length ? document.pages : [createEmptyStudyPage(1, 'CONTENT')], [document.pages])
  const activePage = pages[activePageIndex] ?? pages[0]
  const activeBlocks = activePage?.blocks ?? []

  const handlePageSelect = (nextIndex: number) => {
    setActivePageIndex(nextIndex)
    const nextPage = pages[nextIndex] ?? pages[0]
    const nextSelected = nextPage?.blocks[0]?.id
    setSelectedBlockId(nextSelected)
  }
  const information = [
    ['Course', basicInformation?.course ?? 'Not linked'],
    ['Module', basicInformation?.module ?? document.metadata.moduleId ?? 'Not linked'],
    ['Lesson', basicInformation?.lesson ?? document.metadata.lessonId ?? 'Not linked'],
    ['Source', basicInformation?.source ?? 'Study material'],
  ]

  const patchDocument = (updater: (current: StudyMaterialDocument) => StudyMaterialDocument) => {
    setDocument((current) => normalizeStudyMaterialDocument(updater(current)))
  }

  const addBlock = (type: StudyMaterialBlock['type']) => {
    const newBlock = (() => {
      const id = `${type}-${createPageId()}`
      switch (type) {
        case 'heading':
          return { id, type: 'heading', level: 2, text: 'New heading' }
        case 'paragraph':
          return { id, type: 'paragraph', children: [{ text: 'New paragraph', format: [] }] }
        case 'list':
          return { id, type: 'list', listType: 'bullet', items: ['List item'] }
        case 'table':
          return { id, type: 'table', headers: ['Column 1', 'Column 2'], rows: [['Value 1', 'Value 2']] }
        case 'image':
          return { id, type: 'image', mediaId: '', altText: '', alignment: 'center' }
        case 'callout':
          return { id, type: 'callout', variant: 'important', title: 'Important', text: 'Content goes here.' }
        case 'definition':
          return { id, type: 'definition', term: 'Term', definition: 'Definition goes here.' }
        case 'example':
          return { id, type: 'example', title: 'Example', content: 'Example content' }
        case 'examTip':
          return { id, type: 'examTip', text: 'Exam tip goes here.' }
        case 'link':
          return { id, type: 'link', text: 'Reference link', url: 'https://example.com', openInNewTab: true }
        default:
          return { id, type: 'paragraph', children: [{ text: 'New paragraph', format: [] }] }
      }
    })()

    patchDocument((current) => {
      const next = normalizeStudyMaterialDocument(current)
      const nextPages = next.pages.map((page, index) => index === activePageIndex ? { ...page, blocks: [...page.blocks, newBlock as StudyMaterialBlock] } : page)
      return { ...next, pages: nextPages, blocks: nextPages.flatMap((page) => page.blocks) }
    })
  }

  const updateBlock = (index: number, block: StudyMaterialBlock) => patchDocument((current) => {
    const next = normalizeStudyMaterialDocument(current)
    const page = next.pages[activePageIndex] ?? next.pages[0]
    const nextBlocks = page.blocks.map((item, itemIndex) => itemIndex === index ? block : item)
    const nextPages = next.pages.map((item, itemIndex) => itemIndex === activePageIndex ? { ...item, blocks: nextBlocks } : item)
    return { ...next, pages: nextPages, blocks: nextPages.flatMap((pageItem) => pageItem.blocks) }
  })

  const removeBlock = (index: number) => patchDocument((current) => {
    const next = normalizeStudyMaterialDocument(current)
    const page = next.pages[activePageIndex] ?? next.pages[0]
    const nextBlocks = page.blocks.filter((_, itemIndex) => itemIndex !== index)
    const nextPages = next.pages.map((item, itemIndex) => itemIndex === activePageIndex ? { ...item, blocks: nextBlocks } : item)
    return { ...next, pages: nextPages, blocks: nextPages.flatMap((pageItem) => pageItem.blocks) }
  })

  const moveBlock = (index: number, direction: -1 | 1) => patchDocument((current) => {
    const next = normalizeStudyMaterialDocument(current)
    const page = next.pages[activePageIndex] ?? next.pages[0]
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= page.blocks.length) return next
    const nextBlocks = [...page.blocks]
    const [moved] = nextBlocks.splice(index, 1)
    nextBlocks.splice(nextIndex, 0, moved)
    const nextPages = next.pages.map((item, itemIndex) => itemIndex === activePageIndex ? { ...item, blocks: nextBlocks } : item)
    return { ...next, pages: nextPages, blocks: nextPages.flatMap((pageItem) => pageItem.blocks) }
  })

  const addPage = (pageType: StudyMaterialPageType = 'CONTENT') => {
    const nextPageNumber = pages.length + 1
    const newPage = { ...createEmptyStudyPage(nextPageNumber, pageType), id: createPageId() }
    setDocument((current) => {
      const normalized = normalizeStudyMaterialDocument(current)
      const nextPages = [...normalized.pages, newPage]
      const doc = { ...normalized, pages: nextPages, blocks: nextPages.flatMap((page) => page.blocks) }
      return normalizeStudyMaterialDocument(doc)
    })
    setActivePageIndex(pages.length)
    setShowPageMenu(false)
  }

  const duplicatePage = (index: number) => {
    const pageToDuplicate = pages[index]
    if (!pageToDuplicate) return
    const duplicatedBlocks = pageToDuplicate.blocks.map((block) => ({ ...block, id: `${block.type}-${createPageId()}` }))
    const nextPage = { ...pageToDuplicate, id: createPageId(), pageNumber: index + 2, title: pageToDuplicate.title, blocks: duplicatedBlocks }
    setDocument((current) => {
      const normalized = normalizeStudyMaterialDocument(current)
      const pagesWithDuplicate = [...normalized.pages]
      pagesWithDuplicate.splice(index + 1, 0, nextPage)
      const recalc = pagesWithDuplicate.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1, blocks: page.blocks }))
      return normalizeStudyMaterialDocument({ ...normalized, pages: recalc, blocks: recalc.flatMap((page) => page.blocks) })
    })
    setActivePageIndex(index + 1)
  }

  const deletePage = (index: number) => {
    if (pages.length === 1) {
      const confirmDelete = window.confirm('This is the last page. Keep an empty Page 1 instead?')
      if (!confirmDelete) return
      setDocument((current) => {
        const normalized = normalizeStudyMaterialDocument(current)
        const emptyPage = { ...createEmptyStudyPage(1, 'CONTENT', ''), id: createPageId() }
        return normalizeStudyMaterialDocument({ ...normalized, pages: [emptyPage], blocks: emptyPage.blocks })
      })
      setActivePageIndex(0)
      return
    }

    if (pages[index]?.blocks.length > 0 && !window.confirm('Delete this page and its content?')) return

    setDocument((current) => {
      const normalized = normalizeStudyMaterialDocument(current)
      const nextPages = normalized.pages.filter((_, pageIndex) => pageIndex !== index)
      const recalc = nextPages.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 }))
      return normalizeStudyMaterialDocument({ ...normalized, pages: recalc, blocks: recalc.flatMap((page) => page.blocks) })
    })
    setActivePageIndex((currentIndex) => Math.min(currentIndex, pages.length - 2))
  }

  const reorderPage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= pages.length) return
    setDocument((current) => {
      const normalized = normalizeStudyMaterialDocument(current)
      const reordered = [...normalized.pages]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(nextIndex, 0, moved)
      const recalc = reordered.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 }))
      return normalizeStudyMaterialDocument({ ...normalized, pages: recalc, blocks: recalc.flatMap((page) => page.blocks) })
    })
    setActivePageIndex((currentIndex) => currentIndex + direction)
  }

  const saveDraft = async () => {
    if (!resourceId) return
    setSaving(true)
    setError(null)
    try {
      const sanitized = normalizeStudyMaterialDocument(document)
      await saveStudyMaterialDraftAction(resourceId, sanitized)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save draft.')
    } finally {
      setSaving(false)
    }
  }

  const openImportPreview = (nextSourceText: string, nextSourceName: string, nextSourceType: string, detectedPageCount?: number) => {
    const trimmedText = nextSourceText.trim()
    if (!trimmedText) {
      setUploadStatus('ERROR')
      setError('Source text is required.')
      return
    }

    try {
      const converted = convertTextDocumentToStudyMaterial(trimmedText, document)
      const stats = getImportStats(trimmedText)
      setMode('manual')
      setImportPreview({
        sourceName: nextSourceName || 'Pasted text',
        sourceType: nextSourceType,
        sourcePageCount: detectedPageCount,
        sourceText: nextSourceText,
        document: normalizeStudyMaterialDocument(converted),
        ...stats,
      })
      setUploadStatus('READY_FOR_PREVIEW')
      setSourceName(nextSourceName)
      sourceTextRef.current = nextSourceText
      setSourceText(nextSourceText)
      setError(null)
    } catch (conversionError) {
      setUploadStatus('ERROR')
      setError(conversionError instanceof Error ? conversionError.message : 'Unable to convert source text.')
    }
  }

  const convertSourceText = () => {
    const liveSourceText = (sourceTextRef.current || sourceText).trim()
    if (!liveSourceText) {
      setError('Source text is required.')
      return
    }

    openImportPreview(liveSourceText, sourceName || 'Pasted text', 'TXT')
  }

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const requestId = uploadRequestIdRef.current + 1
    uploadRequestIdRef.current = requestId

    setError(null)
    setImportPreview(null)
    setSourceText('')
    sourceTextRef.current = ''
    setSourceName(file.name)
    setUploadStatus('EXTRACTING')
    setMode('convert')

    try {
      const extractedText = await extractTextFromStudyMaterialFile(file)
      if (requestId !== uploadRequestIdRef.current) return

      const detectedType = getDetectedImportType(file.name, file.type)
      setSourceText(extractedText)
      sourceTextRef.current = extractedText
      openImportPreview(extractedText, file.name, detectedType)
    } catch (importError) {
      if (requestId !== uploadRequestIdRef.current) return

      const message = importError instanceof Error ? importError.message : 'Unable to import the selected file.'
      setUploadStatus('ERROR')
      setSourceText('')
      sourceTextRef.current = ''
      setSourceName('')
      setImportPreview(null)
      setError(message)
    } finally {
      event.target.value = ''
    }
  }

  const updateImportPreviewPage = (index: number, updater: (page: StudyMaterialPage) => StudyMaterialPage) => {
    setImportPreview((current) => {
      if (!current) return current
      const nextPages = current.document.pages.map((page, pageIndex) => pageIndex === index ? updater(page) : page)
      return {
        ...current,
        document: normalizeStudyMaterialDocument({ ...current.document, pages: nextPages, blocks: nextPages.flatMap((page) => page.blocks) }),
      }
    })
  }

  const reorderImportPreviewPage = (index: number, direction: -1 | 1) => {
    setImportPreview((current) => {
      if (!current) return current
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.document.pages.length) return current
      const nextPages = [...current.document.pages]
      const [moved] = nextPages.splice(index, 1)
      nextPages.splice(nextIndex, 0, moved)
      return {
        ...current,
        document: normalizeStudyMaterialDocument({ ...current.document, pages: nextPages.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 })), blocks: nextPages.flatMap((page) => page.blocks) }),
      }
    })
  }

  const deleteImportPreviewPage = (index: number) => {
    setImportPreview((current) => {
      if (!current) return current
      if (current.document.pages.length === 1) return current
      const nextPages = current.document.pages.filter((_, pageIndex) => pageIndex !== index)
      const normalized = normalizeStudyMaterialDocument({ ...current.document, pages: nextPages.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 })), blocks: nextPages.flatMap((page) => page.blocks) })
      return { ...current, document: normalized }
    })
  }

  const addImportPreviewPage = () => {
    setImportPreview((current) => {
      if (!current) return current
      const nextPage = { ...createEmptyStudyPage(current.document.pages.length + 1, 'CONTENT', `Page ${current.document.pages.length + 1}`), id: createPageId() }
      const nextPages = [...current.document.pages, nextPage]
      return { ...current, document: normalizeStudyMaterialDocument({ ...current.document, pages: nextPages.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 })), blocks: nextPages.flatMap((page) => page.blocks) }) }
    })
  }

  const handleCreateEditableMaterial = () => {
    if (!importPreview) return
    const nextDocument = normalizeStudyMaterialDocument(importPreview.document)
    setDocument(nextDocument)
    setActivePageIndex(0)
    setSelectedBlockId(nextDocument.pages[0]?.blocks[0]?.id)
    setImportPreview(null)
    sourceTextRef.current = ''
    setSourceText('')
    setSourceName('')
    setMode('manual')
    setError(null)
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Study material workspace</div>
        <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Study material editing modes">
          <button type="button" role="tab" aria-selected={mode === 'manual'} onClick={() => setMode('manual')} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === 'manual' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
            ✍ Manual
          </button>
          <button type="button" role="tab" aria-selected={mode === 'convert'} onClick={() => setMode('convert')} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === 'convert' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
            📄 Convert Text Document
          </button>
        </div>
      </div>

      {importPreview ? (
        <section className="space-y-6" aria-label="Import preview workspace">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Import Preview</div>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Review extracted content before editing</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setImportPreview(null); setMode('convert'); setError(null) }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
                <button type="button" onClick={() => { sourceTextRef.current = ''; setSourceText(''); setSourceName(''); setImportPreview(null); setMode('convert'); setError(null) }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel Import</button>
                <button type="button" onClick={handleCreateEditableMaterial} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Create Editable Material</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Source file</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div><span className="font-semibold">Name:</span> {importPreview.sourceName}</div>
                  <div><span className="font-semibold">Detected type:</span> {importPreview.sourceType}</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Extraction summary</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  {typeof importPreview.sourcePageCount === 'number' ? <div><span className="font-semibold">Source pages:</span> {importPreview.sourcePageCount}</div> : null}
                  <div><span className="font-semibold">Characters:</span> {importPreview.characterCount}</div>
                  <div><span className="font-semibold">Paragraphs:</span> {importPreview.paragraphCount}</div>
                  <div><span className="font-semibold">Headings:</span> {importPreview.headingCount}</div>
                  <div><span className="font-semibold">Lists:</span> {importPreview.listCount}</div>
                  <div><span className="font-semibold">Tables:</span> {importPreview.tableCount}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Extracted source</div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{importPreview.sourceText}</pre>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Proposed structure</div>
                  <button type="button" onClick={addImportPreviewPage} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">+ Add page</button>
                </div>
                <div className="space-y-3">
                  {importPreview.document.pages.map((page, index) => (
                    <div key={page.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">Page {page.pageNumber}</div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => reorderImportPreviewPage(index, -1)} disabled={index === 0} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:opacity-40">↑</button>
                          <button type="button" onClick={() => reorderImportPreviewPage(index, 1)} disabled={index === importPreview.document.pages.length - 1} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:opacity-40">↓</button>
                          <button type="button" onClick={() => deleteImportPreviewPage(index)} disabled={importPreview.document.pages.length === 1} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:opacity-40">Delete</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">
                          <span>Page type</span>
                          <select value={page.pageType} onChange={(event) => updateImportPreviewPage(index, (currentPage) => ({ ...currentPage, pageType: event.target.value as StudyMaterialPageType }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm">
                            {studyMaterialPageTypes.map((pageType) => <option key={pageType} value={pageType}>{pageType.replace('_', ' ')}</option>)}
                          </select>
                        </label>

                        <label className="block text-xs font-medium text-slate-700">
                          <span>{index === 0 ? 'Page title' : `Page ${page.pageNumber} title`}</span>
                          <input aria-label={index === 0 ? 'Page title' : `Page ${page.pageNumber} title`} value={page.title} onChange={(event) => updateImportPreviewPage(index, (currentPage) => ({ ...currentPage, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm" />
                        </label>

                        <div className="text-xs text-slate-600">
                          {page.pageType} · {page.title || 'Untitled'} · {page.blocks.length} blocks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : mode === 'manual' ? (
        <section className="space-y-6" aria-label="Manual editor workspace">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 border-b border-slate-200 pb-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Basic information</div>
              <input value={document.title} onChange={(event) => setDocument((current) => normalizeStudyMaterialDocument({ ...current, title: event.target.value }))} className="w-full text-2xl font-semibold text-slate-900 outline-none" placeholder="Study material title" />
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {information.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div><div className="mt-1 truncate text-sm font-medium text-slate-800">{value}</div></div>)}
            </div>

            <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Pages</h3>
                  <button type="button" onClick={() => setShowPageMenu((value) => !value)} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white">+ Add Page</button>
                </div>

                {showPageMenu ? (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Add New Page</div>
                    <div className="space-y-2">
                      {studyMaterialPageTypes.map((pageType) => (
                        <button key={pageType} type="button" onClick={() => addPage(pageType)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-left text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700">
                          {pageType.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {pages.map((page, index) => (
                    <div key={page.id} className={`rounded-xl border p-3 transition ${index === activePageIndex ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                      <button type="button" onClick={() => handlePageSelect(index)} className="w-full text-left">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Page {page.pageNumber}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{page.title || page.pageType.replace('_', ' ').toLowerCase()}</div>
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => duplicatePage(index)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700">Duplicate</button>
                        <button type="button" onClick={() => deletePage(index)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700">Delete</button>
                        <button type="button" onClick={() => reorderPage(index, -1)} disabled={index === 0} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">↑</button>
                        <button type="button" onClick={() => reorderPage(index, 1)} disabled={index === pages.length - 1} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Page {activePage?.pageNumber ?? 1} / {pages.length}</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">{activePage?.title || 'Untitled page'}</div>
                  </div>
                  <label className="block w-full max-w-xs space-y-1 text-sm font-medium text-slate-700">
                    <span>Page type</span>
                    <select value={activePage?.pageType ?? 'CONTENT'} onChange={(event) => setDocument((current) => {
                      const normalized = normalizeStudyMaterialDocument(current)
                      const nextPages = normalized.pages.map((page, index) => index === activePageIndex ? { ...page, pageType: event.target.value as StudyMaterialPageType } : page)
                      return normalizeStudyMaterialDocument({ ...normalized, pages: nextPages, blocks: nextPages.flatMap((page) => page.blocks) })
                    })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
                      {studyMaterialPageTypes.map((pageType) => <option key={pageType} value={pageType}>{pageType.replace('_', ' ')}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mb-4 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    <span>Page title</span>
                    <input value={activePage?.title ?? ''} onChange={(event) => setDocument((current) => {
                      const normalized = normalizeStudyMaterialDocument(current)
                      const nextPages = normalized.pages.map((page, index) => index === activePageIndex ? { ...page, title: event.target.value } : page)
                      return normalizeStudyMaterialDocument({ ...normalized, pages: nextPages, blocks: nextPages.flatMap((page) => page.blocks) })
                    })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Optional page title" />
                  </label>
                </div>

                <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {['heading','paragraph','list','table','image','callout','definition','example','examTip','link'].map((type) => (
                    <button key={type} type="button" onClick={() => addBlock(type as StudyMaterialBlock['type'])} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                      + {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {activeBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">This page is empty. Add a block to start building the page.</div>
                  ) : activeBlocks.map((block, index) => (
                    <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={selectedBlockId === block.id ? 'rounded-xl ring-2 ring-amber-400' : ''}>
                      <StudyMaterialBlockEditor block={block} onChange={(nextBlock) => updateBlock(index, nextBlock)} onRemove={() => removeBlock(index)} onMove={(direction) => moveBlock(index, direction)} canMoveUp={index > 0} canMoveDown={index < activeBlocks.length - 1} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6" aria-label="Convert text document workspace">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Convert text document</div>
            <p className="mb-4 text-sm text-slate-600">Convert a text document into an editable AeroPrep study material.</p>
            <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Your source content will be converted into editable AeroPrep pages. No new technical content will be generated.</p>
            <div className="space-y-4">
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                <span>Upload or select document</span>
                <input type="file" accept={supportedStudyMaterialImportExtensions.join(',')} onChange={handleFileImport} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
              </label>
              <p className="text-xs text-slate-500">Supported: {supportedStudyMaterialImportExtensions.join(', ')}</p>
              {uploadStatus === 'EXTRACTING' ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700" role="status">Extracting file…</p> : null}
              {uploadStatus === 'ERROR' && error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              {sourceName ? <p className="text-xs text-slate-500">Source: {sourceName}</p> : null}
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                <span>Paste text</span>
                <textarea value={sourceText} onChange={(event) => { const nextText = event.target.value; sourceTextRef.current = nextText; setSourceText(nextText); setSourceName(''); setUploadStatus('IDLE'); setError(null) }} rows={12} placeholder="Paste plain text, Markdown headings, lists, or simple pipe-separated tables here." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={convertSourceText} disabled={!sourceText.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Convert</button>
                <button type="button" onClick={() => { sourceTextRef.current = ''; setSourceText(''); setSourceName(''); setUploadStatus('IDLE'); setError(null); setMode('manual') }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6" aria-label="Review and publish">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review &amp; Publish</div>
          <p className="mt-1 text-sm text-slate-600">Save your current editor state before using workflow actions.</p>
        </div>
        <button type="button" onClick={saveDraft} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={saving || !resourceId}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
      </section>
    </div>
  )
}
