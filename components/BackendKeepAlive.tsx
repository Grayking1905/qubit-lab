'use client'

import { useEffect, useRef, useState } from 'react'

interface BackendKeepAliveProps {
  intervalSeconds?: number
  showBadge?: boolean
}

export default function BackendKeepAlive({
  intervalSeconds = 5,
  showBadge = false,
}: BackendKeepAliveProps) {
  const [isAlive, setIsAlive] = useState<boolean | null>(null)
  const [pingCount, setPingCount] = useState(0)
  const [lastLatency, setLastLatency] = useState<number | null>(null)
  const isPingingRef = useRef(false)

  useEffect(() => {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const targetUrl = `${backendBase.replace(/\/+$/, '')}/health/keepalive`

    const sendPulse = async () => {
      if (isPingingRef.current) return
      isPingingRef.current = true
      const start = Date.now()

      try {
        // Try direct backend pulse first; fallback to internal proxy
        const res = await fetch(targetUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'X-Heartbeat': '5s-pulse' },
        }).catch(() => fetch('/api/keepalive', { cache: 'no-store' }))

        const latency = Date.now() - start
        setLastLatency(latency)

        if (res.ok) {
          setIsAlive(true)
          setPingCount(prev => prev + 1)
        } else {
          setIsAlive(false)
        }
      } catch {
        setIsAlive(false)
      } finally {
        isPingingRef.current = false
      }
    }

    // Send immediate pulse on mount
    sendPulse()

    // Interval every 5 seconds (or configured interval)
    const intervalMs = Math.max(2, intervalSeconds) * 1000
    const timer = setInterval(sendPulse, intervalMs)

    return () => clearInterval(timer)
  }, [intervalSeconds])

  if (!showBadge) return null

  return (
    <div
      className="keepalive-status-indicator"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 12,
        background: '#141210dd',
        border: '1px solid #35312b66',
        fontSize: 10,
        fontFamily: 'ui-monospace, monospace',
        color: isAlive ? '#87b89a' : '#e38d9b',
        backdropFilter: 'blur(4px)',
      }}
      title={`KeepAlive Heartbeat: ${pingCount} pulses sent every ${intervalSeconds}s. Latency: ${lastLatency ?? 0}ms`}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isAlive ? '#87b89a' : '#e38d9b',
          boxShadow: isAlive ? '0 0 6px #87b89a' : '0 0 6px #e38d9b',
        }}
      />
      <span>{isAlive ? 'Render Active' : 'Connecting...'}</span>
    </div>
  )
}
