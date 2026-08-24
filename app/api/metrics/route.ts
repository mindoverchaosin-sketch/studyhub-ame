import { NextResponse } from 'next/server'
import { metricsService } from '@/server/services/metrics.service'
import { withRequestLogging } from '@/lib/request-logger'
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/auth'

export async function GET(request?: Request) {
  const req = request ?? new Request('http://localhost/metrics')
  return withRequestLogging(req, 'metrics.snapshot', async () => {
    try {
      await requirePermission('viewAnalytics')
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          { success: false, error: 'Authentication required.' },
          { status: 401 },
        )
      }
      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { success: false, error: 'Access denied.' },
          { status: 403 },
        )
      }
      throw error
    }

    return NextResponse.json(metricsService.getSnapshot(), { status: 200 })
  })
}
