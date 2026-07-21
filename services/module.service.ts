import { moduleAdminSeed } from "@/lib/mock/modules-admin";
import type { ModuleAdminItem, ModuleFiltersState, ModuleSortOption } from "@/types/module-admin";

export async function getModules(): Promise<ModuleAdminItem[]> {
  return moduleAdminSeed;
}

export async function getModule(id: string): Promise<ModuleAdminItem | null> {
  return moduleAdminSeed.find((module) => module.id === id) ?? null;
}

export async function searchModules(query: string): Promise<ModuleAdminItem[]> {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return moduleAdminSeed;
  }

  return moduleAdminSeed.filter((module) => {
    return [module.title, module.slug, module.moduleNumber].some((value) =>
      value.toLowerCase().includes(normalized),
    );
  });
}

export async function filterModules(filters: ModuleFiltersState): Promise<ModuleAdminItem[]> {
  let items = [...moduleAdminSeed];

  if (filters.search) {
    items = items.filter((module) => {
      const haystack = `${module.title} ${module.slug} ${module.moduleNumber}`.toLowerCase();
      return haystack.includes(filters.search.toLowerCase());
    });
  }

  if (filters.status !== "All") {
    items = items.filter((module) => module.status === filters.status);
  }

  if (filters.access !== "All") {
    items = items.filter((module) => module.access === filters.access);
  }

  if (filters.difficulty !== "All") {
    items = items.filter((module) => module.difficulty === filters.difficulty);
  }

  return items;
}

export async function sortModules(items: ModuleAdminItem[], sortBy: ModuleSortOption): Promise<ModuleAdminItem[]> {
  const sorted = [...items];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "updated":
      return sorted.sort((a, b) => a.lastUpdated.localeCompare(b.lastUpdated));
    case "created":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "displayOrder":
    default:
      return sorted.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

export async function publishModule(id: string): Promise<ModuleAdminItem | null> {
  const module = moduleAdminSeed.find((item) => item.id === id);
  return module ? { ...module, status: "Published" } : null;
}

export async function archiveModule(id: string): Promise<ModuleAdminItem | null> {
  const module = moduleAdminSeed.find((item) => item.id === id);
  return module ? { ...module, status: "Archived" } : null;
}

export async function deleteModule(id: string): Promise<boolean> {
  return moduleAdminSeed.some((module) => module.id === id);
}

export async function duplicateModule(id: string): Promise<ModuleAdminItem | null> {
  const module = moduleAdminSeed.find((item) => item.id === id);
  return module ? { ...module, id: `${module.id}-copy`, title: `${module.title} Copy` } : null;
}
