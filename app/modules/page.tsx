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

const examPaths = [
  {
    badge: "DGCA",
    title: "DGCA B1",
    description: "Focused structural, systems, and maintenance pathways for DGCA B1 certification, built around exam-ready theory and practical review.",
    highlight: "Airframe, powerplant, and avionics in one coherent path.",
  },
  {
    badge: "DGCA",
    title: "DGCA B2",
    description: "A dedicated route for avionics and electrical systems, with practical scenarios mapped to DGCA exam topics.",
    highlight: "Modern avionics, troubleshooting, and revision drills.",
  },
  {
    badge: "EASA",
    title: "EASA Combined B1 + B2",
    description: "A single, integrated preparation path for EASA candidates who want both B1 and B2 coverage in one streamlined experience.",
    highlight: "Unified learning path for cross-category readiness.",
  },
] as const;

export default async function ModulesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAuthenticated = Boolean(session?.user?.id);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const primaryHref = isAdmin ? "/admin/dashboard" : isAuthenticated ? "/student/courses" : "/login";
  const primaryLabel = isAdmin ? "Admin Dashboard" : isAuthenticated ? "Open course browser" : "Student Login";
  const secondaryHref = isAdmin ? "/admin/dashboard" : isAuthenticated ? "/student/dashboard" : "/register";
  const secondaryLabel = isAuthenticated ? "Open dashboard" : "Create student account";

  return (
    <Section className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#ffffff_100%)]">
      <Container className="space-y-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">AeroPrep modules</p>
          <Heading as="h1" size="lg" className="mt-4">
            Clear DGCA and EASA paths for exam-ready learning.
          </Heading>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Choose the route that matches your certification goal and start with structured, exam-focused content for real aircraft maintenance progress.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_18px_70px_-34px_rgba(15,23,42,0.12)]">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">DGCA learning paths</p>
              <h2 className="text-2xl font-semibold text-slate-950">B1 and B2 tracks for Indian exam readiness.</h2>
              <p className="text-sm leading-7 text-slate-600">
                DGCA candidates can select the exact maintenance discipline they need with separate B1 and B2 preparation paths.
              </p>
            </div>

            <div className="grid gap-4">
              {examPaths.slice(0, 2).map((path) => (
                <article key={path.title} className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">{path.badge}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">{path.title}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{path.description}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-600">{path.highlight}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-6 rounded-[2rem] border border-blue-100 bg-blue-50/70 p-8 shadow-[0_18px_70px_-34px_rgba(15,23,42,0.16)]">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">EASA combined path</p>
              <h2 className="text-2xl font-semibold text-slate-950">EASA Combined B1 + B2</h2>
              <p className="text-sm leading-7 text-slate-700">
                One unified path for EASA candidates who want both B1 and B2 coverage with a single, coherent study experience.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-blue-200 bg-white p-6">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">EASA</span>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">Combined B1 + B2 track</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">A complete integrated path with both airframe and avionics study blocks tailored to EASA exam expectations.</p>
              <p className="mt-4 text-sm font-semibold text-slate-600">Exam strategy, revision checklists, and eligibility-focused practice.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={primaryHref} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                {primaryLabel}
              </Link>
              <Link href={secondaryHref} className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-50">
                {secondaryLabel}
              </Link>
            </div>
          </section>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_70px_-34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Plan your next step</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Select your certification track and access the right course sequence.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:auto-cols-min lg:grid-flow-col">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Student login
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
