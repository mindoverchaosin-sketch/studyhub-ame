import Image from "next/image";
import { FiBookOpen, FiCompass, FiTrendingUp } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const stats = [
  { label: "DGCA Modules", value: "14" },
  { label: "EASA Modules", value: "17" },
  { label: "Practice Questions", value: "5000+" },
] as const;

const floatingItems = [
  { icon: FiBookOpen, label: "Revision Notes" },
  { icon: FiCompass, label: "Adaptive Practice" },
  { icon: FiTrendingUp, label: "Live Progress" },
] as const;

export default function HeroSection() {
  return (
    <Section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_40%),radial-gradient(circle_at_85%_15%,_rgba(96,165,250,0.18),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_50%,_#eef6ff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.84)_44%,transparent_100%)]" />
      <div className="absolute left-[-5rem] top-[-6rem] h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute right-[-4rem] top-10 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />

      <Container className="relative grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <Badge variant="accent">DGCA & EASA Part-66 Learning Platform</Badge>
          <Heading as="h1" size="xl" className="mt-6 max-w-3xl leading-[0.95]">
            Master DGCA & EASA Aircraft Maintenance Exams
          </Heading>
          <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl">
            Learn faster with structured modules, clear revision notes, mock tests, and guided practice tailored for serious aviation students.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" size="lg">
              Start Learning
            </Button>
            <Button variant="secondary" size="lg">
              Browse Modules
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.25rem] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.24)] backdrop-blur">
                <p className="text-xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.2),_transparent_72%)] blur-3xl" />
          <div className="relative w-full max-w-[560px] rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_40px_140px_-44px_rgba(37,99,235,0.5)] backdrop-blur-xl sm:p-7">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-[linear-gradient(145deg,_#1e3a8a_0%,_#2563eb_38%,_#0891b2_100%)] p-6 sm:p-8">
              <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur">
                Live Revision
              </div>
              <div className="absolute right-4 top-16 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur">
                AI Summaries
              </div>

              <div className="relative mx-auto flex aspect-[4/3] w-full max-w-[420px] items-center justify-center">
                <Image src="/aircraft-illustration.svg" alt="Aircraft illustration for AeroPrep" fill className="object-contain" priority />
              </div>

              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-3 px-4">
                {floatingItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-medium text-white shadow-[0_10px_30px_rgba(2,6,23,0.2)] backdrop-blur sm:px-4">
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
      </Container>
    </Section>
  );
}
