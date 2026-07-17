import { FaArrowRight, FaBookOpen, FaChartLine, FaPlane, FaRocket } from "react-icons/fa6";
import AircraftIllustration from "@/components/home/AircraftIllustration";
import ActionLink from "@/components/ui/ActionLink";

const stats = [
  { value: "14+", label: "DGCA modules" },
  { value: "5k+", label: "questions" },
  { value: "120+", label: "mock exams" },
] as const;

const floatingItems = [
  { icon: FaBookOpen, label: "Study notes" },
  { icon: FaChartLine, label: "Progress" },
  { icon: FaRocket, label: "Fast review" },
] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),radial-gradient(circle_at_85%_20%,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_48%,_#eef6ff_100%)] py-20 sm:py-24 lg:py-28 xl:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.72)_44%,transparent_100%)]" />
      <div className="absolute left-[-8rem] top-[-6rem] h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute right-[-5rem] top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm shadow-blue-100/70 backdrop-blur">
            <FaPlane className="h-4 w-4" />
            Premium aviation exam prep
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl xl:text-7xl">
            Learn aviation theory
            <span className="mt-2 block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              with calm, focused precision.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Structure your DGCA and EASA preparation with lessons, adaptive practice, and revision tools designed for serious aviation students.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <ActionLink href="/modules" ariaLabel="Start learning with AeroPrep">
              <span className="flex items-center gap-2">
                Start learning
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </ActionLink>
            <ActionLink href="/quiz" variant="secondary" ariaLabel="Explore AeroPrep quiz">
              Explore quiz
            </ActionLink>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm shadow-slate-100/80 backdrop-blur">
                <p className="text-xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.26),_transparent_72%)] blur-3xl" />
          <div className="relative flex h-[430px] w-full max-w-[520px] items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_35px_120px_-40px_rgba(37,99,235,0.46)] backdrop-blur-xl sm:p-8">
            <div className="absolute inset-6 rounded-[1.5rem] border border-blue-100/80" />

            <div className="absolute left-4 top-8 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur sm:left-6 sm:top-10">
              Live revision
            </div>

            <div className="absolute right-4 top-16 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur sm:right-6 sm:top-20">
              AI summaries
            </div>

            <AircraftIllustration />

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
              {floatingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-blue-950/20 backdrop-blur sm:px-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
