import { describe, expect, it } from 'vitest';
import { getUserRoleLabel, normalizeUserManagementFilters, toUserManagementStatus } from '@/server/services/user-management.service';

describe('user management service', () => {
  it('normalizes search and pagination parameters for admin user listings', () => {
    const normalized = normalizeUserManagementFilters({ search: '  Ada  ', page: 0, pageSize: 200, role: 'ALL', status: 'ALL' });
    expect(normalized.search).toBe('Ada');
    expect(normalized.page).toBe(1);
    expect(normalized.pageSize).toBe(50);
    expect(normalized.role).toBeUndefined();
    expect(normalized.status).toBeUndefined();
  });

  it('maps booleans to the expected admin UI status labels', () => {
    expect(toUserManagementStatus(true)).toBe('ACTIVE');
    expect(toUserManagementStatus(false)).toBe('SUSPENDED');
  });

  it('renders a readable role label for the admin user list', () => {
    expect(getUserRoleLabel('SUPER_ADMIN')).toBe('Super Admin');
    expect(getUserRoleLabel('CONTENT_EDITOR')).toBe('Content Editor');
  });
});
