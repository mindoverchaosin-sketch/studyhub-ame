export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'CONTENT_EDITOR' | 'STUDENT';

export type PermissionName =
  | 'manageUsers'
  | 'manageStudents'
  | 'manageCourses'
  | 'manageLessons'
  | 'manageQuestions'
  | 'publishContent'
  | 'viewAnalytics'
  | 'viewOwnAnalytics'
  | 'accessAiTutor'
  | 'attemptMockTests'
  | 'viewStudentContent';

export type PermissionMatrix = Record<AppRole, PermissionName[]>;

const PERMISSION_MATRIX: PermissionMatrix = {
  SUPER_ADMIN: ['manageUsers', 'manageStudents', 'manageCourses', 'manageLessons', 'manageQuestions', 'publishContent', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  ADMIN: ['manageUsers', 'manageStudents', 'manageCourses', 'manageLessons', 'manageQuestions', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  INSTRUCTOR: ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  CONTENT_EDITOR: ['manageLessons', 'manageQuestions', 'publishContent', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
  STUDENT: ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent'],
};

const ROLE_ALIASES: Record<string, AppRole> = {
  SUPERADMIN: 'SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  CONTENTEDITOR: 'CONTENT_EDITOR',
  CONTENT_EDITOR: 'CONTENT_EDITOR',
  STUDENT: 'STUDENT',
  'CONTENT EDITOR': 'CONTENT_EDITOR',
  'SUPER ADMIN': 'SUPER_ADMIN',
};

export function normalizeRoleName(role?: string | null): AppRole {
  const normalized = (role ?? 'STUDENT').toString().trim().toUpperCase();
  return ROLE_ALIASES[normalized] ?? (normalized as AppRole) ?? 'STUDENT';
}

export function getPermissionMatrix(): PermissionMatrix {
  return PERMISSION_MATRIX;
}

export function hasPermission(role: string | null | undefined, permission: PermissionName): boolean {
  const normalizedRole = normalizeRoleName(role);
  return PERMISSION_MATRIX[normalizedRole]?.includes(permission) ?? false;
}

export function canManageUsers(role: string | null | undefined): boolean {
  return hasPermission(role, 'manageUsers');
}

export function canManageStudents(role: string | null | undefined): boolean {
  return hasPermission(role, 'manageStudents');
}

export function canEditLesson(role: string | null | undefined): boolean {
  return hasPermission(role, 'manageLessons');
}

export function canDeleteQuestion(role: string | null | undefined): boolean {
  return hasPermission(role, 'manageQuestions');
}

export function canPublishContent(role: string | null | undefined): boolean {
  return hasPermission(role, 'publishContent');
}

export function canAccessAnalytics(role: string | null | undefined): boolean {
  return hasPermission(role, 'viewAnalytics');
}

export function canViewDashboard(role: string | null | undefined): boolean {
  return hasPermission(role, 'viewStudentContent') || hasPermission(role, 'viewAnalytics');
}

export function canUseAiTutor(role: string | null | undefined): boolean {
  return hasPermission(role, 'accessAiTutor');
}

export function canAttemptMockTests(role: string | null | undefined): boolean {
  return hasPermission(role, 'attemptMockTests');
}

export function getRoleDisplayName(role: string | null | undefined): string {
  switch (normalizeRoleName(role)) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'INSTRUCTOR':
      return 'Instructor';
    case 'CONTENT_EDITOR':
      return 'Content Editor';
    default:
      return 'Student';
  }
}
