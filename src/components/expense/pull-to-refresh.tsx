'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const startY = useRef<number | null>(null)
  const pullDistance = useRef(0)
  const refreshedAt = useRef(0)
  const [pulling, setPulling] = useState(false)

  return (
    <div
      onTouchStart={(event) => {
        if (typeof window !== 'undefined' && window.scrollY > 0) {
          startY.current = null
          pullDistance.current = 0
          return
        }
        startY.current = event.touches[0]?.clientY ?? null
        pullDistance.current = 0
      }}
      onTouchMove={(event) => {
        const initial = startY.current
        if (initial === null) return
        const current = event.touches[0]?.clientY ?? initial
        pullDistance.current = current - initial
      }}
      onTouchEnd={(event) => {
        const initial = startY.current
        const final = event.changedTouches[0]?.clientY ?? null
        if (initial === null || final === null) {
          pullDistance.current = 0
          return
        }

        const delta = pullDistance.current || final - initial
        pullDistance.current = 0

        const now = Date.now()
        const inCooldown = now - refreshedAt.current < 5_000
        if (delta > 90 && !inCooldown) {
          refreshedAt.current = now
          setPulling(true)
          router.refresh()
          setTimeout(() => setPulling(false), 500)
        }
      }}
    >
      {pulling ? <p className="mb-3 text-sm text-gray-500">Refreshing...</p> : null}
      {children}
    </div>
  )
}
