import { NextResponse } from 'next/server'
import { metricsService } from '@/server/services/metrics.service'

export async function GET() {
  return NextResponse.json(metricsService.getSnapshot(), { status: 200 })
}
