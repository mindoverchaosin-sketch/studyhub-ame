import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Pricing | AeroPrep",
  description: "See flexible plans for aviation students preparing for DGCA and EASA exams.",
  robots: {
    index: false,
    follow: false,
  },
};

const plans = [
  { name: "Starter", price: "$29", description: "Core modules and revision tools for focused self-study." },
  { name: "Pro", price: "$79", description: "Mock exams, analytics, and deeper study guidance for serious candidates." },
  { name: "Teams", price: "$149", description: "Shared dashboards and collaborative prep for coaching groups." },
] as const;

export default function PricingPage() {
  return (
    <Section className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#ffffff_100%)]">
      <Container className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Flexible pricing</p>
          <Heading as="h1" size="lg" className="mt-4">
            Pick the plan that matches your study pace.
          </Heading>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Whether you are preparing independently or coaching a team, AeroPrep adapts to the depth of support you need.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-7 shadow-[0_18px_70px_-34px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-blue-600">{plan.name}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{plan.price}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
            </article>
          ))}
        </div>

        <Link href="/register" className="inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Get started
        </Link>
      </Container>
    </Section>
  );
}
