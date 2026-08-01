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

export type AdminContentStatus = 'Draft' | 'Published' | 'Archived' | 'Disabled';

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'DGCA' | 'EASA' | 'Both';
  status: AdminContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminModule {
  id: string;
  title: string;
  category: 'DGCA' | 'EASA' | 'Both';
  duration: string;
  estimatedDurationMinutes: number;
  prerequisites: string[];
  status: AdminContentStatus;
  sortOrder: number;
}

export interface AdminModuleOption {
  id: string;
  title: string;
}

export interface AdminLesson {
  id: string;
  title: string;
  content: string;
  objectives: string[];
  keyPoints: string[];
  resources: string[];
  attachments: string[];
  referenceLinks?: string[];
  status: AdminContentStatus;
  order: number;
  module?: string;
  moduleId?: string;
  moduleTitle?: string;
  updatedAt?: string;
}

export interface AdminQuestion {
  id: string;
  prompt: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  module: string;
  explanation: string;
  status: AdminContentStatus;
  createdAt: string;
}

export interface AdminMockTest {
  id: string;
  title: string;
  durationMinutes: number;
  passingPercentage: number;
  questionCount: number;
  randomized: boolean;
  status: AdminContentStatus;
  updatedAt?: string;
}

export interface AdminPromptTemplate {
  id: string;
  title: string;
  category: string;
  version: string;
  content: string;
  status: AdminContentStatus;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  scheduled: boolean;
  status: AdminContentStatus;
}

export interface AdminAnalyticsSnapshot {
  studentGrowth: number;
  mockCompletionRate: number;
  aiUsage: number;
  questionBankActivity: number;
  popularModules: string[];
  completionRates: Record<string, number>;
}
