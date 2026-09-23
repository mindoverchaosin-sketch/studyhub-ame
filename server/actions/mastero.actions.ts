'use server'

import { requirePermission } from '@/auth'
import { masteroService } from '@/server/services/mastero.service'
import type { MasteroAuditEvent, MasteroGenerationRequest } from '@/types/mastero'

export async function generateMasteroContentAction(request: MasteroGenerationRequest) {
  const session = await requirePermission('manageResources')
  return masteroService.generate(session.user.id as string, request)
}

export async function recordMasteroInteractionAction(input: {
  event: Extract<MasteroAuditEvent, 'mastero.generation.rejected' | 'mastero.generation.applied'>
  materialId: string
  metadata?: Record<string, unknown>
}) {
  const session = await requirePermission('manageResources')
  await masteroService.recordInteraction(session.user.id as string, input.event, input.materialId, input.metadata)
}