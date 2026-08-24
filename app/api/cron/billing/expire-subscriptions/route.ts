import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { observabilityService } from '@/server/services/observability.service'
import { runSubscriptionExpirationJob } from '@/server/domains/billing/subscriptions/subscription-expiration.job'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extractSuppliedSecret(request: Request): string | null {
  const headerSecret = request.headers.get('x-cron-secret')
  if (headerSecret && headerSecret.trim().length > 0) {
    return headerSecret
  }

  const authorization = request.headers.get('authorization')
  if (authorization) {
    const [scheme, ...rest] = authorization.trim().split(/\s+/)
    if (scheme?.toLowerCase() === 'bearer' && rest.length === 1 && rest[0].length > 0) {
      return rest[0]
    }
  }

  return null
}

function verifyCronSecret(supplied: string | null, expected: string): boolean {
  if (!supplied) {
    return false
  }

  // Length-guard before timingSafeEqual: it throws on unequal buffer sizes,
  // and malformed secrets must reject cleanly instead of throwing.
  const suppliedBuffer = Buffer.from(supplied, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (suppliedBuffer.length === 0 || expectedBuffer.length === 0) {
    return false
  }
  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
}

export async function POST(request: Request): Promise<NextResponse> {
  // Fail closed: without a configured secret the endpoint must never run.
  const configuredSecret = env.BILLING_CRON_SECRET
  if (!configuredSecret || configuredSecret.length < 32) {
    return NextResponse.json({ success: false }, { status: 503 })
  }

  if (!verifyCronSecret(extractSuppliedSecret(request), configuredSecret)) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  try {
    const expiredCount = await runSubscriptionExpirationJob()
    return NextResponse.json({ success: true, expiredCount })
  } catch (error) {
    observabilityService.captureError(error, {
      service: 'billing',
      operation: 'subscription-expiration-cron',
      severity: 'high',
    })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
