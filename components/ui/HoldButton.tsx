'use client'

import { useRef, useState } from 'react'

type Props = {
  onHoldComplete: () => void
  duration?: number
  children: React.ReactNode
  disabled?: boolean
}

export default function HoldButton({ onHoldComplete, duration = 3000, children, disabled }: Props) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)

  function startHold() {
    if (disabled) return
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const p = Math.min(((Date.now() - startTimeRef.current!) / duration) * 100, 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(intervalRef.current!)
        setProgress(0)
        onHoldComplete()
      }
    }, 16)
  }

  function cancelHold() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(0)
  }

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      disabled={disabled}
      className="relative w-full overflow-hidden border border-gray-300 text-gray-700 rounded-lg py-3 font-medium disabled:opacity-50 select-none"
    >
      <div className="absolute inset-0 bg-gray-200" style={{ width: `${progress}%`, transition: progress === 0 ? 'none' : undefined }} />
      <span className="relative">{children}</span>
    </button>
  )
}
