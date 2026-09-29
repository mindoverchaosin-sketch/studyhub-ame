import type { AuditLogEntryDTO } from "@/server/application/dto/audit.dto"
import { analyticsService } from "@/server/services/analytics.service"
import { auditLogService } from "@/server/services/audit-log.service"
import { billingDashboardService } from "@/server/services/billing-dashboard.service"
import { getAdminsByStatus, getInstructorsByStatus } from "@/server/services/approval-management.service"
import { listUsers } from "@/server/services/user-management.service"
import { examTemplateRepository } from "@/server/repositories/exam-template.repository"
import { userRepository } from "@/server/repositories/user.repository"

export async function getSuperAdminDashboardData() {
  const [totalUsers, students, administrators, contentEditors, pendingAdmins, pendingInstructors, publishing, activeExamTemplates, billing, audit, recentUsers] = await Promise.all([
    userRepository.countManyForAdmin(),
    userRepository.countManyForAdmin({ role: "STUDENT" }),
    userRepository.countManyForAdmin({ role: "ADMIN" }),
    userRepository.countManyForAdmin({ role: "CONTENT_EDITOR" }),
    getAdminsByStatus("PENDING"),
    getInstructorsByStatus("PENDING"),
    analyticsService.getPublishingAnalytics(),
    examTemplateRepository.countTemplates({ active: true }),
    billingDashboardService.getBillingDashboard(),
    auditLogService.listAuditLogs({ page: 1, pageSize: 6 }),
    listUsers({ page: 1, pageSize: 6 }),
  ])
  const pendingApprovals = [
    ...pendingAdmins.map((admin) => ({
      id: admin.id,
      name: admin.displayName ?? admin.email,
      email: admin.email,
      createdAt: admin.createdAt.toISOString(),
      status: admin.adminProfile?.status ?? "UNKNOWN",
      isActive: admin.isActive !== false,
      role: "ADMIN" as const,
    })),
    ...pendingInstructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.displayName ?? instructor.email,
      email: instructor.email,
      createdAt: instructor.createdAt.toISOString(),
      status: instructor.instructorProfile?.status ?? "UNKNOWN",
      isActive: instructor.isActive !== false,
      role: "INSTRUCTOR" as const,
    })),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return {
    metrics: {
      totalUsers,
      students,
      administrators,
      contentEditors,
      pendingApprovals: pendingApprovals.length,
      publishedContent: publishing.publishedCount,
      activeExamTemplates,
      activeSubscriptions: billing.overview.activeSubscriptions,
      estimatedMonthlyRecurringRevenue: billing.overview.monthlyRecurringRevenue,
    },
    pendingApprovals: pendingApprovals.slice(0, 5),
    recentAuditEvents: audit.auditLogs as AuditLogEntryDTO[],
    recentUsers: recentUsers.items,
    generatedAt: new Date().toISOString(),
  }
}