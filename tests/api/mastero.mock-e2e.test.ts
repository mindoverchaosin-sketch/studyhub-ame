import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { MockMasteroProvider } from '@/tests/test-utils/mock-mastero-provider'

const { requirePermission, resourceRepository, moduleRepository, lessonRepository, auditRepository } = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  resourceRepository: { findById: vi.fn(), update: vi.fn() },
  moduleRepository: { findById: vi.fn() },
  lessonRepository: { findById: vi.fn() },
  auditRepository: { recordEvent: vi.fn() },
}))
const { workflowRepository, getWorkflow, createSnapshot } = vi.hoisted(() => ({
  workflowRepository: { update: vi.fn() },
  getWorkflow: vi.fn().mockResolvedValue({ status: 'DRAFT', currentVersion: 1, versions: [], reviewQueue: [] }),
  createSnapshot: vi.fn().mockResolvedValue({ version: 2 }),
}))

vi.mock('@/auth', () => ({ requirePermission }))
vi.mock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
vi.mock('@/server/repositories/module.repository', () => ({ moduleRepository }))
vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository }))
vi.mock('@/server/repositories/audit.repository', () => ({ auditRepository }))
vi.mock('@/server/repositories/editorial-workflow.repository', () => ({ editorialWorkflowRepository: workflowRepository }))
vi.mock('@/server/services/editorial-workflow.service', () => ({ getStudyMaterialEditorialWorkflow: getWorkflow, createVersionSnapshotForTarget: createSnapshot }))
vi.mock('@/server/services/publishing.service', () => ({ publishingService: { submitForReview: vi.fn(), approve: vi.fn(), publish: vi.fn() } }))
vi.mock('@/server/services/mastero-config', () => ({ masteroConfig: { provider: 'openai', openaiModel: 'test-only', openaiApiKey: undefined } }))
vi.mock('@/server/services/mastero.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/services/mastero.service')>()
  const service = new actual.MasteroService({ provider: new MockMasteroProvider(), resourceRepository, moduleRepository, lessonRepository, auditRepository })
  return { ...actual, masteroService: service }
})

import { POST } from '@/app/api/v1/mastero/generate/route'

const sourceBlock = { id: 'source-1', type: 'paragraph' as const, children: [{ text: 'Aircraft materials introduction', format: [] }] }
const document = {
  ...defaultAeroPrepStudyDocument('Aircraft Materials - Introduction'),
  pages: [{ ...defaultAeroPrepStudyDocument('Aircraft Materials - Introduction').pages[0], blocks: [sourceBlock] }],
  blocks: [sourceBlock],
}

function apiRequest() {
  return new NextRequest('http://localhost/api/v1/mastero/generate', { method: 'POST', headers: { 'content-type': 'application/json', 'x-request-id': 'mock-e2e-1' }, body: JSON.stringify({ materialId: 'aircraft-materials-introduction', action: 'GENERATE_EXPLANATION', selectedBlockId: 'source-1', instruction: 'Explain this for exam preparation.' }) })
}

describe('Mastero mock provider end-to-end API flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resourceRepository.findById.mockResolvedValue({ id: 'aircraft-materials-introduction', title: 'Aircraft Materials - Introduction', moduleId: 'module-materials', lessonId: 'lesson-materials', materialType: 'ARTICLE', sourceType: 'AEROPREP_DOC', documentContent: document, status: 'DRAFT', isPremium: false })
    moduleRepository.findById.mockResolvedValue({ id: 'module-materials', title: 'Materials', slug: 'materials' })
    lessonRepository.findById.mockResolvedValue({ id: 'lesson-materials', title: 'Introduction', slug: 'introduction' })
    auditRepository.recordEvent.mockResolvedValue(undefined)
    requirePermission.mockResolvedValue({ user: { id: 'content-editor-1', role: 'CONTENT_EDITOR' } })
  })

  it('runs authentication, authorization, context resolution, mock generation, validation, sanitization, and audit', async () => {
    const response = await POST(apiRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result.blocks[0].id).toBe('mock-explanation-1')
    expect(body.review).toEqual({ persisted: false, workflowChanged: false, requiresHumanReview: true })
    expect(requirePermission).toHaveBeenCalledWith('manageResources')
    expect(resourceRepository.update).not.toHaveBeenCalled()
    expect(auditRepository.recordEvent.mock.calls.map(([event]) => event.action)).toEqual(['mastero.generation.started', 'mastero.generation.succeeded'])
  })

  it('rejects malformed mock output through the same local validation pipeline', async () => {
    const serviceModule = await import('@/server/services/mastero.service')
    const malformedService = new serviceModule.MasteroService({ provider: new MockMasteroProvider(true), resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(malformedService.generate('content-editor-1', { materialId: 'aircraft-materials-introduction', action: 'GENERATE_EXPLANATION', selectedBlockId: 'source-1' })).rejects.toThrow()
    expect(auditRepository.recordEvent.mock.calls.map(([event]) => event.action)).toContain('mastero.generation.failed')
    expect(resourceRepository.update).not.toHaveBeenCalled()
  })

  it('persists accepted blocks only through Save Draft and leaves workflow state unchanged', async () => {
    const serviceModule = await import('@/server/services/study-material-document.service')
    const explanationBlock = { id: 'mock-explanation-1', type: 'paragraph' as const, children: [{ text: 'Mock explanation for Aircraft Materials - Introduction', format: [] }] }
    const acceptedDocument = {
      ...document,
      pages: [{ ...document.pages[0], blocks: [...document.pages[0].blocks, explanationBlock] }],
      blocks: [...document.blocks, explanationBlock],
    }
    await new serviceModule.StudyMaterialDocumentService().saveDraft('aircraft-materials-introduction', acceptedDocument)

    expect(resourceRepository.update).toHaveBeenCalledWith('aircraft-materials-introduction', expect.objectContaining({ documentContent: acceptedDocument, status: 'DRAFT' }))
    expect(getWorkflow).toHaveBeenCalledWith('aircraft-materials-introduction')
    expect(workflowRepository.update).not.toHaveBeenCalled()
    expect(resourceRepository.update.mock.calls[0][1]).not.toHaveProperty('publishedAt')
  })
})