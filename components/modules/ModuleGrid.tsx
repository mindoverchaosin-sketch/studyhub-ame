import type { Module } from "@/types/module";
import ModuleCard from "@/components/modules/ModuleCard";

type ModuleGridProps = {
  modules: Module[];
};

export default function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {modules.map((moduleItem) => (
        <ModuleCard key={moduleItem.id} moduleItem={moduleItem} />
      ))}
    </div>
  );
}
