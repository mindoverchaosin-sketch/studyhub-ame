import ActionLink from "@/components/ui/ActionLink";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8 lg:pb-28">
      <div className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_30%),linear-gradient(135deg,_#2563eb_0%,_#1d4ed8_45%,_#0891b2_100%)] px-8 py-16 text-white shadow-[0_35px_120px_-30px_rgba(37,99,235,0.65)] sm:px-12 lg:px-16 lg:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Start preparing smarter</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Elevate your DGCA and EASA exam prep with a premium study experience.
            </h2>
            <p className="mt-4 text-lg leading-8 text-blue-50">
              Join aviation learners building confidence with structured content, realistic practice, and calm revision routines.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionLink href="/modules" variant="secondary" className="bg-white text-blue-700 shadow-lg shadow-blue-950/20 hover:bg-slate-100">
              Get Started
            </ActionLink>
            <ActionLink href="/quiz" className="border border-white/40 bg-transparent text-white hover:bg-white/10">
              Try a Demo Quiz
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
