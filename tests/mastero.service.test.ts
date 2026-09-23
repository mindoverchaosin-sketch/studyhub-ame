import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { applyMasteroResult, type MasteroGenerationRequest } from '@/types/mastero'
import { MasteroProviderError, MasteroProviderNotConfiguredError } from '@/server/services/mastero-provider'

const { resourceRepository, moduleRepository, lessonRepository, auditRepository } = vi.hoisted(() => ({
  resourceRepository: { findById: vi.fn() },
  moduleRepository: { findById: vi.fn() },
  lessonRepository: { findById: vi.fn() },
  auditRepository: { recordEvent: vi.fn() },
}))

vi.mock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
vi.mock('@/server/repositories/module.repository', () => ({ moduleRepository }))
vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository }))
vi.mock('@/server/repositories/audit.repository', () => ({ auditRepository }))

import { MasteroService, resolveGenerationTarget } from '@/server/services/mastero.service'

const baseDocument = defaultAeroPrepStudyDocument('Flight controls')
const request: MasteroGenerationRequest = { materialId: 'material-1', action: 'GENERATE_EXPLANATION', selectedBlockId: 'paragraph-1', instruction: 'Use concise language.' }

function setupResource(document = { ...baseDocument, blocks: [{ id: 'paragraph-1', type: 'paragraph' as const, children: [{ text: 'Current content', format: [] }] }] }) {
  resourceRepository.findById.mockResolvedValue({ id: 'material-1', title: 'Flight controls', moduleId: 'module-1', lessonId: 'lesson-1', materialType: 'ARTICLE', sourceType: 'AEROPREP_DOC', documentContent: document, status: 'DRAFT', isPremium: false })
  moduleRepository.findById.mockResolvedValue({ id: 'module-1', title: 'Airframes', slug: 'airframes' })
  lessonRepository.findById.mockResolvedValue({ id: 'lesson-1', title: 'Control surfaces', slug: 'control-surfaces' })
  auditRepository.recordEvent.mockResolvedValue(undefined)
}

describe('MasteroService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupResource()
  })

  it('resolves context, validates structured output, and records audit events without persisting', async () => {
    const provider = { generateStructuredContent: vi.fn().mockResolvedValue({ blocks: [{ id: 'generated-1', type: 'paragraph', children: [{ text: 'Generated explanation', format: [] }] }], sourceBlockIds: ['paragraph-1'] }) }
    const service = new MasteroService({ provider, resourceRepository, moduleRepository, lessonRepository, auditRepository })

    const result = await service.generate('editor-1', request)

    expect(result.blocks[0].id).toBe('generated-1')
    expect(result.sourceBlockIds).toEqual(['paragraph-1'])
    expect(provider.generateStructuredContent).toHaveBeenCalledWith(expect.objectContaining({ systemInstructions: expect.stringContaining('untrusted'), editorContent: expect.stringContaining('Current content') }))
    expect(auditRepository.recordEvent.mock.calls.map(([event]) => event.action)).toEqual(['mastero.generation.started', 'mastero.generation.succeeded'])
  })

  it('rejects malformed blocks and records a failed generation without changing editorial state', async () => {
    const provider = { generateStructuredContent: vi.fn().mockResolvedValue({ blocks: [{ id: 'bad', type: 'not-a-block' }] }) }
    const service = new MasteroService({ provider, resourceRepository, moduleRepository, lessonRepository, auditRepository })

    await expect(service.generate('editor-1', request)).rejects.toThrow()
    expect(auditRepository.recordEvent.mock.calls.map(([event]) => event.action)).toContain('mastero.generation.failed')
    expect(resourceRepository).not.toHaveProperty('update')
  })

  it('enforces source, input, and output limits', async () => {
    const manyBlocks = Array.from({ length: 31 }, (_, index) => ({ id: `p-${index}`, type: 'paragraph' as const, children: [{ text: 'x', format: [] }] }))
    setupResource({ ...baseDocument, blocks: manyBlocks })
    const service = new MasteroService({ provider: { generateStructuredContent: vi.fn() }, resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(service.generate('editor-1', request)).rejects.toThrow('source blocks')

    setupResource()
    const inputService = new MasteroService({ provider: { generateStructuredContent: vi.fn() }, resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(inputService.generate('editor-1', { ...request, instruction: 'x'.repeat(20_000) })).rejects.toThrow('input')

    const outputProvider = { generateStructuredContent: vi.fn().mockResolvedValue({ blocks: Array.from({ length: 21 }, (_, index) => ({ id: `p-${index}`, type: 'paragraph', children: [{ text: 'x', format: [] }] })) }) }
    const outputService = new MasteroService({ provider: outputProvider, resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(outputService.generate('editor-1', { ...request, instruction: '[MASTERO_MODE=STUDY_MATERIAL]\n[DEPTH=Comprehensive]' })).rejects.toThrow('at most 20 blocks')
  })

  it('normalizes provider-not-configured and transient provider errors', async () => {
    const service = new MasteroService({ resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(service.generate('editor-1', request)).rejects.toBeInstanceOf(MasteroProviderNotConfiguredError)

    const provider = { generateStructuredContent: vi.fn().mockRejectedValue(new MasteroProviderError('Unavailable', { transient: true })) }
    const transientService = new MasteroService({ provider, resourceRepository, moduleRepository, lessonRepository, auditRepository })
    await expect(transientService.generate('editor-1', request)).rejects.toThrow('Unavailable')
    expect(provider.generateStructuredContent).toHaveBeenCalledTimes(3)
  })

  it.each([
    ['[MASTERO_MODE=STUDY_MATERIAL]\n[DEPTH=Standard]', 'STUDY_MATERIAL_STANDARD', 6, 6],
    ['[MASTERO_MODE=STUDY_MATERIAL]\n[DEPTH=Detailed]', 'STUDY_MATERIAL_DETAILED', 12, 8],
    ['[MASTERO_MODE=STUDY_MATERIAL]\n[DEPTH=Comprehensive]', 'STUDY_MATERIAL_COMPREHENSIVE', 20, 10],
    ['[MASTERO_MODE=REVISION_NOTES]', 'REVISION_NOTES', 6, 6],
  ] as const)('resolves %s as %s with a %s-block ceiling and narrowed schema', (instruction, name, maxBlocks, schemaBlockCount) => {
    const target = resolveGenerationTarget(instruction)
    expect(target.name).toBe(name)
    expect(target.maxGeneratedBlocks).toBe(maxBlocks)
    const schemaProperties = target.responseSchema.properties as { blocks?: { items?: { anyOf?: unknown[] } } } | undefined
    expect(schemaProperties?.blocks?.items?.anyOf).toHaveLength(schemaBlockCount)
  })

  it.each([
    'GENERATE_EXPLANATION', 'GENERATE_STUDY_NOTES', 'SIMPLIFY', 'EXPAND', 'SUMMARIZE',
    'GENERATE_EXAMPLES', 'GENERATE_EXAM_TIPS', 'GENERATE_DEFINITIONS', 'GENERATE_BULLETS',
    'GENERATE_TABLE', 'IMPROVE_CONTENT', 'GENERATE_SECTION',
  ] as const)('supports %s through the provider-neutral action context', async (action) => {
    const provider = { generateStructuredContent: vi.fn().mockResolvedValue({ blocks: [{ id: 'generated-1', type: 'paragraph', children: [{ text: 'Generated', format: [] }] }], sourceBlockIds: [] }) }
    const service = new MasteroService({ provider, resourceRepository, moduleRepository, lessonRepository, auditRepository })
    const result = await service.generate('editor-1', { ...request, action })
    expect(result.action).toBe(action)
    expect(provider.generateStructuredContent).toHaveBeenCalledWith(expect.objectContaining({ context: expect.objectContaining({ action }) }))
  })

  it('selects the Revision Notes profile from the existing instruction channel', async () => {
    const provider = { generateStructuredContent: vi.fn().mockResolvedValue({ blocks: [{ id: 'generated-1', type: 'paragraph', children: [{ text: 'Revision point', format: [] }] }], sourceBlockIds: [] }) }
    const service = new MasteroService({ provider, resourceRepository, moduleRepository, lessonRepository, auditRepository })

    await service.generate('editor-1', { ...request, action: 'GENERATE_STUDY_NOTES', instruction: '[MASTERO_MODE=REVISION_NOTES]\n[LENGTH=Short]\n[SOURCE_CONTENT]\nFerrous materials contain iron.' })

    expect(provider.generateStructuredContent).toHaveBeenCalledWith(expect.objectContaining({
      systemInstructions: expect.stringContaining('Mode: REVISION_NOTES'),
    }))
  })
})

describe('Mastero apply behavior', () => {
  it('replaces only the selected block for rewrites', () => {
    const document = { ...baseDocument, blocks: [{ id: 'one', type: 'paragraph' as const, children: [{ text: 'one', format: [] }] }, { id: 'two', type: 'paragraph' as const, children: [{ text: 'two', format: [] }] }] }
    const result = { blocks: [{ id: 'replacement', type: 'paragraph' as const, children: [{ text: 'updated', format: [] }] }], sourceBlockIds: ['one'], action: 'IMPROVE_CONTENT' as const, generatedAt: new Date().toISOString() }
    expect(applyMasteroResult(document, result, 'one').blocks.map((block) => block.id)).toEqual(['replacement', 'two'])
  })

  it('inserts generated blocks after selection and appends sections', () => {
    const document = { ...baseDocument, blocks: [{ id: 'one', type: 'paragraph' as const, children: [{ text: 'one', format: [] }] }, { id: 'two', type: 'paragraph' as const, children: [{ text: 'two', format: [] }] }] }
    const insertion = { blocks: [{ id: 'new', type: 'example' as const, title: 'Example', content: 'content' }], sourceBlockIds: ['one'], action: 'GENERATE_EXAMPLES' as const, generatedAt: new Date().toISOString() }
    const section = { ...insertion, action: 'GENERATE_SECTION' as const }
    expect(applyMasteroResult(document, insertion, 'one').blocks.map((block) => block.id)).toEqual(['one', 'new', 'two'])
    expect(applyMasteroResult(document, section, 'one').blocks.map((block) => block.id)).toEqual(['one', 'two', 'new'])
  })
})