import { adminNavigationMock, adminStatsMock, recentActivityMock } from "@/lib/mock/admin";

export async function getAdminNavigationData() {
  return adminNavigationMock;
}

export async function getAdminStatsData() {
  return adminStatsMock;
}

export async function getRecentActivityData() {
  return recentActivityMock;
}
