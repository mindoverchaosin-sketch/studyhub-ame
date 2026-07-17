import { FiAward, FiBarChart2, FiBookOpen, FiClipboard, FiFile } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const steps = [
  {
    title: "Learn",
    description: "Study structured DGCA & EASA lessons.",
    icon: FiBookOpen,
  },
  {
    title: "Practice",
    description: "Solve topic-wise quizzes and MCQs.",
    icon: FiClipboard,
  },
  {
    title: "Mock Exam",
    description: "Attempt timed mock exams based on the syllabus.",
    icon: FiFile,
  },
  {
    title: "Analyze",
    description: "Review strengths, weaknesses, and progress.",
    icon: FiBarChart2,
  },
  {
    title: "Get Licensed",
    description: "Prepare confidently for DGCA & EASA examinations.",
    icon: FiAward,
  },
] as const;

export default function LearningJourney() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="accent">Learning Journey</Badge>
          <Heading as="h2" size="lg" className="mt-5">
            From first lesson to final exam readiness.
          </Heading>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            AeroPrep guides students through each stage of preparation with clarity, momentum, and measurable progress.
          </p>
        </div>

        <div className="mt-12 space-y-6 md:mt-16 md:space-y-0">
          <div className="relative hidden md:block">
            <div className="absolute left-0 right-0 top-8 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
            <div className="relative grid gap-6 md:grid-cols-5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-6 text-left shadow-[0_16px_50px_-24px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(37,99,235,0.28)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <span className="text-xs uppercase tracking-[0.24em]">Step {index + 1}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Step {index + 1}</div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
