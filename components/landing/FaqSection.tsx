import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const faqs = [
  { question: "Who is AeroPrep built for?", answer: "AeroPrep is designed for DGCA and EASA candidates who want a more structured and premium prep experience." },
  { question: "Do I need prior aviation experience?", answer: "No. The platform is built to guide students from foundational topics through advanced exam preparation." },
  { question: "Can I use AeroPrep on mobile?", answer: "Yes. The layout is responsive and optimized for study on the go." },
] as const;

export default function FaqSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container className="max-w-4xl">
        <div className="max-w-2xl">
          <Badge variant="accent">FAQ</Badge>
          <Heading as="h2" size="md" className="mt-4">
            Questions students usually ask before getting started.
          </Heading>
        </div>
        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <Card key={faq.question} variant="default" className="transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-34px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
