import { describe, expect, it } from 'vitest';
import { canAccessAnalytics, canDeleteQuestion, canEditLesson, canManageUsers, canPublishContent, canViewDashboard, getPermissionMatrix, getRoleDisplayName, normalizeRoleName } from '@/server/services/authorization.service';

describe('authorization service', () => {
  it('exposes a central permission matrix for each logical role', () => {
    const matrix = getPermissionMatrix();
    expect(matrix.SUPER_ADMIN).toContain('manageUsers');
    expect(matrix.ADMIN).toContain('viewAnalytics');
    expect(matrix.CONTENT_EDITOR).toContain('publishContent');
    expect(matrix.STUDENT).toContain('viewOwnAnalytics');
  });

  it('normalizes legacy and logical role names consistently', () => {
    expect(normalizeRoleName('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    expect(normalizeRoleName('admin')).toBe('ADMIN');
    expect(normalizeRoleName('Content Editor')).toBe('CONTENT_EDITOR');
  });

  it('allows the expected permission checks for each role', () => {
    expect(canManageUsers('SUPER_ADMIN')).toBe(true);
    expect(canManageUsers('ADMIN')).toBe(true);
    expect(canManageUsers('CONTENT_EDITOR')).toBe(false);
    expect(canEditLesson('CONTENT_EDITOR')).toBe(true);
    expect(canDeleteQuestion('CONTENT_EDITOR')).toBe(true);
    expect(canPublishContent('STUDENT')).toBe(false);
    expect(canAccessAnalytics('INSTRUCTOR')).toBe(false);
    expect(canViewDashboard('STUDENT')).toBe(true);
  });

  it('returns a user-facing role label for the UI', () => {
    expect(getRoleDisplayName('SUPER_ADMIN')).toBe('Super Admin');
    expect(getRoleDisplayName('CONTENT_EDITOR')).toBe('Content Editor');
  });
});
