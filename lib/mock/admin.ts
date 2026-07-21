import type { AdminStats, DashboardMetric, NavigationItem, RecentActivity } from "@/types/admin";

export const adminStatsMock: AdminStats = {
  totalStudents: 1840,
  totalModules: 32,
  totalStudyMaterials: 148,
  totalRevenue: 1285000,
  premiumUsers: 612,
  pendingDrafts: 9,
};

export const adminMetricsMock: DashboardMetric[] = [
  {
    id: "students",
    label: "Active learners",
    value: "1.84k",
    detail: "+12% this month",
  },
  {
    id: "content",
    label: "Published modules",
    value: "32",
    detail: "Ready for review",
  },
  {
    id: "revenue",
    label: "Placeholder revenue",
    value: "₹12.85L",
    detail: "Mock data only",
  },
];

export const recentActivityMock: RecentActivity[] = [
  {
    id: "activity-1",
    title: "New module drafted",
    description: "Aviation Weather Patterns moved into draft review.",
    timeLabel: "15 min ago",
    actor: "Riya",
  },
  {
    id: "activity-2",
    title: "Study material updated",
    description: "Updated the DGCA handbook resource pack for Paper 1.",
    timeLabel: "1 hr ago",
    actor: "Aman",
  },
  {
    id: "activity-3",
    title: "Quiz approved",
    description: "A newly created mock test was approved for publication.",
    timeLabel: "Today",
    actor: "Nisha",
  },
];

export const adminNavigationMock: NavigationItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/modules", label: "Modules", icon: "▣" },
  { href: "/admin/lessons", label: "Lessons", icon: "▤" },
  { href: "/admin/materials", label: "Study Materials", icon: "◌" },
  { href: "/admin/quizzes", label: "Quizzes", icon: "◍" },
  { href: "/admin/mock-tests", label: "Mock Tests", icon: "⬢" },
  { href: "/admin/products", label: "Products", icon: "◫" },
  { href: "/admin/orders", label: "Orders", icon: "◮" },
  { href: "/admin/students", label: "Students", icon: "◼" },
  { href: "/admin/analytics", label: "Analytics", icon: "◐" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];
