import { FiBookOpen, FiCheckCircle, FiTarget } from "react-icons/fi";

type ProgressOverviewProps = {
  modulesCompleted: number;
  topicsCompleted: number;
  quizScore: number;
};

const cards = [
  {
    label: "Modules completed",
    value: (value: number) => `${value}`,
    icon: FiBookOpen,
  },
  {
    label: "Topics completed",
    value: (value: number) => `${value}`,
    icon: FiCheckCircle,
  },
  {
    label: "Quiz score",
    value: (value: number) => `${value}%`,
    icon: FiTarget,
  },
] as const;

export default function ProgressOverview({ modulesCompleted, topicsCompleted, quizScore }: ProgressOverviewProps) {
  const values = [modulesCompleted, topicsCompleted, quizScore];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{card.value(values[index])}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
