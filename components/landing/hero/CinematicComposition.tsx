"use client"

import Image from "next/image"
import { motion, useReducedMotion, type MotionValue } from "motion/react"
import { PiAirplaneTiltFill } from "react-icons/pi"
import { FiActivity, FiCpu, FiTrendingUp, FiZap } from "react-icons/fi"
import { AnimatedCounter } from "./AnimatedCounter"

interface CinematicCompositionProps {
  parallaxX?: MotionValue<number>
  parallaxY?: MotionValue<number>
}

const floatTransition = (delay: number, duration: number) => ({
  duration,
  delay,
  repeat: Number.POSITIVE_INFINITY,
  ease: "easeInOut" as const,
})

export function CinematicComposition({ parallaxX, parallaxY }: CinematicCompositionProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[560px]"
      style={{ x: parallaxX, y: parallaxY }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Rotating HUD rings */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="animate-hud-spin absolute size-[92%] rounded-full border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)] opacity-50" />
        <div className="animate-hud-spin-reverse absolute size-[74%] rounded-full border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] opacity-40" />
        <div className="absolute size-[74%] rounded-full [background:conic-gradient(from_0deg,transparent,color-mix(in_oklab,var(--accent)_30%,transparent),transparent_40%)] opacity-40 blur-[1px]" />
      </div>

      {/* Central glass panel with aircraft blueprint */}
      <motion.div
        className="glass absolute left-1/2 top-1/2 aspect-[4/3] w-[64%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-2xl"
        animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
        transition={floatTransition(0, 8)}
      >
        <Image
          src="/images/aviation-blueprint.png"
          alt="Aircraft turbine and wing schematic blueprint"
          fill
          sizes="(max-width: 768px) 60vw, 360px"
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[color-mix(in_oklab,var(--primary)_35%,transparent)] to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
          <PiAirplaneTiltFill className="size-3.5 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">B1 · Airframe</span>
        </div>
      </motion.div>

      {/* Course progress card — top left */}
      <motion.div
        className="glass absolute left-0 top-[14%] w-[46%] rounded-2xl p-4 shadow-xl"
        animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
        transition={floatTransition(0.6, 9)}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Course Progress</span>
          <FiTrendingUp className="size-4 text-accent" />
        </div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          <AnimatedCounter value={78} suffix="%" />
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: "78%" }}
            transition={{ duration: 1.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Module 12 of 16 · DGCA B1</p>
      </motion.div>

      {/* AI tutor card — right */}
      <motion.div
        className="glass absolute right-0 top-[30%] w-[48%] rounded-2xl p-4 shadow-xl"
        animate={reduceMotion ? undefined : { y: [0, 12, 0] }}
        transition={floatTransition(1.1, 10)}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <FiCpu className="size-4" />
          </span>
          <span className="text-xs font-semibold text-foreground">AI Tutor</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {"\u201CExplain hydraulic system redundancy on the A320.\u201D"}
        </p>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-accent"
              animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
            />
          ))}
        </div>
      </motion.div>

      {/* Study streak widget — bottom left */}
      <motion.div
        className="glass absolute bottom-[16%] left-[6%] flex w-[40%] items-center gap-3 rounded-2xl p-3.5 shadow-xl"
        animate={reduceMotion ? undefined : { y: [0, 10, 0] }}
        transition={floatTransition(0.3, 8.5)}
      >
        <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
          <FiZap className="size-4" />
        </span>
        <div>
          <div className="text-lg font-semibold leading-none text-foreground">
            <AnimatedCounter value={42} />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Day streak</p>
        </div>
      </motion.div>

      {/* Mock exam widget — bottom right */}
      <motion.div
        className="glass absolute bottom-[8%] right-[4%] w-[44%] rounded-2xl p-4 shadow-xl"
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={floatTransition(0.9, 9.5)}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Mock Exam</span>
          <FiActivity className="size-4 text-primary" />
        </div>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            <AnimatedCounter value={91} />
          </span>
          <span className="pb-1 text-xs text-muted-foreground">/ 100</span>
        </div>
        <p className="mt-1 text-[11px] text-accent">Top 5% percentile</p>
      </motion.div>
    </motion.div>
  )
}
