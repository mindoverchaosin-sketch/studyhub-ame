import { FiBookOpen, FiCheckCircle, FiTarget } from "react-icons/fi";
import StatCard from "@/components/ui/StatCard";

type ProgressOverviewProps = {
  modulesCompleted: number;
  topicsCompleted: number;
  quizScore: number;
};

const cards = [
  {
    label: "Modules completed",
    value: (value: number) => `${value}`,
    detail: "Core modules completed so far",
    icon: FiBookOpen,
  },
  {
    label: "Topics completed",
    value: (value: number) => `${value}`,
    detail: "Lessons and topics wrapped up",
    icon: FiCheckCircle,
  },
  {
    label: "Quiz score",
    value: (value: number) => `${value}%` ,
    detail: "Current performance across recent quizzes",
    icon: FiTarget,
  },
] as const;

export default function ProgressOverview({ modulesCompleted, topicsCompleted, quizScore }: ProgressOverviewProps) {
  const values = [modulesCompleted, topicsCompleted, quizScore];

  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label="Progress overview">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value(values[index])}
            detail={card.detail}
            icon={<Icon className="h-5 w-5" />}
          />
        );
      })}
    </section>
  );
}
