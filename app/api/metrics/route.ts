import { NextResponse } from 'next/server'
import { metricsService } from '@/server/services/metrics.service'
import { withRequestLogging } from '@/lib/request-logger'

export async function GET(request?: Request) {
  const req = request ?? new Request('http://localhost/metrics')
  return withRequestLogging(req, 'metrics.snapshot', async () => {
    return NextResponse.json(metricsService.getSnapshot(), { status: 200 })
  })
}
