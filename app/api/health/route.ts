import { NextResponse } from 'next/server'
import { HealthService } from '@/server/services/health.service'

const healthService = new HealthService()

export async function GET() {
  const snapshot = await healthService.getHealthSnapshot()
  return NextResponse.json(snapshot, { status: snapshot.status === 'healthy' ? 200 : 503 })
}
