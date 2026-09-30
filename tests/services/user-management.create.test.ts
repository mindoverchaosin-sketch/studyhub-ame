import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindByEmail, mockCreateUser, mockFindRole, mockCreateRole, mockHash } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockCreateUser: vi.fn(),
  mockFindRole: vi.fn(),
  mockCreateRole: vi.fn(),
  mockHash: vi.fn(),
}));

vi.mock('bcrypt', () => ({ default: { hash: mockHash } }));
vi.mock('@/server/repositories/user.repository', () => ({ userRepository: { findByEmail: mockFindByEmail, createUser: mockCreateUser } }));
vi.mock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: mockFindRole, create: mockCreateRole } }));

import { createPrivilegedUser, DuplicateUserEmailError } from '@/server/services/user-management.service';
import { getPermissionMatrix } from '@/server/services/authorization.service';

const baseInput = {
  fullName: '  Alex Example  ',
  email: '  Alex@example.com  ',
  temporaryPassword: 'temporary-secret',
  isActive: true,
};

describe('privileged user creation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByEmail.mockResolvedValue(null);
    mockFindRole.mockResolvedValue({ id: 'role-id' });
    mockCreateRole.mockResolvedValue({ id: 'role-id' });
    mockHash.mockResolvedValue('bcrypt-hash');
    mockCreateUser.mockImplementation(async (input) => ({
      id: 'created-user',
      email: input.email,
      displayName: input.displayName,
      isActive: input.isActive,
      createdAt: new Date('2026-09-29T12:00:00.000Z'),
    }));
  });

  it.each([
    ['ADMIN', { department: 'Operations' }, 'adminProfile', { fullName: 'Alex Example', department: 'Operations', status: 'PENDING' }],
    ['CONTENT_EDITOR', {}, undefined, undefined],
    ['INSTRUCTOR', { bio: 'Aircraft maintenance instructor' }, 'instructorProfile', { fullName: 'Alex Example', bio: 'Aircraft maintenance instructor', status: 'PENDING' }],
  ] as const)('creates the selected %s role and supported profile', async (role, roleFields, profileKey, profileData) => {
    const result = await createPrivilegedUser({ ...baseInput, role, ...roleFields } as Parameters<typeof createPrivilegedUser>[0]);

    expect(result).toMatchObject({ id: 'created-user', email: 'alex@example.com', displayName: 'Alex Example', role, status: 'ACTIVE' });
    const createInput = mockCreateUser.mock.calls[0][0];
    expect(createInput).toMatchObject({
      email: 'alex@example.com',
      displayName: 'Alex Example',
      passwordHash: 'bcrypt-hash',
      role: { connect: { id: 'role-id' } },
      isActive: true,
    });
    expect(createInput).not.toHaveProperty('temporaryPassword');
    if (profileKey) expect(createInput[profileKey]).toEqual({ create: profileData });
    else expect(createInput).not.toHaveProperty('adminProfile');
    expect(mockHash).toHaveBeenCalledWith('temporary-secret', 10);
  });

  it('rejects duplicate email before hashing or creating an account', async () => {
    mockFindByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(createPrivilegedUser({ ...baseInput, role: 'ADMIN' })).rejects.toBeInstanceOf(DuplicateUserEmailError);
    expect(mockHash).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('creates an inactive account when requested', async () => {
    mockCreateUser.mockImplementationOnce(async (input) => ({
      id: 'inactive-user',
      email: input.email,
      displayName: input.displayName,
      isActive: input.isActive,
      createdAt: new Date('2026-09-29T12:00:00.000Z'),
    }));

    const result = await createPrivilegedUser({ ...baseInput, isActive: false, role: 'CONTENT_EDITOR' });

    expect(result.status).toBe('SUSPENDED');
    expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
  });

  it('maps a concurrent unique-email conflict to the duplicate error', async () => {
    mockCreateUser.mockRejectedValue({ code: 'P2002' });

    await expect(createPrivilegedUser({ ...baseInput, role: 'CONTENT_EDITOR' })).rejects.toBeInstanceOf(DuplicateUserEmailError);
  });

  it('rejects malformed email and disallows SUPER_ADMIN in the creation schema', async () => {
    await expect(createPrivilegedUser({ ...baseInput, email: 'not-an-email', role: 'ADMIN' })).rejects.toThrow();
    await expect(createPrivilegedUser({ ...baseInput, role: 'SUPER_ADMIN' } as never)).rejects.toThrow();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('uses only the established per-role permission matrix for authorization grants', () => {
    const permissions = getPermissionMatrix();
    expect(permissions.ADMIN).toEqual(permissions.SUPER_ADMIN);
    expect(permissions.CONTENT_EDITOR).toContain('publishContent');
    expect(permissions.CONTENT_EDITOR).not.toContain('manageUsers');
    expect(permissions.INSTRUCTOR).not.toContain('manageUsers');
  });

  it('creates a missing role row using the existing role repository', async () => {
    mockFindRole.mockResolvedValueOnce(null);

    await createPrivilegedUser({ ...baseInput, role: 'INSTRUCTOR' });

    expect(mockCreateRole).toHaveBeenCalledWith({ name: 'INSTRUCTOR', description: 'Instructor role' });
  });
});