"use client"

import { useMemo } from "react"
import { motion, useReducedMotion, type MotionValue } from "motion/react"

interface HeroBackgroundProps {
  /** Parallax offsets driven by the pointer, supplied by the parent. */
  parallaxX?: MotionValue<number>
  parallaxY?: MotionValue<number>
}

/**
 * Layered cinematic backdrop:
 *  - aurora gradient blooms
 *  - blueprint / HUD grid
 *  - drifting cloud band
 *  - floating particle field
 *  - runway centreline lights
 */
export function HeroBackground({ parallaxX, parallaxY }: HeroBackgroundProps) {
  const reduceMotion = useReducedMotion()

  // Deterministic particle field (avoids hydration mismatch).
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280
        const rnd = seed / 233280
        const rnd2 = ((i * 4021 + 7919) % 104729) / 104729
        return {
          left: `${(rnd * 100).toFixed(2)}%`,
          top: `${(rnd2 * 100).toFixed(2)}%`,
          size: 1 + (i % 3),
          delay: (rnd * 6).toFixed(2),
          duration: 7 + (i % 6),
          drift: i % 2 === 0 ? 14 : -14,
        }
      }),
    [],
  )

  // Runway centreline lights receding toward the horizon.
  const runwayLights = useMemo(() => Array.from({ length: 9 }, (_, i) => i), [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base vertical wash for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[color-mix(in_oklab,var(--primary)_8%,var(--background))]" />

      {/* Aurora blooms */}
      <div
        className="absolute -top-1/3 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 55%, transparent), transparent 62%)",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute top-1/4 -right-24 h-[55vh] w-[55vh] rounded-full blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--accent) 60%, transparent), transparent 60%)",
          opacity: 0.4,
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute bottom-0 -left-24 h-[45vh] w-[45vh] rounded-full blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 45%, transparent), transparent 65%)",
          opacity: 0.35,
          animationDelay: "-16s",
        }}
      />

      {/* Blueprint / HUD grid with parallax + perspective fade */}
      <motion.div
        className="absolute inset-0 grid-lines"
        style={{
          x: parallaxX,
          y: parallaxY,
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 85%)",
        }}
      />

      {/* Drifting cloud band */}
      <div className="absolute inset-x-0 top-1/3 h-[40vh] animate-cloud opacity-60">
        <div
          className="h-full w-full blur-2xl"
          style={{
            background:
              "radial-gradient(60% 60% at 20% 50%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%), radial-gradient(50% 50% at 70% 40%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* Runway centreline lights */}
      <div
        className="absolute bottom-0 left-1/2 flex h-[38vh] w-[42vw] -translate-x-1/2 flex-col items-center justify-end gap-[2.2vh]"
        style={{ perspective: "420px" }}
      >
        {runwayLights.map((i) => {
          const scale = 0.25 + (i / runwayLights.length) * 0.9
          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: `${scale * 12}px`,
                height: `${scale * 12}px`,
                background: "color-mix(in oklab, var(--accent) 90%, white)",
                boxShadow: "0 0 12px 3px color-mix(in oklab, var(--accent) 70%, transparent)",
                opacity: 0.15 + (i / runwayLights.length) * 0.55,
                animation: reduceMotion ? "none" : `aero-runway-pulse 2.4s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          )
        })}
      </div>

      {/* Floating particle field */}
      {!reduceMotion &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: "color-mix(in oklab, var(--accent) 80%, white)",
              boxShadow: "0 0 8px 1px color-mix(in oklab, var(--accent) 55%, transparent)",
            }}
            animate={{ y: [0, p.drift, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: p.duration,
              delay: Number(p.delay),
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Bottom vignette to anchor content */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}
