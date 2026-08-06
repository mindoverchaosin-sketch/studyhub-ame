import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Modules | AeroPrep",
  description: "Browse curated DGCA and EASA preparation modules with structured study paths.",
  robots: {
    index: false,
    follow: false,
  },
};

const modules = [
  {
    title: "Airframes Fundamentals",
    description: "Master the core systems and maintenance concepts behind modern aircraft structures.",
  },
  {
    title: "Powerplant Systems",
    description: "Build confidence through engine theory, performance, and practical exam scenarios.",
  },
  {
    title: "Electrical & Avionics",
    description: "Prepare for high-yield questions across circuits, avionics, and troubleshooting.",
  },
] as const;

export default async function ModulesPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const isAuthenticated = Boolean(session?.user?.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  return (
    <Section className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#ffffff_100%)]">
      <Container className="space-y-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">AeroPrep modules</p>
          <Heading as="h1" size="lg" className="mt-4">
            Study with clear, premium learning paths.
          </Heading>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Every module is designed to move from concept explanation to deeper revision and exam readiness without overwhelming the learner.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {modules.map((module) => (
            <article key={module.title} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-7 shadow-[0_18px_70px_-34px_rgba(15,23,42,0.3)]">
              <h2 className="text-xl font-semibold text-slate-950">{module.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
            </article>
          ))}
        </div>

        <div className="rounded-[2rem] border border-blue-100 bg-blue-50/70 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Ready to continue?</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/register" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Get Started
                </Link>
                <Link href="/login" className="rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-50">
                  Sign In
                </Link>
              </>
            ) : isAdmin ? (
              <Link href="/admin/dashboard" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Admin Dashboard
              </Link>
            ) : (
              <>
                <Link href="/student/courses" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Continue learning
                </Link>
                <Link href="/student/dashboard" className="rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-50">
                  Open dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
