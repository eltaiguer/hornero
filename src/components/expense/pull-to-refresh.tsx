'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const startY = useRef<number | null>(null)
  const [pulling, setPulling] = useState(false)

  return (
    <div
      onTouchStart={(event) => {
        startY.current = event.touches[0]?.clientY ?? null
      }}
      onTouchEnd={(event) => {
        const initial = startY.current
        const final = event.changedTouches[0]?.clientY ?? null
        if (initial === null || final === null) return

        const delta = final - initial
        if (delta > 70) {
          setPulling(true)
          router.refresh()
          setTimeout(() => setPulling(false), 700)
        }
      }}
    >
      {pulling ? <p className="mb-3 text-sm text-gray-500">Refreshing...</p> : null}
      {children}
    </div>
  )
}
