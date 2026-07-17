import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ModuleCard from "@/components/ui/ModuleCard";
import Section from "@/components/ui/Section";

const modules = [
  {
    number: "01",
    name: "Mathematics",
    lessons: 12,
    mcqs: 320,
    difficulty: "Foundation",
  },
  {
    number: "02",
    name: "Physics",
    lessons: 14,
    mcqs: 360,
    difficulty: "Core",
  },
  {
    number: "03",
    name: "Electrical Fundamentals",
    lessons: 16,
    mcqs: 410,
    difficulty: "Core",
  },
  {
    number: "04",
    name: "Maintenance Practices",
    lessons: 18,
    mcqs: 470,
    difficulty: "Advanced",
  },
] as const;

export default function DGCAModules() {
  return (
    <Section className="bg-slate-50/70">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="accent">DGCA Modules Preview</Badge>
            <Heading as="h2" size="lg" className="mt-4">
              Official DGCA modules, structured for focused preparation.
            </Heading>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Learn through the same module framework used in real exam preparation, with clear progression and measurable practice.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.number}
              title={`${module.number} · ${module.name}`}
              description="Aligned to DGCA syllabus and exam-ready study flow."
              meta={
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{module.lessons} lessons</span>
                    <span>{module.mcqs} MCQs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                      {module.difficulty}
                    </span>
                    <button type="button" aria-label={`View ${module.name}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600">
                      <FiArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              }
              icon={<FiBookOpen className="h-5 w-5" />}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
