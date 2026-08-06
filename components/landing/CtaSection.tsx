import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-accent px-6 py-16 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="absolute inset-0 grid-lines opacity-30" />
          <div
            aria-hidden
            className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-black/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Ready for takeoff on your AME journey?
            </h2>
            <p className="mt-4 text-pretty text-base leading-7 text-primary-foreground/85 sm:text-lg">
              Join thousands of engineers mastering DGCA and EASA exams with an
              AI tutor in their corner. Start free today.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/modules"
                className="group inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-foreground shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Start Learning
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-white/20"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
