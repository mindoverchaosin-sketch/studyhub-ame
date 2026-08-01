import { FiClock, FiTarget, FiZap } from "react-icons/fi";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import StatCard from "@/components/ui/StatCard";

const stats = [
  { label: "Focus hours", value: "18h", detail: "Weekly study rhythm built around consistency and calm revision blocks.", icon: <FiClock className="h-5 w-5" /> },
  { label: "Exam readiness", value: "82%", detail: "Confidence grows through targeted practice, progress reviews and mock simulations.", icon: <FiTarget className="h-5 w-5" /> },
  { label: "Retention lift", value: "3.2x", detail: "Structured notes and spaced revision help future engineers retain what matters.", icon: <FiZap className="h-5 w-5" /> },
] as const;

export default function StatsSection() {
  return (
    <Section className="pt-0 sm:pt-0 lg:pt-0">
      <Container className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </Container>
    </Section>
  );
}
