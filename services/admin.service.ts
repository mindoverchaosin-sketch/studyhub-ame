import { adminNavigationMock, adminStatsMock, recentActivityMock } from "@/lib/mock/admin";

export async function getAdminNavigation() {
  return adminNavigationMock;
}

export async function getAdminStats() {
  return adminStatsMock;
}

export async function getRecentActivity() {
  return recentActivityMock;
}
