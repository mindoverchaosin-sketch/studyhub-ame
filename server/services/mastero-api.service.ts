import { MasteroProviderError, MasteroProviderNotConfiguredError } from '@/server/services/mastero-provider'
import { MasteroRateLimitError, MasteroTimeoutError, MasteroValidationError } from '@/server/services/mastero.service'
import type { MasteroApiErrorCode } from '@/types/mastero-api'

export type MasteroApiErrorDetails = {
  status: number
  code: MasteroApiErrorCode
  message: string
  retryable: boolean
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : undefined
}

export function normalizeMasteroApiError(error: unknown): MasteroApiErrorDetails {
  const code = errorCode(error)
  if (error instanceof MasteroRateLimitError || code === 'MASTERO_RATE_LIMITED') {
    return { status: 429, code: 'MASTERO_RATE_LIMITED', message: 'Mastero generation rate limit reached. Please try again shortly.', retryable: true }
  }

  if (error instanceof MasteroTimeoutError || code === 'MASTERO_PROVIDER_TIMEOUT') {
    return { status: 504, code: 'MASTERO_PROVIDER_TIMEOUT', message: 'Mastero took too long to respond.', retryable: true }
  }

  if (error instanceof MasteroProviderNotConfiguredError || code === 'MASTERO_PROVIDER_UNAVAILABLE' || (error instanceof MasteroProviderError && error.transient)) {
    return { status: 503, code: 'MASTERO_PROVIDER_UNAVAILABLE', message: 'Mastero is temporarily unavailable.', retryable: true }
  }

  if (error instanceof MasteroProviderError || code?.startsWith('MASTERO_PROVIDER_')) {
    if (code === 'MASTERO_PROVIDER_MALFORMED_OUTPUT' || code === 'MASTERO_PROVIDER_INVALID_RESPONSE' || code === 'MASTERO_PROVIDER_EMPTY_RESPONSE') {
      return { status: 502, code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT', message: 'Mastero returned an invalid structured result.', retryable: false }
    }
    return { status: 503, code: 'MASTERO_PROVIDER_UNAVAILABLE', message: 'Mastero is temporarily unavailable.', retryable: error instanceof MasteroProviderError ? error.transient : true }
  }

  if (error instanceof MasteroValidationError) {
    return { status: 400, code: 'MASTERO_VALIDATION_ERROR', message: 'The Mastero request is invalid.', retryable: false }
  }

  return { status: 500, code: 'MASTERO_INTERNAL_ERROR', message: 'Mastero could not complete the request.', retryable: false }
}