import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const steps = [
  { title: "Pick a module", description: "Choose the exam domain that matters most right now." },
  { title: "Study in focus", description: "Move through structured lessons with guided revision." },
  { title: "Practice and review", description: "Use mock exams and instant feedback to sharpen confidence." },
] as const;

export default function HowItWorksSection() {
  return (
    <Section>
      <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge variant="accent">How AeroPrep works</Badge>
          <Heading as="h2" size="md" className="mt-4">
            A clear path from first lesson to final exam readiness.
          </Heading>
          <p className="mt-5 text-base leading-8 text-slate-600">
            The experience is designed to feel calm, focused, and motivating from day one.
          </p>
        </div>
        <div className="grid gap-4">
          {steps.map((step, index) => (
            <Card key={step.title} variant="elevated" className="flex items-start gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-30px_rgba(37,99,235,0.25)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                0{index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
