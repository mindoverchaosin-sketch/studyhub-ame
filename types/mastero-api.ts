import type { MasteroAction, MasteroGenerationResult } from '@/types/mastero'

export type MasteroGenerateApiRequest = {
  materialId: string
  action: MasteroAction
  selectedBlockId?: string
  instruction?: string
  requestId?: string
  idempotencyKey?: string
}

export type MasteroGenerateApiResponse = {
  requestId: string
  result: MasteroGenerationResult
  review: {
    persisted: false
    workflowChanged: false
    requiresHumanReview: true
  }
}

export type MasteroApiErrorCode =
  | 'MASTERO_UNAUTHORIZED'
  | 'MASTERO_FORBIDDEN'
  | 'MASTERO_VALIDATION_ERROR'
  | 'MASTERO_RATE_LIMITED'
  | 'MASTERO_PROVIDER_UNAVAILABLE'
  | 'MASTERO_PROVIDER_TIMEOUT'
  | 'MASTERO_PROVIDER_MALFORMED_OUTPUT'
  | 'MASTERO_INTERNAL_ERROR'

export type MasteroApiErrorResponse = {
  error: {
    code: MasteroApiErrorCode
    message: string
    requestId: string
    retryable: boolean
  }
}