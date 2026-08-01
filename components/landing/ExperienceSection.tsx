import { FiBookOpen, FiCpu, FiLayers, FiTrendingUp, FiZap } from "react-icons/fi";
import Container from "@/components/ui/Container";
import FeatureCard from "@/components/ui/FeatureCard";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const features = [
  { title: "Revision Notes", description: "High-yield summaries and structured notes built for rapid review before each exam window.", icon: <FiBookOpen className="h-5 w-5" /> },
  { title: "Video Lessons", description: "Concise, exam-focused instruction that makes complex AME topics easier to absorb.", icon: <FiLayers className="h-5 w-5" /> },
  { title: "Mock Tests", description: "Realistic timed assessments with detailed feedback to sharpen exam readiness.", icon: <FiZap className="h-5 w-5" /> },
  { title: "AI Tutor", description: "Personalized support for weak areas, tricky concepts, and daily learning momentum.", icon: <FiCpu className="h-5 w-5" /> },
  { title: "Performance Analytics", description: "Clear insight into topic strength, streaks, progress and exam confidence.", icon: <FiTrendingUp className="h-5 w-5" /> },
  { title: "Progress Tracking", description: "Stay aligned with your study plan through milestone-driven growth and accountability.", icon: <FiLayers className="h-5 w-5" /> },
] as const;

export default function ExperienceSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Feature suite</p>
          <Heading as="h2" size="md" className="mt-4">
            Built for disciplined AME students who want clarity, confidence and momentum.
          </Heading>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
