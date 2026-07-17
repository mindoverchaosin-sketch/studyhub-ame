import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "About AeroPrep",
  description: "Learn more about AeroPrep and the philosophy behind premium aviation education.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AboutPage() {
  return (
    <Section className="bg-slate-50">
      <Container className="max-w-3xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">About AeroPrep</p>
        <Heading as="h1" size="lg">
          Calm, rigorous preparation for ambitious aviation students.
        </Heading>
        <p className="text-lg leading-8 text-slate-600">
          AeroPrep brings structure, clarity, and confidence to DGCA and EASA preparation with curated lessons, adaptive practice, and polished study workflows.
        </p>
        <Link href="/register" className="inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Join AeroPrep
        </Link>
      </Container>
    </Section>
  );
}
