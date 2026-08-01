export type EnterpriseRole = 'SUPER_ADMIN' | 'CONTENT_EDITOR' | 'CONTENT_MANAGER' | 'STUDENT_MANAGER' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT' | 'QUESTION_REVIEWER' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export type PermissionName =
  | 'manageStudents'
  | 'manageModules'
  | 'manageResources'
  | 'manageQuestions'
  | 'publishContent'
  | 'viewAnalytics'
  | 'manageBilling'
  | 'viewBillingAnalytics'
  | 'manageInvoices'
  | 'manageUsers'
  | 'manageAuditLogs'
  | 'manageCourses'
  | 'manageLessons'
  | 'viewOwnAnalytics'
  | 'accessAiTutor'
  | 'attemptMockTests'
  | 'viewStudentContent'

const ROLE_PERMISSIONS: Record<EnterpriseRole, PermissionName[]> = {
  SUPER_ADMIN: ['manageStudents', 'manageModules', 'manageResources', 'manageQuestions', 'publishContent', 'viewAnalytics', 'manageBilling', 'viewBillingAnalytics', 'manageInvoices', 'manageUsers', 'manageAuditLogs', 'manageCourses', 'manageLessons', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  CONTENT_EDITOR: ['manageModules', 'manageResources', 'manageQuestions', 'publishContent', 'manageLessons', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  CONTENT_MANAGER: ['manageModules', 'manageResources', 'manageQuestions', 'publishContent', 'viewAnalytics'],
  STUDENT_MANAGER: ['manageStudents', 'viewAnalytics'],
  FINANCE_MANAGER: ['manageBilling', 'viewBillingAnalytics', 'manageInvoices', 'viewAnalytics'],
  SUPPORT_AGENT: ['manageUsers', 'viewAnalytics'],
  QUESTION_REVIEWER: ['manageQuestions', 'publishContent'],
  ADMIN: ['manageStudents', 'manageModules', 'manageResources', 'manageQuestions', 'publishContent', 'viewAnalytics', 'manageBilling', 'viewBillingAnalytics', 'manageInvoices', 'manageUsers', 'manageAuditLogs', 'manageCourses', 'manageLessons', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  INSTRUCTOR: ['manageLessons', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  STUDENT: ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
}

export class PermissionService {
  hasPermission(role: string | undefined, permission: PermissionName): boolean {
    const normalizedRole = (role ?? 'STUDENT').toUpperCase() as EnterpriseRole
    return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false
  }

  hasRole(role: string | undefined, expectedRole: EnterpriseRole): boolean {
    return (role ?? 'STUDENT').toUpperCase() === expectedRole.toUpperCase()
  }
}

export const permissionService = new PermissionService()
