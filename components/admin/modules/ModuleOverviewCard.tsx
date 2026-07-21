import Card from "@/components/ui/Card";
import type { ModuleAdminItem } from "@/types/module-admin";

interface ModuleOverviewCardProps {
  moduleItem: ModuleAdminItem;
}

export default function ModuleOverviewCard({ moduleItem }: ModuleOverviewCardProps) {
  return (
    <Card variant="elevated" className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Overview</p>
          <h4 className="mt-2 text-xl font-semibold text-slate-950">{moduleItem.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{moduleItem.description}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{moduleItem.moduleNumber}</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Difficulty</p>
          <p className="mt-2 font-semibold text-slate-900">{moduleItem.difficulty}</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Estimated hours</p>
          <p className="mt-2 font-semibold text-slate-900">{moduleItem.estimatedHours}h</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Access</p>
          <p className="mt-2 font-semibold text-slate-900">{moduleItem.access}</p>
        </div>
      </div>
    </Card>
  );
}
