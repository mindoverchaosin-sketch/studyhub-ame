import { FiBookOpen, FiLayers, FiZap } from "react-icons/fi";
import Container from "@/components/ui/Container";
import FeatureCard from "@/components/ui/FeatureCard";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const features = [
  { title: "Structured study paths", description: "Turn complex topics into calm, sequential learning blocks.", icon: <FiLayers className="h-5 w-5" /> },
  { title: "Revision-ready notes", description: "Capture clear summaries and high-yield takeaways for review.", icon: <FiBookOpen className="h-5 w-5" /> },
  { title: "Smart practice", description: "Use adaptive quiz flows and instant feedback to build confidence.", icon: <FiZap className="h-5 w-5" /> },
] as const;

export default function ExperienceSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Learning experience</p>
          <Heading as="h2" size="md" className="mt-4">
            A premium environment for focused revision and real momentum.
          </Heading>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
