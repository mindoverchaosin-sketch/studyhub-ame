"use client"

import type React from "react"
import { useRef } from "react"
import Link from "next/link"
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "motion/react"
import { FiArrowRight, FiCompass } from "react-icons/fi"
import { HeroBackground } from "./hero/HeroBackground"
import { CinematicComposition } from "./hero/CinematicComposition"

const trustItems = ["DGCA", "EASA", "AI Powered", "Personalized Learning"]

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // Pointer parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  // Background moves a little, composition moves more (opposite for depth)
  const bgX = useTransform(springX, [-0.5, 0.5], [-12, 12])
  const bgY = useTransform(springY, [-0.5, 0.5], [-12, 12])
  const compX = useTransform(springX, [-0.5, 0.5], [26, -26])
  const compY = useTransform(springY, [-0.5, 0.5], [22, -22])

  // Scroll-driven fade of the whole hero content
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, 80])

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <HeroBackground parallaxX={bgX} parallaxY={bgY} />

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-28 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pt-24"
      >
        {/* Left — copy */}
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
          <motion.span
            variants={fadeUp}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            AI-Powered Aviation Learning
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.03] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Master DGCA &amp; EASA{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              With AI
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground"
          >
            Learn with structured lessons, AI tutoring, mock exams, adaptive study plans, and
            performance analytics&mdash;all in one premium platform.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/modules"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_20px_45px_-18px_var(--primary)] transition-colors"
              >
                Start Learning
                <FiArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/modules"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                <FiCompass className="size-5 text-accent" aria-hidden />
                Explore Courses
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust row */}
          <motion.ul
            variants={fadeUp}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            {trustItems.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />}
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {item}
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right — cinematic composition */}
        <div className="relative">
          <CinematicComposition parallaxX={compX} parallaxY={compY} />
        </div>
      </motion.div>

      {/* Scroll cue */}
      {!reduceMotion && (
        <motion.div
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-border p-1">
            <motion.span
              className="size-1.5 rounded-full bg-accent"
              animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </section>
  )
}
