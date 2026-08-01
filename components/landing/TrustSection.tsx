import { FiCheckCircle } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const trustPoints = [
  "DGCA preparation with structured exam pathways",
  "EASA preparation with clear revision flows",
  "Practice questions, mock exams and progress tracking",
] as const;

export default function TrustSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.28)] sm:p-10 lg:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="accent">Built for serious learners</Badge>
            <Heading as="h2" size="md" className="mt-4">
              Designed to help aviation students learn with discipline and confidence.
            </Heading>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)]">
                <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
