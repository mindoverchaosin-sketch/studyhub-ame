import type { MasteroProviderRequest, MasteroProviderResponse } from '@/types/mastero'
import type { AIProvider } from '@/server/services/mastero-provider'

export class MockMasteroProvider implements AIProvider {
  constructor(private readonly malformed = false) {}

  async generateStructuredContent(request: MasteroProviderRequest): Promise<MasteroProviderResponse> {
    if (this.malformed) return { blocks: [{ id: 'invalid-1', type: 'unsupported' }], sourceBlockIds: [] }
    return {
      blocks: [{ id: 'mock-explanation-1', type: 'paragraph', children: [{ text: `Mock explanation for ${request.context.title}`, format: [] }] }],
      sourceBlockIds: request.context.selectedBlock ? [request.context.selectedBlock.id] : [],
    }
  }
}