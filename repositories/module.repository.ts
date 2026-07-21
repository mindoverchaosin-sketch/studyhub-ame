import type { ModuleAdminItem, ModuleFiltersState, ModuleSortOption } from "@/types/module-admin";

export interface ModuleRepository {
  getModules(): Promise<ModuleAdminItem[]>;
  getModule(id: string): Promise<ModuleAdminItem | null>;
  searchModules(query: string): Promise<ModuleAdminItem[]>;
  filterModules(filters: ModuleFiltersState): Promise<ModuleAdminItem[]>;
  sortModules(items: ModuleAdminItem[], sortBy: ModuleSortOption): Promise<ModuleAdminItem[]>;
}
