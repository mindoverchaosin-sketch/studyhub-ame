import Link from "next/link";
import type { IconType } from "react-icons";
import { FiBookOpen, FiClock, FiFileText, FiPlayCircle } from "react-icons/fi";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: IconType;
};

const quickActions: QuickAction[] = [
  {
    title: "Review modules",
    description: "Jump back into your current topic and reinforce the key concepts.",
    href: "/modules",
    icon: FiBookOpen,
  },
  {
    title: "Start a quiz",
    description: "Practice with a short mock test and measure your readiness.",
    href: "/quiz",
    icon: FiPlayCircle,
  },
  {
    title: "Open notes",
    description: "Keep your handwritten summaries and reference points handy.",
    href: "/student/dashboard",
    icon: FiFileText,
  },
  {
    title: "Plan next session",
    description: "Set your next study block and stay consistent with your routine.",
    href: "/student/dashboard",
    icon: FiClock,
  },
];

export default function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {quickActions.map(({ title, description, href, icon: Icon }) => (
        <Link
          key={title}
          href={href}
          className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
