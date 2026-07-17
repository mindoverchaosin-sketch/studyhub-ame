import { FiClock, FiTarget, FiZap } from "react-icons/fi";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import StatCard from "@/components/ui/StatCard";

const stats = [
  { label: "Focus hours", value: "18h", detail: "Weekly study rhythm built around consistency", icon: <FiClock className="h-5 w-5" /> },
  { label: "Exam readiness", value: "82%", detail: "Confidence grows with every mock exam", icon: <FiTarget className="h-5 w-5" /> },
  { label: "Retention lift", value: "3.2x", detail: "Revision systems built for better recall", icon: <FiZap className="h-5 w-5" /> },
] as const;

export default function StatsSection() {
  return (
    <Section className="pt-0">
      <Container className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </Container>
    </Section>
  );
}
