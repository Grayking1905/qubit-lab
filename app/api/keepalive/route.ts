import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  const target = `${BACKEND_URL.replace(/\/+$/, '')}/health/keepalive`
  const startTime = Date.now()

  try {
    const res = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'QubitLab-KeepAlive-Trigger/1.0',
      },
      cache: 'no-store',
    })

    const latencyMs = Date.now() - startTime
    const backendData = await res.json().catch(() => ({}))

    return NextResponse.json({
      ok: res.ok,
      status: 'active',
      backendStatus: res.status,
      latencyMs,
      target,
      backendResponse: backendData,
      triggeredAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        target,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
