import type { ModuleStatus } from "@/types/module-admin";

interface ModuleStatusBadgeProps {
  status: ModuleStatus;
}

const styles: Record<ModuleStatus, string> = {
  Published: "bg-emerald-100 text-emerald-700",
  Draft: "bg-amber-100 text-amber-700",
  Archived: "bg-slate-200 text-slate-700",
};

export default function ModuleStatusBadge({ status }: ModuleStatusBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
