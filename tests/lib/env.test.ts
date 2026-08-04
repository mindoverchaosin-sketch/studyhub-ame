import { describe, expect, it, vi } from 'vitest'

describe('Environment validation', () => {
  it('loads defaults in development when no vars are set', async () => {
    const originalEnv = { ...process.env }
    vi.resetModules()
    ;(process.env as any).NODE_ENV = 'development'
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET

    const { env } = await import('../../lib/env')

    expect(env.NODE_ENV).toBe('development')
    expect(env.DATABASE_URL).toContain('postgresql://')
    expect(env.NEXTAUTH_URL).toBe('http://localhost:3000')
    expect(env.NEXTAUTH_SECRET).toBe('development-secret')
    expect(env.AI_PROVIDER).toBe('mock')

    Object.assign(process.env, originalEnv)
  })

  it('fails when required production variables are missing', async () => {
    const originalEnv = { ...process.env }
    vi.resetModules()
    ;(process.env as any).NODE_ENV = 'production'
    process.env.NEXTAUTH_URL = 'https://example.com'
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET

    await expect(import('../../lib/env')).rejects.toThrow()

    Object.assign(process.env, originalEnv)
  })
})
