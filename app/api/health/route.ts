import { NextResponse } from 'next/server'
import { HealthService } from '@/server/services/health.service'
import { withRequestLogging } from '@/lib/request-logger';

const healthService = new HealthService()

export async function GET(request: Request) {
  return withRequestLogging(request, 'health.check', async () => {
    const snapshot = await healthService.getHealthSnapshot()
    return NextResponse.json(snapshot, { status: snapshot.status === 'healthy' ? 200 : 503 })
  })
}
