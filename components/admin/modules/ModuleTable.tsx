"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import type { ModuleAdminItem, ModuleFiltersState } from "@/types/module-admin";
import ModuleStatusBadge from "@/components/admin/modules/ModuleStatusBadge";
import ModuleActions from "@/components/admin/modules/ModuleActions";
import ModulePublishDialog from "@/components/admin/modules/ModulePublishDialog";
import ModuleDeleteDialog from "@/components/admin/modules/ModuleDeleteDialog";
import ModuleSearch from "@/components/admin/modules/ModuleSearch";
import ModuleFilters from "@/components/admin/modules/ModuleFilters";
import ModuleToolbar from "@/components/admin/modules/ModuleToolbar";
import BulkActionBar from "@/components/admin/modules/BulkActionBar";

interface ModuleTableProps {
  modules: ModuleAdminItem[];
}

const initialFilters: ModuleFiltersState = {
  status: "All",
  access: "All",
  difficulty: "All",
  search: "",
  sortBy: "displayOrder",
};

export default function ModuleTable({ modules }: ModuleTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ModuleFiltersState>(initialFilters);
  const [publishTarget, setPublishTarget] = useState<ModuleAdminItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleAdminItem | null>(null);

  const visibleModules = useMemo(() => {
    const entries = [...modules];
    const search = filters.search.trim().toLowerCase();

    return entries.filter((module) => {
      const matchesSearch = !search || [module.title, module.slug, module.moduleNumber].some((value) => value.toLowerCase().includes(search));
      const matchesStatus = filters.status === "All" || module.status === filters.status;
      const matchesAccess = filters.access === "All" || module.access === filters.access;
      const matchesDifficulty = filters.difficulty === "All" || module.difficulty === filters.difficulty;
      return matchesSearch && matchesStatus && matchesAccess && matchesDifficulty;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "updated":
          return a.lastUpdated.localeCompare(b.lastUpdated);
        case "created":
          return a.createdAt.localeCompare(b.createdAt);
        case "displayOrder":
        default:
          return a.displayOrder - b.displayOrder;
      }
    });
  }, [filters, modules]);

  const toggleSelection = (moduleId: string) => {
    setSelectedIds((current) => (current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]));
  };

  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <ModuleToolbar title="Module catalog">
          <ModuleSearch value={filters.search} onChange={(value) => setFilters((current) => ({ ...current, search: value }))} />
          <ModuleFilters filters={filters} onChange={setFilters} />
        </ModuleToolbar>
      </div>

      <BulkActionBar selectedCount={selectedIds.length} onPublish={() => undefined} onArchive={() => undefined} onDelete={() => undefined} />

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" aria-label="Select all modules" className="h-4 w-4 rounded border-slate-300" />
              </th>
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">Module #</th>
              <th className="px-4 py-3">Module title</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Lessons</th>
              <th className="px-4 py-3">Materials</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleModules.map((module) => (
              <tr key={module.id} className="border-t border-slate-200 bg-white/80">
                <td className="px-4 py-4">
                  <input checked={selectedIds.includes(module.id)} onChange={() => toggleSelection(module.id)} type="checkbox" className="h-4 w-4 rounded border-slate-300" aria-label={`Select ${module.title}`} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">{module.moduleNumber}</div>
                </td>
                <td className="px-4 py-4 font-medium text-slate-900">{module.moduleNumber}</td>
                <td className="px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{module.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{module.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700">{module.difficulty}</td>
                <td className="px-4 py-4 text-slate-700">{module.lessonsCount}</td>
                <td className="px-4 py-4 text-slate-700">{module.materialsCount}</td>
                <td className="px-4 py-4"><ModuleStatusBadge status={module.status} /></td>
                <td className="px-4 py-4 text-slate-700">{module.access}</td>
                <td className="px-4 py-4 text-slate-700">{module.lastUpdated}</td>
                <td className="px-4 py-4">
                  <ModuleActions onView={() => undefined} onEdit={() => undefined} onDuplicate={() => undefined} onArchive={() => undefined} onDelete={() => setDeleteTarget(module)} onPublish={() => setPublishTarget(module)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleModules.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-600">No modules match your current filters.</div>
      ) : null}

      <ModulePublishDialog moduleName={publishTarget?.title ?? "this module"} open={Boolean(publishTarget)} onCancel={() => setPublishTarget(null)} onConfirm={() => setPublishTarget(null)} />
      <ModuleDeleteDialog moduleName={deleteTarget?.title ?? "this module"} lessonsCount={deleteTarget?.lessonsCount ?? 0} materialsCount={deleteTarget?.materialsCount ?? 0} open={Boolean(deleteTarget)} onCancel={() => setDeleteTarget(null)} onConfirm={() => setDeleteTarget(null)} />
    </Card>
  );
}
