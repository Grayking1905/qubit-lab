import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  const target = `${BACKEND_URL.replace(/\/+$/, '')}/health`
  const startTime = Date.now()

  try {
    const res = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'QubitLab-NextJS-HealthProxy/1.0',
      },
      cache: 'no-store',
    })

    const latencyMs = Date.now() - startTime
    const backendData = await res.json().catch(() => ({}))

    return NextResponse.json({
      status: 'ok',
      service: 'qubitlab-frontend-and-backend',
      backendStatus: res.status,
      latencyMs,
      backend: backendData,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        status: 'degraded',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
