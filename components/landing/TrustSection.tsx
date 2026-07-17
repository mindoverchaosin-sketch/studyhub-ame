import { FiCheckCircle } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const trustPoints = [
  "Designed for serious DGCA and EASA students",
  "Exam-aligned content and clear revision paths",
  "Fast feedback and premium study workflows",
] as const;

export default function TrustSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.28)] sm:p-10 lg:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="accent">Trusted by ambitious learners</Badge>
            <Heading as="h2" size="md" className="mt-4">
              Built for aviation students who want depth, clarity, and momentum.
            </Heading>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)]">
                <FiCheckCircle className="h-4 w-4 text-blue-600" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
