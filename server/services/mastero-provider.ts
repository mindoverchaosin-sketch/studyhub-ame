import type { MasteroProviderRequest, MasteroProviderResponse } from '@/types/mastero'

export class MasteroProviderNotConfiguredError extends Error {
  readonly code = 'MASTERO_PROVIDER_NOT_CONFIGURED'

  constructor() {
    super('Mastero provider is not configured yet.')
    this.name = 'MasteroProviderNotConfiguredError'
  }
}

export class MasteroProviderError extends Error {
  readonly code: string
  readonly transient: boolean

  constructor(message: string, options: { code?: string; transient?: boolean } = {}) {
    super(message)
    this.name = 'MasteroProviderError'
    this.code = options.code ?? 'MASTERO_PROVIDER_ERROR'
    this.transient = options.transient ?? false
  }
}

export interface AIProvider {
  generateStructuredContent(request: MasteroProviderRequest): Promise<MasteroProviderResponse>
}

export class UnconfiguredMasteroProvider implements AIProvider {
  async generateStructuredContent(): Promise<MasteroProviderResponse> {
    throw new MasteroProviderNotConfiguredError()
  }
}

export class MasteroProviderRefusalError extends MasteroProviderError {
  constructor() {
    super('Mastero provider refused the request.', { code: 'MASTERO_PROVIDER_REFUSAL' })
    this.name = 'MasteroProviderRefusalError'
  }
}

export class MasteroProviderIncompleteError extends MasteroProviderError {
  constructor() {
    super('Mastero provider returned an incomplete response.', { code: 'MASTERO_PROVIDER_INCOMPLETE' })
    this.name = 'MasteroProviderIncompleteError'
  }
}