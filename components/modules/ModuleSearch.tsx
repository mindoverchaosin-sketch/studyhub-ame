import { FiSearch } from "react-icons/fi";

type ModuleSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ModuleSearch({ value, onChange }: ModuleSearchProps) {
  return (
    <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <FiSearch className="h-4 w-4 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search modules"
        className="w-full bg-transparent text-sm text-slate-700 outline-none"
        aria-label="Search modules"
      />
    </label>
  );
}
