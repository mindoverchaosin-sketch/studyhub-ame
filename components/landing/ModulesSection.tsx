import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ModuleCard from "@/components/ui/ModuleCard";
import Section from "@/components/ui/Section";

const modules = [
  { title: "Airframe & Systems", description: "Structure, avionics, and maintenance logic in one clear path.", meta: <div className="space-y-2"><p>24 lessons</p><p>1,200 MCQs</p></div> },
  { title: "Electrical Fundamentals", description: "Core circuits, power systems, and troubleshooting with precision.", meta: <div className="space-y-2"><p>18 lessons</p><p>980 MCQs</p></div> },
  { title: "Propulsion", description: "Turbine engines and performance concepts in a calm study flow.", meta: <div className="space-y-2"><p>16 lessons</p><p>840 MCQs</p></div> },
  { title: "Human Factors", description: "CRM, safety, and behaviour in focused revision blocks.", meta: <div className="space-y-2"><p>12 lessons</p><p>640 MCQs</p></div> },
] as const;

export default function ModulesSection() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="accent">Popular DGCA modules</Badge>
            <Heading as="h2" size="md" className="mt-4">
              Study the exact topics examiners expect.
            </Heading>
          </div>
          <p className="max-w-xl text-base leading-8 text-slate-600">
            Every module is designed to be structured, digestible, and aligned with the demands of real-world aviation exams.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Explore more</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Progress through DGCA and EASA pathways with structured lessons that keep momentum high.</p>
          </div>
          <Button asChild variant="primary" size="md">
            <Link href="/modules">Explore Modules</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
