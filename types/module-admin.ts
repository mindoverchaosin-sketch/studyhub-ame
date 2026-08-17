export type ModuleStatus = "Published" | "Draft" | "Archived";
export type ModuleAccess = "Free" | "Premium";
export type ModuleDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ModuleSortOption = "name" | "updated" | "created" | "displayOrder";

export interface ModuleAdminItem {
  id: string;
  moduleNumber: string;
  title: string;
  slug: string;
  difficulty: ModuleDifficulty;
  lessonsCount: number;
  materialsCount: number;
  status: ModuleStatus;
  access: ModuleAccess;
  lastUpdated: string;
  thumbnail: string;
  description: string;
  estimatedHours: number;
  learningObjectives: string[];
  prerequisites: string[];
  productMapping: string;
  displayOrder: number;
  createdAt: string;
}

export interface ModuleWizardState {
  title: string;
  moduleNumber: string;
  slug: string;
  description: string;
  thumbnail: string;
  difficulty: ModuleDifficulty;
  estimatedHours: number;
  learningObjectives: string;
  prerequisites: string;
  status: ModuleStatus;
  isPremium: boolean;
  productMapping: string;
}

export interface ModuleFiltersState {
  status: ModuleStatus | "All";
  access: ModuleAccess | "All";
  difficulty: ModuleDifficulty | "All";
  search: string;
  sortBy: ModuleSortOption;
}

export interface ModuleBulkAction {
  type: "publish" | "archive" | "delete" | "assign-product" | "change-access";
  label: string;
}
