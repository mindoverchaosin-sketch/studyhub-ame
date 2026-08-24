import { RateLimitError } from './ai-error';

/**
 * In-process fixed-window rate limiter for AI endpoints.
 *
 * No external dependencies: counters live in module memory, which is correct
 * for a single instance and fails safe (limits still enforced per instance)
 * behind multiple instances. A shared store (e.g. Redis) can replace the
 * bucket Map later without changing call sites.
 */

export type AIRateLimitScope =
  | 'chat'
  | 'chat-stream'
  | 'explain'
  | 'summarize'
  | 'recommendations'
  | 'generate-questions';

export interface AIRateLimitRule {
  limit: number;
  windowMs: number;
}

export interface AIRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export const AI_RATE_LIMIT_RULES: Record<AIRateLimitScope, AIRateLimitRule> = {
  chat: { limit: 20, windowMs: 60_000 },
  'chat-stream': { limit: 20, windowMs: 60_000 },
  explain: { limit: 20, windowMs: 60_000 },
  summarize: { limit: 15, windowMs: 60_000 },
  recommendations: { limit: 30, windowMs: 60_000 },
  'generate-questions': { limit: 10, windowMs: 60_000 },
};

// Safety valve so a flood of distinct identities cannot grow memory unbounded.
const MAX_TRACKED_BUCKETS = 10_000;

export class AIRateLimitService {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly overrides?: Partial<Record<AIRateLimitScope, AIRateLimitRule>>) {}

  private ruleFor(scope: AIRateLimitScope): AIRateLimitRule {
    return this.overrides?.[scope] ?? AI_RATE_LIMIT_RULES[scope];
  }

  check(scope: AIRateLimitScope, identity: string, now: number = Date.now()): AIRateLimitResult {
    const rule = this.ruleFor(scope);
    const normalizedIdentity = identity?.trim() ? identity.trim() : 'anonymous';
    const key = `${scope}:${normalizedIdentity}`;

    if (!rule) {
      return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfterSeconds: 0 };
    }

    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.pruneIfNeeded(now);
      this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= rule.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, rule.limit - existing.count),
      retryAfterSeconds: 0,
    };
  }

  enforce(scope: AIRateLimitScope, identity: string, now: number = Date.now()): void {
    const result = this.check(scope, identity, now);
    if (!result.allowed) {
      throw new RateLimitError(
        `Too many ${scope} requests. Retry in ${result.retryAfterSeconds}s.`,
      );
    }
  }

  reset(): void {
    this.buckets.clear();
  }

  private pruneIfNeeded(now: number): void {
    if (this.buckets.size < MAX_TRACKED_BUCKETS) {
      return;
    }
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Derives the rate-limit identity for a request. Authenticated users are
 * limited per user id; any request without an authenticated id falls back to
 * the client IP so anonymous traffic can never bypass the limit.
 */
export function getAIRateLimitIdentity(userId?: string | null, request?: Request): string {
  if (userId?.trim()) {
    return userId.trim();
  }

  const forwarded = request?.headers.get('x-forwarded-for');
  if (forwarded) {
    const clientIp = forwarded.split(',')[0]?.trim();
    if (clientIp) {
      return `ip:${clientIp}`;
    }
  }

  const realIp = request?.headers.get('x-real-ip');
  if (realIp?.trim()) {
    return `ip:${realIp.trim()}`;
  }

  return 'anonymous';
}

export const aiRateLimiter = new AIRateLimitService();
