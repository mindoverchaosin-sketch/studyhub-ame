'use client'

import { useState, useTransition } from 'react'
import {
  approvePublishingAction,
  archiveContentAction,
  publishContentAction,
  rejectPublishingAction,
  submitForReviewAction,
  unpublishContentAction,
} from '@/server/actions/publishing.actions'
import {
  approveStudyMaterialAction,
  archiveStudyMaterialEditorialAction,
  publishStudyMaterialAction,
  rejectStudyMaterialAction,
  submitStudyMaterialForReviewAction,
  unpublishStudyMaterialEditorialAction,
} from '@/server/actions/study-material-editorial.actions'
import type { PublishingInventoryStatus } from '@/server/services/publishing-inventory.service'
import type { PublishingTargetType } from '@/server/services/publishing.service'

type PublishingControlsProps = {
  targetType: PublishingTargetType
  targetId: string
  moduleId?: string
  status: PublishingInventoryStatus
}

type Transition = {
  label: string
  run: () => Promise<unknown>
}

export default function PublishingControls({ targetType, targetId, moduleId, status }: PublishingControlsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const isStudyMaterial = targetType === 'STUDY_MATERIAL'
  const transitions: Transition[] = []

  if (status === 'DRAFT') {
    transitions.push({
      label: 'Submit for review',
      run: () => isStudyMaterial
        ? submitStudyMaterialForReviewAction(targetId, moduleId)
        : submitForReviewAction(targetType, targetId, moduleId),
    })
  } else if (status === 'IN_REVIEW') {
    transitions.push(
      {
        label: 'Approve',
        run: () => isStudyMaterial
          ? approveStudyMaterialAction(targetId, moduleId)
          : approvePublishingAction(targetType, targetId, moduleId),
      },
      {
        label: 'Reject',
        run: () => isStudyMaterial
          ? rejectStudyMaterialAction(targetId, moduleId)
          : rejectPublishingAction(targetType, targetId, undefined, moduleId),
      },
    )
  } else if (status === 'APPROVED') {
    transitions.push({
      label: 'Publish',
      run: () => isStudyMaterial
        ? publishStudyMaterialAction(targetId, moduleId)
        : publishContentAction(targetType, targetId, moduleId),
    })
  } else if (status === 'PUBLISHED') {
    transitions.push(
      {
        label: 'Unpublish',
        run: () => isStudyMaterial
          ? unpublishStudyMaterialEditorialAction(targetId, moduleId)
          : unpublishContentAction(targetType, targetId, moduleId),
      },
      {
        label: 'Archive',
        run: () => isStudyMaterial
          ? archiveStudyMaterialEditorialAction(targetId, moduleId)
          : archiveContentAction(targetType, targetId, moduleId),
      },
    )
  } else if (status === 'ARCHIVED') {
    transitions.push({
      label: 'Return to draft',
      run: () => isStudyMaterial
        ? unpublishStudyMaterialEditorialAction(targetId, moduleId)
        : unpublishContentAction(targetType, targetId, moduleId),
    })
  } else if (status === 'SCHEDULED' && !isStudyMaterial) {
    transitions.push({
      label: 'Publish now',
      run: () => publishContentAction(targetType, targetId, moduleId),
    })
  }

  function runTransition(transition: Transition) {
    setError(false)
    startTransition(() => {
      void transition.run().catch(() => setError(true))
    })
  }

  return (
    <div className="min-w-40">
      {transitions.length ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map((transition) => (
            <button
              key={transition.label}
              type="button"
              disabled={isPending}
              onClick={() => runTransition(transition)}
              className="min-h-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              {isPending ? 'Saving…' : transition.label}
            </button>
          ))}
        </div>
      ) : <span className="text-xs text-slate-500">No available transition</span>}
      {error ? <p role="alert" className="mt-2 max-w-64 text-xs text-rose-800">The status change failed. Refresh the queue and retry; if the issue continues, contact an administrator.</p> : null}
    </div>
  )
}
