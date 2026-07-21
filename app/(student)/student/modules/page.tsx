"use client";

import { useMemo, useState } from "react";
import ModuleSearch from "@/components/modules/ModuleSearch";
import ModuleFilters from "@/components/modules/ModuleFilters";
import ModuleGrid from "@/components/modules/ModuleGrid";
import EmptyState from "@/components/dashboard/EmptyState";
import { FiBookOpen } from "react-icons/fi";
import { mockModules } from "@/lib/mock/modules";
import type { ModuleStatus } from "@/lib/mock/modules";
import DashboardSection from "@/components/dashboard/DashboardSection";

export default function StudentModulesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ModuleStatus | "ALL">("ALL");

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mockModules.filter((moduleItem) => {
      const matchesFilter = filter === "ALL" || moduleItem.status === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        moduleItem.title.toLowerCase().includes(normalizedQuery) ||
        moduleItem.description.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardSection title="DGCA Modules" description="Browse your aviation modules, track progress, and jump into your next lesson.">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ModuleSearch value={query} onChange={setQuery} />
            <ModuleFilters value={filter} onChange={setFilter} />
          </div>
        </DashboardSection>

        {filteredModules.length > 0 ? (
          <ModuleGrid modules={filteredModules} />
        ) : (
          <EmptyState
            icon={<FiBookOpen className="h-6 w-6" />}
            title="No modules found"
            description="Try widening your search or switching filters to see more content."
          />
        )}
      </div>
    </div>
  );
}
