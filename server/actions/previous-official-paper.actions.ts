'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { previousOfficialPaperService, type PreviousOfficialPaperCreateInput, type PreviousOfficialPaperUpdateInput } from '@/server/services/previous-official-paper.service'

function revalidatePaperPaths() {
  revalidatePath('/admin/previous-papers')
  revalidatePath('/content-editor/previous-papers')
  revalidatePath('/student/previous-papers')
}

export async function createPreviousOfficialPaperAction(input: PreviousOfficialPaperCreateInput) {
  await requirePermission('manageResources')
  return withAuditLogging({
    permission: 'manageResources',
    action: 'previous-paper.create',
    entityType: 'PREVIOUS_OFFICIAL_PAPER',
    run: async () => {
      const result = await previousOfficialPaperService.create(input)
      revalidatePaperPaths()
      return result
    },
  })
}

export async function updatePreviousOfficialPaperAction(id: string, input: PreviousOfficialPaperUpdateInput) {
  await requirePermission('manageResources')
  return withAuditLogging({
    permission: 'manageResources',
    action: 'previous-paper.update',
    entityType: 'PREVIOUS_OFFICIAL_PAPER',
    entityId: id,
    run: async () => {
      const result = await previousOfficialPaperService.update(id, input)
      revalidatePaperPaths()
      return result
    },
  })
}

export async function archivePreviousOfficialPaperAction(id: string) {
  await requirePermission('manageResources')
  return withAuditLogging({
    permission: 'manageResources',
    action: 'previous-paper.archive',
    entityType: 'PREVIOUS_OFFICIAL_PAPER',
    entityId: id,
    run: async () => {
      const result = await previousOfficialPaperService.archive(id)
      revalidatePaperPaths()
      return result
    },
  })
}

export async function publishPreviousOfficialPaperAction(id: string) {
  await requirePermission('publishContent')
  return withAuditLogging({
    permission: 'publishContent',
    action: 'previous-paper.publish',
    entityType: 'PREVIOUS_OFFICIAL_PAPER',
    entityId: id,
    run: async () => {
      const result = await previousOfficialPaperService.publish(id)
      revalidatePaperPaths()
      return result
    },
  })
}

export async function unpublishPreviousOfficialPaperAction(id: string) {
  await requirePermission('publishContent')
  return withAuditLogging({
    permission: 'publishContent',
    action: 'previous-paper.unpublish',
    entityType: 'PREVIOUS_OFFICIAL_PAPER',
    entityId: id,
    run: async () => {
      const result = await previousOfficialPaperService.unpublish(id)
      revalidatePaperPaths()
      return result
    },
  })
}
