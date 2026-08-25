import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import prisma from '@/lib/prisma'
import { observabilityService } from '@/server/services/observability.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROVIDER = 'razorpay'
const OPS_EVENT_TYPE = 'ops.failedWebhookAlert'

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

function watermarkProviderEventId(windowMinutes: number): string {
  const bucketKey = Math.floor(Date.now() / (windowMinutes * 60 * 1000))
  return `ops-failed-alert-${bucketKey}`
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
}

export async function POST(request: Request): Promise<NextResponse> {
  const configuredSecret = env.BILLING_CRON_SECRET
  if (!configuredSecret || configuredSecret.length < 32) {
    // Fail closed: without a configured secret the endpoint must never run.
    return NextResponse.json({ success: false }, { status: 503 })
  }

  if (!verifyCronSecret(extractSuppliedSecret(request), configuredSecret)) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const threshold = env.ALERT_FAILED_WEBHOOK_THRESHOLD ?? 3
  const windowMinutes = env.ALERT_FAILED_WEBHOOK_WINDOW_MINUTES ?? 60
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  try {
    const failedEvents = await prisma.billingWebhookEvent.findMany({
      where: {
        provider: PROVIDER,
        processingStatus: 'FAILED',
        updatedAt: { gte: windowStart },
        // Operational watermark rows are metadata, never incidents.
        NOT: { eventType: { startsWith: 'ops.' } },
      },
      select: {
        providerEventId: true,
        eventType: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    const failedCount = failedEvents.length
    if (failedCount < threshold) {
      return NextResponse.json({ success: true, alerted: false, failedCount })
    }

    try {
      observabilityService.captureError(
        new Error(
          `Repeated FAILED billing webhook events detected (${failedCount} in the last ${windowMinutes} minutes)`,
        ),
        {
          service: 'billing',
          operation: 'failed-webhook-alert',
          severity: 'critical',
          category: 'operations',
          metadata: {
            provider: PROVIDER,
            threshold,
            windowMinutes,
            failures: failedEvents.map((event) => ({
              providerEventId: event.providerEventId,
              eventType: event.eventType,
              updatedAt: event.updatedAt,
            })),
          },
        },
      )
    } catch {
      // Emission must never fail the run; the durable FAILED rows and the
      // next scheduler invocation remain the safety net.
    }

    try {
      await prisma.billingWebhookEvent.create({
        data: {
          provider: PROVIDER,
          providerEventId: watermarkProviderEventId(windowMinutes),
          eventType: OPS_EVENT_TYPE,
          processingStatus: 'PROCESSED',
          processedAt: new Date(),
        },
      })
    } catch (watermarkError) {
      if (!isUniqueConstraintError(watermarkError)) {
        // Non-conflict failures still keep the run green; the missing
        // watermark simply allows a re-alert on the next invocation.
        observabilityService.captureError(watermarkError, {
          service: 'billing',
          operation: 'failed-webhook-alert-watermark',
          severity: 'low',
          metadata: { provider: PROVIDER },
        })
      }
      // P2002: another scheduler invocation already alerted for this bucket.
    }

    return NextResponse.json({ success: true, alerted: true, failedCount })
  } catch (error) {
    observabilityService.captureError(error, {
      service: 'billing',
      operation: 'failed-webhook-alerts-cron',
      severity: 'high',
    })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
