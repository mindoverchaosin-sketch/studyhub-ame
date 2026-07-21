interface ModuleSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ModuleSearch({ value, onChange }: ModuleSearchProps) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
      <span>🔎</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title, slug, or number"
        className="w-full bg-transparent outline-none"
        aria-label="Search modules"
      />
    </label>
  );
}
