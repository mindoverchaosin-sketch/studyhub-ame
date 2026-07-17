import Badge from "@/components/ui/Badge";
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
      </Container>
    </Section>
  );
}
