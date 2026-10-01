'use client'

import { useEffect, useRef, useState } from 'react'

interface StatItemProps {
  endValue: number
  prefix?: string
  suffix?: string
  label: string
  sublabel?: string
  accent?: boolean
  duration?: number
}

function StatItem({
  endValue,
  prefix = '',
  suffix = '',
  label,
  sublabel,
  accent = false,
  duration = 1800,
}: StatItemProps) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = countRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true

          const startTime = performance.now()
          const step = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / duration, 1)
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easeProgress * endValue))

            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setCount(endValue)
            }
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [endValue, duration])

  return (
    <div
      ref={countRef}
      className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${accent
        ? 'bg-[#0f1d14]/80 border-[#74c004]/30 hover:border-[#74c004]/70 shadow-[0_0_25px_rgba(116,192,4,0.1)]'
        : 'bg-[#0c1322]/80 border-white/10 hover:border-white/20'
        } backdrop-blur-md`}
    >
      {/* Top micro dot accent */}
      <div className="flex items-center justify-between pb-3">
        <span
          className={`h-2 w-2 rounded-full ${accent ? 'bg-[#74c004] animate-pulse shadow-[0_0_8px_#74c004]' : 'bg-slate-500'
            }`}
        />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>

      {/* Main Counter Display */}
      <div
        className={`font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${accent ? 'text-[#74c004]' : 'text-white'
          }`}
      >
        <span>{prefix}</span>
        <span>{count}</span>
        <span>{suffix}</span>
      </div>

      {/* Sublabel */}
      <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
        {sublabel}
      </div>
    </div>
  )
}

export function AnimatedStats() {
  return (
    <section className="relative z-20 py-12 px-4 sm:px-6 lg:px-8 -mt-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatItem
            endValue={3}
            suffix="+"
            label="Tournament Hosted"

            duration={1500}
          />
          <StatItem
            endValue={48}
            suffix="+"
            label="Teams Participated"

            duration={1800}
          />
          <StatItem
            endValue={450}
            suffix=" +"
            label="Player Participated"

            accent={true}
            duration={1200}
          />
          <StatItem
            endValue={35}
            prefix="₹"
            suffix="K+"
            label="Prizes Awarded"

            accent={true}
            duration={2000}
          />
        </div>
      </div>
    </section>
  )
}
