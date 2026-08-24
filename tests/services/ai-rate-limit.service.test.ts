import { describe, expect, it, beforeEach } from 'vitest'
import { AIRateLimitService, getAIRateLimitIdentity } from '@/server/services/ai/rate-limit.service'
import { RateLimitError } from '@/server/services/ai/ai-error'

const NOW = 1_700_000_000_000

describe('AI rate limit service', () => {
  let limiter: AIRateLimitService

  beforeEach(() => {
    limiter = new AIRateLimitService({
      chat: { limit: 3, windowMs: 60_000 },
      'chat-stream': { limit: 2, windowMs: 60_000 },
      summarize: { limit: 5, windowMs: 60_000 },
    })
    limiter.reset()
  })

  it('allows requests up to the limit then blocks with a retry hint', () => {
    expect(limiter.check('chat', 'user-1', NOW).allowed).toBe(true)
    expect(limiter.check('chat', 'user-1', NOW + 1).allowed).toBe(true)
    expect(limiter.check('chat', 'user-1', NOW + 2)).toMatchObject({ allowed: true, remaining: 0 })

    const blocked = limiter.check('chat', 'user-1', NOW + 3)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('unblocks identities once the window elapses', () => {
    for (let i = 0; i < 3; i += 1) {
      limiter.check('chat', 'user-1', NOW + i)
    }
    expect(limiter.check('chat', 'user-1', NOW + 59_999).allowed).toBe(false)
    expect(limiter.check('chat', 'user-1', NOW + 61_000).allowed).toBe(true)
  })

  it('isolates limits per user identity', () => {
    for (let i = 0; i < 3; i += 1) {
      limiter.check('chat', 'user-A', NOW + i)
    }
    expect(limiter.check('chat', 'user-A', NOW + 10).allowed).toBe(false)
    expect(limiter.check('chat', 'user-B', NOW + 10).allowed).toBe(true)
  })

  it('isolates limits per scope', () => {
    limiter.check('chat-stream', 'user-1', NOW)
    limiter.check('chat-stream', 'user-1', NOW)
    expect(limiter.check('chat-stream', 'user-1', NOW).allowed).toBe(false)

    // Different scope with its own budget is unaffected.
    expect(limiter.check('summarize', 'user-1', NOW).allowed).toBe(true)
    // Same scope name in the shared default rules would be separate here.
    expect(limiter.check('chat' as never, 'user-1', NOW).allowed).toBe(true)
  })

  it('treats missing identities as one shared anonymous bucket', () => {
    expect(getAIRateLimitIdentity('', undefined)).toBe('anonymous')

    for (let i = 0; i < 3; i += 1) {
      limiter.check('chat', 'anonymous', NOW + i)
    }

    // An unauthenticated request with no resolvable identity shares the bucket.
    expect(limiter.check('chat', getAIRateLimitIdentity(undefined, new Request('http://localhost/api/ai/chat')), NOW + 5).allowed).toBe(false)
  })

  it('prefers user id over ip headers for authenticated users', () => {
    const request = new Request('http://localhost/api/ai/chat', {
      headers: { 'x-forwarded-for': '203.0.113.9, 70.41.3.18' },
    })

    expect(getAIRateLimitIdentity('user-7', request)).toBe('user-7')
    expect(getAIRateLimitIdentity(null, request)).toBe('ip:203.0.113.9')
    expect(getAIRateLimitIdentity(undefined, request)).toBe('ip:203.0.113.9')
  })

  it('falls back to x-real-ip and anonymous when forwarded header missing', () => {
    const realIpRequest = new Request('http://localhost/api/ai/chat', { headers: { 'x-real-ip': '198.51.100.4' } })
    expect(getAIRateLimitIdentity(undefined, realIpRequest)).toBe('ip:198.51.100.4')

    const bareRequest = new Request('http://localhost/api/ai/chat')
    expect(getAIRateLimitIdentity(undefined, bareRequest)).toBe('anonymous')
  })

  it('enforce throws RateLimitError once the budget is exhausted', () => {
    expect(() => limiter.enforce('summarize', 'user-1', NOW)).not.toThrow()
    for (let i = 0; i < 4; i += 1) {
      limiter.enforce('summarize', 'user-1', NOW + i + 1)
    }

    try {
      limiter.enforce('summarize', 'user-1', NOW + 10)
      throw new Error('expected RateLimitError')
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError)
      expect((error as RateLimitError).status).toBe(429)
      expect((error as RateLimitError).code).toBe('RATE_LIMIT_ERROR')
    }
  })
})
