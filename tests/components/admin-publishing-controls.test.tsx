import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const actions = vi.hoisted(() => ({
  approvePublishingAction: vi.fn(),
  archiveContentAction: vi.fn(),
  publishContentAction: vi.fn(),
  rejectPublishingAction: vi.fn(),
  submitForReviewAction: vi.fn(),
  unpublishContentAction: vi.fn(),
  approveStudyMaterialAction: vi.fn(),
  archiveStudyMaterialEditorialAction: vi.fn(),
  publishStudyMaterialAction: vi.fn(),
  rejectStudyMaterialAction: vi.fn(),
  submitStudyMaterialForReviewAction: vi.fn(),
  unpublishStudyMaterialEditorialAction: vi.fn(),
}))

vi.mock('@/server/actions/publishing.actions', () => ({
  approvePublishingAction: actions.approvePublishingAction,
  archiveContentAction: actions.archiveContentAction,
  publishContentAction: actions.publishContentAction,
  rejectPublishingAction: actions.rejectPublishingAction,
  submitForReviewAction: actions.submitForReviewAction,
  unpublishContentAction: actions.unpublishContentAction,
}))

vi.mock('@/server/actions/study-material-editorial.actions', () => ({
  approveStudyMaterialAction: actions.approveStudyMaterialAction,
  archiveStudyMaterialEditorialAction: actions.archiveStudyMaterialEditorialAction,
  publishStudyMaterialAction: actions.publishStudyMaterialAction,
  rejectStudyMaterialAction: actions.rejectStudyMaterialAction,
  submitStudyMaterialForReviewAction: actions.submitStudyMaterialForReviewAction,
  unpublishStudyMaterialEditorialAction: actions.unpublishStudyMaterialEditorialAction,
}))

import PublishingControls from '@/components/admin/publishing/PublishingControls'
import type { PublishingTargetType } from '@/server/services/publishing.service'

const approvedTargets: Array<{
  targetType: PublishingTargetType
  expectedAction: typeof actions.publishContentAction
  unexpectedAction: typeof actions.publishStudyMaterialAction
}> = [
  {
    targetType: 'STUDY_MATERIAL',
    expectedAction: actions.publishStudyMaterialAction,
    unexpectedAction: actions.publishContentAction,
  },
  {
    targetType: 'MODULE',
    expectedAction: actions.publishContentAction,
    unexpectedAction: actions.publishStudyMaterialAction,
  },
  {
    targetType: 'LESSON',
    expectedAction: actions.publishContentAction,
    unexpectedAction: actions.publishStudyMaterialAction,
  },
  {
    targetType: 'QUESTION',
    expectedAction: actions.publishContentAction,
    unexpectedAction: actions.publishStudyMaterialAction,
  },
]

describe('PublishingControls approved publishing', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    Object.values(actions).forEach((action) => action.mockResolvedValue(undefined))
  })

  it.each(approvedTargets)('routes $targetType Publish to its supported action', async ({
    targetType,
    expectedAction,
    unexpectedAction,
  }) => {
    render(<PublishingControls targetType={targetType} targetId="target-1" moduleId="module-1" status="APPROVED" />)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(expectedAction).toHaveBeenCalledOnce())
    expect(expectedAction).toHaveBeenCalledWith(
      ...(targetType === 'STUDY_MATERIAL'
        ? ['target-1', 'module-1']
        : [targetType, 'target-1', 'module-1']),
    )
    expect(unexpectedAction).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each(approvedTargets)('shows the error state when $targetType publishing fails', async ({
    targetType,
    expectedAction,
  }) => {
    expectedAction.mockRejectedValueOnce(new Error('publish failed'))
    render(<PublishingControls targetType={targetType} targetId="target-1" status="APPROVED" />)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The status change failed')
    expect(expectedAction).toHaveBeenCalledOnce()
  })
})
