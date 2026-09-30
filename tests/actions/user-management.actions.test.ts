import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireApprovedRole, mockRequirePermission, mockRecordEvent, mockCreatePrivilegedUser, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequireApprovedRole: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockRecordEvent: vi.fn(),
  mockCreatePrivilegedUser: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/auth', () => ({
  requireApprovedRole: mockRequireApprovedRole,
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
}));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));
vi.mock('@/server/services/audit-log.service', () => ({ auditLogService: { recordEvent: mockRecordEvent } }));
vi.mock('@/server/services/user-management.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/services/user-management.service')>();
  return { ...actual, createPrivilegedUser: mockCreatePrivilegedUser };
});
vi.mock('@/server/repositories/user.repository', () => ({ userRepository: { findByEmail: vi.fn(), createUser: vi.fn() } }));
vi.mock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn() } }));

import { ForbiddenError, UnauthorizedError } from '@/auth';
import { createPrivilegedUserAction } from '@/server/actions/user-management.actions';

const actor = { user: { id: 'super-1', role: 'SUPER_ADMIN' } };
const payload = (role: string) => ({
  fullName: 'Alex Example',
  email: 'alex@example.com',
  temporaryPassword: 'temporary-secret',
  isActive: true,
  role,
});

describe('Super Admin privileged user action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApprovedRole.mockResolvedValue(actor);
    mockRequirePermission.mockResolvedValue(actor);
    mockRecordEvent.mockResolvedValue({ id: 'audit-1' });
    mockCreatePrivilegedUser.mockImplementation(async (input) => ({
      id: `created-${input.role.toLowerCase()}`,
      email: input.email,
      displayName: input.fullName,
      role: input.role,
      status: 'ACTIVE',
      createdAt: '2026-09-29T12:00:00.000Z',
    }));
  });

  it.each(['ADMIN', 'CONTENT_EDITOR', 'INSTRUCTOR'])('allows SUPER_ADMIN to create %s', async (role) => {
    const result = await createPrivilegedUserAction(payload(role));

    expect(result.success).toBe(true);
    expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN');
    expect(mockRequirePermission).toHaveBeenCalledWith('manageUsers');
    expect(mockCreatePrivilegedUser).toHaveBeenCalledWith(expect.objectContaining({ role }));
    expect(mockRevalidatePath).toHaveBeenCalledWith('/super-admin/users');
  });

  it('records actor, created user, selected role, and action in the audit event', async () => {
    await createPrivilegedUserAction(payload('ADMIN'));

    expect(mockRecordEvent).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'super-1',
      actorRole: 'SUPER_ADMIN',
      action: 'user.create',
      entityType: 'USER',
      entityId: 'created-admin',
      success: true,
      metadata: expect.objectContaining({ assignedRole: 'ADMIN', source: 'super-admin-users' }),
    }));
  });

  it.each([
    ['ADMIN', new ForbiddenError('Access denied.')],
    ['CONTENT_EDITOR', new ForbiddenError('Access denied.')],
    ['STUDENT', new ForbiddenError('Access denied.')],
    ['unauthenticated', new UnauthorizedError('Authentication required.')],
  ])('denies %s before creating a privileged account', async (_role, error) => {
    mockRequireApprovedRole.mockRejectedValue(error);

    const result = await createPrivilegedUserAction(payload('ADMIN'));

    expect(result.success).toBe(false);
    expect(mockCreatePrivilegedUser).not.toHaveBeenCalled();
    expect(mockRequirePermission).not.toHaveBeenCalled();
  });

  it('rejects SUPER_ADMIN as a requested target role', async () => {
    const result = await createPrivilegedUserAction(payload('SUPER_ADMIN'));

    expect(result).toMatchObject({ success: false, code: 'INVALID_INPUT' });
    expect(mockCreatePrivilegedUser).not.toHaveBeenCalled();
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });

  it('returns server validation feedback for invalid email input', async () => {
    const result = await createPrivilegedUserAction({ ...payload('INSTRUCTOR'), email: 'invalid' });

    expect(result).toMatchObject({ success: false, code: 'INVALID_INPUT' });
    expect(mockCreatePrivilegedUser).not.toHaveBeenCalled();
  });
});