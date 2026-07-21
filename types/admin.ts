export interface AdminStats {
  totalStudents: number;
  totalModules: number;
  totalStudyMaterials: number;
  totalRevenue: number;
  premiumUsers: number;
  pendingDrafts: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  actor: string;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
}
