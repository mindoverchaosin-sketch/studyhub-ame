import { NextResponse } from 'next/server'
import { isMasteroGenerationReady, masteroConfig } from '@/server/services/mastero-config'

export async function GET() {
  const generationAvailable = isMasteroGenerationReady(masteroConfig)
  return NextResponse.json({ status: generationAvailable ? 'ready' : 'degraded', service: 'mastero', apiVersion: 'v1', generationAvailable })
}