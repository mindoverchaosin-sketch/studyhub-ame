import type { ModuleStatus } from "@/lib/mock/modules";

type ModuleFiltersProps = {
  value: ModuleStatus | "ALL";
  onChange: (value: ModuleStatus | "ALL") => void;
};

const filters: Array<{ label: string; value: ModuleStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "Locked", value: "LOCKED" },
];

export default function ModuleFilters({ value, onChange }: ModuleFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter modules">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            value === filter.value
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
