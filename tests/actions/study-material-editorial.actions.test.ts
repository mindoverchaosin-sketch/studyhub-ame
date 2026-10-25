import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  withAuditLogging: vi.fn(),
  service: {
    submitForReview: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    publish: vi.fn(),
    archive: vi.fn(),
    unpublish: vi.fn(),
  },
  revalidatePath: vi.fn(),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('@/server/actions/audit-helpers', () => ({ withAuditLogging: mocks.withAuditLogging }))
vi.mock('@/server/services/study-material-document.service', () => ({
  studyMaterialDocumentService: mocks.service,
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import {
  approveStudyMaterialAction,
  archiveStudyMaterialEditorialAction,
  publishStudyMaterialAction,
  rejectStudyMaterialAction,
  submitStudyMaterialForReviewAction,
  unpublishStudyMaterialEditorialAction,
} from '@/server/actions/study-material-editorial.actions'

const transitions = [
  {
    label: 'submit',
    action: submitStudyMaterialForReviewAction,
    service: mocks.service.submitForReview,
    permission: 'manageResources',
    auditAction: 'content.submit-for-review',
  },
  {
    label: 'approve',
    action: approveStudyMaterialAction,
    service: mocks.service.approve,
    permission: 'publishContent',
    auditAction: 'content.approve',
  },
  {
    label: 'reject',
    action: rejectStudyMaterialAction,
    service: mocks.service.reject,
    permission: 'publishContent',
    auditAction: 'content.reject',
  },
  {
    label: 'publish',
    action: publishStudyMaterialAction,
    service: mocks.service.publish,
    permission: 'publishContent',
    auditAction: 'content.publish',
  },
  {
    label: 'archive',
    action: archiveStudyMaterialEditorialAction,
    service: mocks.service.archive,
    permission: 'publishContent',
    auditAction: 'content.archive',
  },
  {
    label: 'unpublish',
    action: unpublishStudyMaterialEditorialAction,
    service: mocks.service.unpublish,
    permission: 'publishContent',
    auditAction: 'content.unpublish',
  },
] as const

describe('study material editorial actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'editor-1', role: 'CONTENT_EDITOR' } })
    mocks.withAuditLogging.mockImplementation(async ({
      permission,
      run,
    }: {
      permission: string
      run: () => Promise<unknown>
    }) => {
      await mocks.requirePermission(permission)
      return run()
    })
    for (const transition of transitions) {
      transition.service.mockResolvedValue({ id: 'material-1', status: 'PUBLISHED' })
    }
  })

  it.each(transitions)('$label requires permission, records an actor-attributed audit event, and revalidates publishing pages', async ({
    action,
    service,
    permission,
    auditAction,
  }) => {
    await action('material-1', 'module-1')

    expect(mocks.requirePermission).toHaveBeenCalledWith(permission)
    expect(mocks.withAuditLogging).toHaveBeenCalledWith(expect.objectContaining({
      permission,
      action: auditAction,
      entityType: 'STUDY_MATERIAL',
      entityId: 'material-1',
      metadata: { source: 'study-material-editorial' },
    }))
    expect(service).toHaveBeenCalledWith('material-1', ...(auditAction === 'content.reject' ? [undefined] : []))
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/publishing')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/super-admin/publishing')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/modules/module-1')
  })
})
