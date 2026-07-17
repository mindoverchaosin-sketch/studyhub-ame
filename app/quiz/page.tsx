import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Practice Quiz | AeroPrep",
  description: "Take timed practice quizzes built for DGCA and EASA exam preparation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizPage() {
  return (
    <Section className="bg-slate-50">
      <Container className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Practice mode</p>
          <Heading as="h1" size="lg" className="mt-4">
            Sharpen recall with timed mock questions.
          </Heading>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Our quizzes are structured to mirror exam pacing so you build recall, confidence, and calm under pressure.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_80px_-36px_rgba(15,23,42,0.25)]">
          <h2 className="text-2xl font-semibold text-slate-950">Current sprint</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
            15 questions • 20-minute timer • performance insights after completion.
          </p>
          <Link href="/register" className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            Start quiz
          </Link>
        </div>
      </Container>
    </Section>
  );
}
