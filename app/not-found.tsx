import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export default function NotFound() {
  return (
    <Section className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#ffffff_100%)]">
      <Container className="max-w-2xl rounded-[2rem] border border-slate-200/80 bg-white p-10 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.25)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">404</p>
        <Heading as="h1" size="lg" className="mt-4">
          The page you are looking for is no longer here.
        </Heading>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Return to the homepage or explore the main learning areas to continue your AeroPrep journey.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            Go home
          </Link>
          <Link href="/modules" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Explore modules
          </Link>
        </div>
      </Container>
    </Section>
  );
}
