import type { ReactNode } from "react";
import AeroPrepLogo from "@/components/brand/AeroPrepLogo";
import RoleAwareHomeLink from "@/components/brand/RoleAwareHomeLink";
import { FiCheckCircle } from "react-icons/fi";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  theme?: "default" | "admin";
};

const highlights = [
  "Exam-ready study paths for DGCA and EASA",
  "Smart revision planning and progress insights",
  "Premium learning experience built for serious students",
];

const adminHighlights = [
  "Centralized admin tools for courses, students, and reports",
  "Quick review workflows for exam content and publishing",
  "Secure access for AeroPrep operations and team management",
];

export default function AuthLayout({ children, title, subtitle, theme = "default" }: AuthLayoutProps) {
  const styleHighlights = theme === "admin" ? adminHighlights : highlights;
  const panelLabel = theme === "admin" ? "Admin console" : "Phase 1";
  const accentClass = theme === "admin" ? "text-cyan-300" : "text-blue-300";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_40%),linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:flex-row">
        <section className="flex flex-1 flex-col justify-between bg-slate-950 p-8 text-white sm:p-10 lg:w-[46%] lg:p-12">
          <div>
            <RoleAwareHomeLink className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-slate-300 transition hover:text-white">
              <AeroPrepLogo variant="horizontal" invert />
            </RoleAwareHomeLink>

            <div className="mt-10 max-w-md">
              <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${accentClass}`}>{panelLabel}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-4 text-base leading-8 text-slate-300">{subtitle}</p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {styleHighlights.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <FiCheckCircle className={`mt-0.5 h-5 w-5 shrink-0 ${accentClass}`} />
                <p className="text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-slate-50/70 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}
