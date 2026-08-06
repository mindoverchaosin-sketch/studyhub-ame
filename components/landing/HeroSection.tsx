import Link from "next/link";
import {
  FiArrowRight,
  FiPlayCircle,
  FiCpu,
  FiTrendingUp,
  FiCheckCircle,
} from "react-icons/fi";

const metrics = [
  { value: "14+", label: "DGCA Modules" },
  { value: "17", label: "EASA Modules" },
  { value: "5,000+", label: "Practice Questions" },
  { value: "10K+", label: "Engineers Trained" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Aviation blueprint backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-[0.16] dark:opacity-[0.34]"
        style={{ backgroundImage: "url(/images/aviation-blueprint.png)" }}
      />
      <div aria-hidden className="absolute inset-0 -z-20 grid-lines" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--hero-overlay)" }}
      />
      {/* Cloud / runway glows */}
      <div
        aria-hidden
        className="absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute right-[-6rem] top-10 -z-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            AI-Powered AME Learning
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Master DGCA &amp; EASA Exams{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
            AI Tutor, Mock Exams, Question Bank, Study Planner and personalized
            learning for Aircraft Maintenance Engineers.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/modules"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_20px_45px_-18px_var(--primary)] transition-transform hover:-translate-y-0.5"
            >
              Start Learning
              <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-primary/40"
            >
              <FiPlayCircle className="h-5 w-5 text-primary" aria-hidden />
              Watch Demo
            </button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <dt className="sr-only">{m.label}</dt>
                <dd className="text-2xl font-bold tracking-tight text-foreground">
                  {m.value}
                </dd>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {m.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        {/* Glass HUD dashboard preview */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="glass animate-float rounded-3xl p-5 shadow-[0_50px_120px_-45px_rgba(8,15,35,0.6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <FiCpu className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Study Coach</p>
                  <p className="text-xs text-muted-foreground">Module 7 · Electrical Fundamentals</p>
                </div>
              </div>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
                Live
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Today&apos;s Quiz</span>
                <span className="font-mono text-muted-foreground">12 questions</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">84% mastery · keep the streak going</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background/50 p-4">
                <FiTrendingUp className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-3 text-xl font-bold text-foreground">3 / 5</p>
                <p className="text-xs text-muted-foreground">Mock exams passed</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/50 p-4">
                <FiCheckCircle className="h-5 w-5 text-accent" aria-hidden />
                <p className="mt-3 text-xl font-bold text-foreground">27 day</p>
                <p className="text-xs text-muted-foreground">Learning streak</p>
              </div>
            </div>
          </div>

          <div className="glass absolute -bottom-6 -left-4 hidden w-52 rounded-2xl p-4 shadow-xl sm:block">
            <p className="text-xs font-medium text-muted-foreground">Next milestone</p>
            <p className="mt-1 text-sm font-semibold text-foreground">EASA Module 9 unlocked</p>
          </div>
        </div>
      </div>
    </section>
  );
}
