import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

export default function CtaSection() {
  return (
    <Section>
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_30%),linear-gradient(135deg,_#2563eb_0%,_#1d4ed8_45%,_#0891b2_100%)] px-8 py-16 text-white shadow-[0_45px_140px_-36px_rgba(37,99,235,0.65)] sm:px-12 lg:px-16 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Start preparing smarter</p>
              <Heading as="h2" size="md" className="mt-3 text-white">
                Elevate your DGCA and EASA prep with a more premium study experience.
              </Heading>
              <p className="mt-4 text-lg leading-8 text-blue-50">
                Join aviation learners building confidence with structured content, realistic practice, and calm revision workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="border-white/40 bg-white text-blue-700 hover:bg-slate-100">
                Get started
              </Button>
              <Button className="border border-white/40 bg-transparent text-white hover:bg-white/10">
                Try a demo quiz
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
