import { FiBook, FiClipboard, FiCpu, FiTrendingUp } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import FeatureCard from "@/components/ui/FeatureCard";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const features = [
  {
    title: "Structured Learning",
    description: "Follow the official DGCA and EASA syllabus with organized modules and lessons.",
    icon: <FiBook className="h-5 w-5" />,
  },
  {
    title: "Practice Like the Real Exam",
    description: "Train with thousands of topic-wise MCQs and full-length mock exams.",
    icon: <FiClipboard className="h-5 w-5" />,
  },
  {
    title: "Learn Faster",
    description: "Use memory tricks, diagrams, revision sheets, and visual explanations.",
    icon: <FiCpu className="h-5 w-5" />,
  },
  {
    title: "Track Your Progress",
    description: "Monitor your learning progress and identify weak modules quickly.",
    icon: <FiTrendingUp className="h-5 w-5" />,
  },
] as const;

export default function WhyAeroPrep() {
  return (
    <Section className="bg-slate-50/70">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Card variant="elevated" className="space-y-5">
            <Badge variant="accent">Why AeroPrep?</Badge>
            <Heading as="h2" size="lg" className="max-w-xl">
              A premium study experience built for ambitious aviation learners.
            </Heading>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              AeroPrep gives you a calm, structured path through DGCA and EASA preparation with practical tools that keep you moving.
            </p>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} title={feature.title} description={feature.description} icon={feature.icon} />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
