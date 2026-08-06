import type { IconType } from "react-icons";
import {
  FiCpu,
  FiCalendar,
  FiFileText,
  FiDatabase,
  FiBarChart2,
  FiActivity,
  FiZap,
  FiShare2,
} from "react-icons/fi";

type Feature = {
  icon: IconType;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: FiCpu,
    title: "AI Tutor",
    description: "Ask anything and get instant, syllabus-aware explanations tailored to your level.",
  },
  {
    icon: FiCalendar,
    title: "Adaptive Study Planner",
    description: "A dynamic schedule that reshapes itself around your exam date and weak areas.",
  },
  {
    icon: FiFileText,
    title: "Mock Exams",
    description: "Full-length, timed papers that mirror real DGCA and EASA exam conditions.",
  },
  {
    icon: FiDatabase,
    title: "Question Bank",
    description: "Thousands of categorized questions with detailed, worked solutions.",
  },
  {
    icon: FiBarChart2,
    title: "Performance Analytics",
    description: "See mastery by topic and pinpoint exactly where to focus next.",
  },
  {
    icon: FiActivity,
    title: "Progress Tracking",
    description: "Track completion across every module and licence category in one place.",
  },
  {
    icon: FiZap,
    title: "Learning Streaks",
    description: "Build consistency with daily goals, streaks and momentum rewards.",
  },
  {
    icon: FiShare2,
    title: "Knowledge Graph",
    description: "Visualize how concepts connect across modules for deeper understanding.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Everything you need
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A complete AME preparation cockpit
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Purpose-built tools that turn scattered studying into a focused,
            measurable flight plan.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group relative rounded-3xl border border-border bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
