import { env } from '@/lib/env'

export type MasteroProviderName = 'openai' | 'ollama'

const configuredProvider = process.env.MASTERO_PROVIDER?.trim().toLowerCase()

export const masteroConfig = {
  provider: (configuredProvider === 'ollama' ? 'ollama' : 'openai') as MasteroProviderName,
  openaiModel: process.env.MASTERO_OPENAI_MODEL?.trim() || 'gpt-5-mini',
  openaiApiKey: env.OPENAI_API_KEY,
  ollamaBaseUrl: process.env.MASTERO_OLLAMA_BASE_URL?.trim() || 'http://localhost:11434',
  ollamaModel: process.env.MASTERO_OLLAMA_MODEL?.trim() || 'qwen2.5:3b',
} as const

export function isMasteroGenerationReady(config = masteroConfig) {
  if (config.provider === 'ollama') {
    return Boolean(config.ollamaBaseUrl?.trim()) && Boolean(config.ollamaModel?.trim())
  }

  if (config.provider === 'openai') {
    return Boolean(config.openaiApiKey?.trim())
  }

  return false
} 