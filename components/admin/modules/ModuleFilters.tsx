import type { ModuleAccess, ModuleDifficulty, ModuleStatus, ModuleFiltersState } from "@/types/module-admin";

interface ModuleFiltersProps {
  filters: ModuleFiltersState;
  onChange: (filters: ModuleFiltersState) => void;
}

const statusOptions: Array<ModuleStatus | "All"> = ["All", "Published", "Draft", "Archived"];
const accessOptions: Array<ModuleAccess | "All"> = ["All", "Free", "Premium"];
const difficultyOptions: Array<ModuleDifficulty | "All"> = ["All", "Beginner", "Intermediate", "Advanced"];

export default function ModuleFilters({ filters, onChange }: ModuleFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value as ModuleStatus | "All" })}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? "All statuses" : option}
          </option>
        ))}
      </select>

      <select
        value={filters.access}
        onChange={(event) => onChange({ ...filters, access: event.target.value as ModuleAccess | "All" })}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {accessOptions.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? "All access" : option}
          </option>
        ))}
      </select>

      <select
        value={filters.difficulty}
        onChange={(event) => onChange({ ...filters, difficulty: event.target.value as ModuleDifficulty | "All" })}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {difficultyOptions.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? "All difficulty" : option}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy}
        onChange={(event) => onChange({ ...filters, sortBy: event.target.value as ModuleFiltersState["sortBy"] })}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="displayOrder">Sort: display order</option>
        <option value="name">Sort: name</option>
        <option value="updated">Sort: updated</option>
        <option value="created">Sort: created</option>
      </select>
    </div>
  );
}
