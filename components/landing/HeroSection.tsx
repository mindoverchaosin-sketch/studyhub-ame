import Link from "next/link";
import { FiBookOpen, FiCpu, FiPlayCircle, FiShield, FiStar, FiTrendingUp } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const highlights = [
  { icon: FiStar, title: "AI Tutor" },
  { icon: FiTrendingUp, title: "Progress" },
  { icon: FiPlayCircle, title: "Today's Quiz" },
  { icon: FiBookOpen, title: "Study Notes" },
  { icon: FiShield, title: "Mock Exams" },
] as const;

const metricCards = [
  { title: "14+", label: "DGCA Modules" },
  { title: "17+", label: "EASA Modules" },
  { title: "5000+", label: "Practice Questions" },
  { title: "10K+", label: "Students" },
] as const;

export default function HeroSection() {
  return (
    <Section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_42%),radial-gradient(circle_at_88%_12%,_rgba(56,189,248,0.16),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_50%,_#eef6ff_100%)] py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.84)_44%,transparent_100%)]" />
      <div className="absolute left-[-4rem] top-[-5rem] h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute right-[-3rem] top-6 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />

      <Container className="relative grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <Badge variant="accent">✈ India&apos;s Modern DGCA & EASA Learning Platform</Badge>
          <Heading as="h1" size="xl" className="mt-6 max-w-3xl leading-[0.95] text-slate-950">
            Master DGCA & EASA
            <span className="mt-3 block text-slate-700">Aircraft Maintenance Engineering</span>
          </Heading>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            Structured learning, AI-powered practice, revision notes, realistic mock exams and progress tracking designed to help future Aircraft Maintenance Engineers succeed.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/modules">Start Learning</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/quiz">Browse Courses</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.24)] backdrop-blur">
                <p className="text-xl font-semibold tracking-tight text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.18),_transparent_72%)] blur-3xl" />
          <div className="relative w-full max-w-[560px] rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-[0_40px_140px_-44px_rgba(37,99,235,0.32)] backdrop-blur-xl sm:p-6 lg:p-7">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/30 bg-[linear-gradient(145deg,_#071A3D_0%,_#2563eb_42%,_#38BDF8_100%)] p-6 sm:p-8">
              <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur">
                Live Revision
              </div>
              <div className="absolute right-4 top-16 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur">
                AI Study Coach
              </div>

              <div className="relative mx-auto mt-8 grid max-w-[460px] gap-3 rounded-[1.5rem] border border-white/20 bg-slate-950/20 p-4 backdrop-blur md:grid-cols-[0.9fr_1.1fr] md:p-5">
                <div className="rounded-[1.25rem] border border-white/20 bg-white/20 p-3 text-white shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FiCpu className="h-4 w-4" />
                    AI Tutor
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-100">Personalized coaching for weak topics and exam confidence.</p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-[1.25rem] border border-white/20 bg-white/15 p-4 text-white">
                    <div className="text-sm font-semibold">Today&apos;s Quiz</div>
                    <div className="mt-2 text-2xl font-semibold">12 questions</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/20 bg-white/15 p-3 text-white">
                      <div className="text-sm font-medium">Progress</div>
                      <div className="mt-1 text-xl font-semibold">84%</div>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/20 bg-white/15 p-3 text-white">
                      <div className="text-sm font-medium">Mock Exams</div>
                      <div className="mt-1 text-xl font-semibold">3/5</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3 px-2">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-medium text-white shadow-[0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur sm:px-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {item.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
