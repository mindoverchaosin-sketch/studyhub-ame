import type { MasteroProviderRequest, MasteroProviderResponse } from '@/types/mastero'
import { masteroConfig } from './mastero-config'
import { MasteroProviderError, MasteroProviderIncompleteError, MasteroProviderNotConfiguredError, MasteroProviderRefusalError, type AIProvider } from './mastero-provider'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'

type JsonSchema = Record<string, unknown>

const stringSchema = (): JsonSchema => ({ type: 'string' })
const requiredObject = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})

const blockSchemasByType: Record<string, JsonSchema> = {
  heading: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['heading'] }, level: { type: 'integer', enum: [1, 2, 3, 4, 5, 6] }, text: stringSchema() }),
  paragraph: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['paragraph'] }, children: { type: 'array', items: requiredObject({ text: stringSchema(), format: { type: 'array', items: { type: 'string', enum: ['bold', 'italic'] } } }) } }),
  list: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['list'] }, listType: { type: 'string', enum: ['bullet', 'numbered'] }, items: { type: 'array', items: stringSchema() } }),
  table: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['table'] }, headers: { type: 'array', items: stringSchema() }, rows: { type: 'array', items: { type: 'array', items: stringSchema() } } }),
  image: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['image'] }, mediaId: stringSchema(), altText: stringSchema(), alignment: { type: 'string', enum: ['left', 'center', 'right'] } }),
  callout: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['callout'] }, variant: { type: 'string', enum: ['important', 'tip', 'warning'] }, title: stringSchema(), text: stringSchema() }),
  definition: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['definition'] }, term: stringSchema(), definition: stringSchema() }),
  example: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['example'] }, title: stringSchema(), content: stringSchema() }),
  examTip: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['examTip'] }, text: stringSchema() }),
  link: requiredObject({ id: stringSchema(), type: { type: 'string', enum: ['link'] }, text: stringSchema(), url: stringSchema(), openInNewTab: { type: 'boolean' } }),
}

export function createMasteroStructuredResponseSchema(blockTypes: string[] = Object.keys(blockSchemasByType)): JsonSchema {
  const schemas = blockTypes.map((blockType) => blockSchemasByType[blockType]).filter(Boolean)
  return requiredObject({
    blocks: { type: 'array', items: { anyOf: schemas } },
    sourceBlockIds: { type: 'array', items: stringSchema() },
  })
}

const blockSchemas = Object.values(blockSchemasByType)

export const masteroOpenAIResponseSchema: JsonSchema = requiredObject({
  blocks: { type: 'array', items: { anyOf: blockSchemas } },
  sourceBlockIds: { type: 'array', items: stringSchema() },
})

export const masteroStructuredResponseSchema = masteroOpenAIResponseSchema

type OpenAIResponse = {
  status?: string
  incomplete_details?: { reason?: string } | null
  output?: Array<{
    type?: string
    content?: Array<{ type?: string; text?: string; refusal?: string }>
  }>
}

function extractResponseText(response: OpenAIResponse): string {
  if (response.status === 'incomplete' || response.incomplete_details) throw new MasteroProviderIncompleteError()
  const content = response.output?.flatMap((item) => item.content ?? []) ?? []
  const refusal = content.find((item) => item.type === 'refusal' || item.refusal)
  if (refusal) throw new MasteroProviderRefusalError()
  const text = content.find((item) => item.type === 'output_text' && typeof item.text === 'string')?.text
  if (!text) throw new MasteroProviderError('Mastero provider returned no structured content.', { code: 'MASTERO_PROVIDER_EMPTY_RESPONSE' })
  return text
}

function normalizeOpenAIError(status: number, body: string): MasteroProviderError {
  if (status === 401 || status === 403) return new MasteroProviderError('Mastero provider authentication failed.', { code: 'MASTERO_PROVIDER_AUTHENTICATION' })
  if (status === 429) return new MasteroProviderError('Mastero provider rate limit reached.', { code: 'MASTERO_PROVIDER_RATE_LIMITED', transient: true })
  if (status >= 500) return new MasteroProviderError('Mastero provider is temporarily unavailable.', { code: 'MASTERO_PROVIDER_UNAVAILABLE', transient: true })
  if (status === 408) return new MasteroProviderError('Mastero provider request timed out.', { code: 'MASTERO_PROVIDER_TIMEOUT', transient: true })
  void body
  return new MasteroProviderError('Mastero provider rejected the request.', { code: 'MASTERO_PROVIDER_REQUEST_FAILED' })
}

export class OpenAIProvider implements AIProvider {
  async generateStructuredContent(request: MasteroProviderRequest): Promise<MasteroProviderResponse> {
    if (!masteroConfig.openaiApiKey) throw new MasteroProviderNotConfiguredError()

    let response: Response
    try {
      response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${masteroConfig.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: masteroConfig.openaiModel,
          input: [
            { role: 'system', content: request.systemInstructions },
            { role: 'user', content: request.editorContent },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'mastero_document_blocks',
              strict: true,
              schema: request.responseSchema ?? masteroOpenAIResponseSchema,
            },
          },
        }),
      })
    } catch {
      throw new MasteroProviderError('Mastero provider network request failed.', { code: 'MASTERO_PROVIDER_NETWORK', transient: true })
    }

    const responseBody = await response.text()
    if (!response.ok) throw normalizeOpenAIError(response.status, responseBody)

    let parsed: OpenAIResponse
    try {
      parsed = JSON.parse(responseBody) as OpenAIResponse
    } catch {
      throw new MasteroProviderError('Mastero provider returned malformed JSON.', { code: 'MASTERO_PROVIDER_MALFORMED_RESPONSE' })
    }

    let structuredText: string
    try {
      structuredText = extractResponseText(parsed)
    } catch (error) {
      if (error instanceof MasteroProviderError) throw error
      throw new MasteroProviderError('Mastero provider returned an invalid response.', { code: 'MASTERO_PROVIDER_INVALID_RESPONSE' })
    }

    try {
      const result = JSON.parse(structuredText) as MasteroProviderResponse
      if (!result || !Array.isArray(result.blocks)) throw new Error('blocks must be an array')
      return result
    } catch {
      throw new MasteroProviderError('Mastero provider returned malformed structured output.', { code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT' })
    }
  }
}