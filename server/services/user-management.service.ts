import bcrypt from 'bcrypt';
import { z } from 'zod';
import { userRepository } from '@/server/repositories/user.repository';
import { roleRepository } from '@/server/repositories/role.repository';
import { getRoleDisplayName, normalizeRoleName } from '@/server/services/authorization.service';

export type UserManagementStatus = 'ACTIVE' | 'SUSPENDED';
export type UserManagementRoleFilter = 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'CONTENT_EDITOR' | 'STUDENT';
export type PrivilegedUserRole = 'ADMIN' | 'CONTENT_EDITOR' | 'INSTRUCTOR';

const privilegedUserBaseSchema = {
  fullName: z.string().trim().min(2, 'Enter a full name.').max(120, 'Full name is too long.'),
  email: z.string().trim().email('Enter a valid email address.').max(254).transform((email) => email.toLowerCase()),
  temporaryPassword: z.string().min(8, 'Use at least 8 characters for the temporary password.').max(72, 'Temporary password is too long.'),
  isActive: z.boolean(),
};

export const privilegedUserCreationSchema = z.discriminatedUnion('role', [
  z.object({ ...privilegedUserBaseSchema, role: z.literal('ADMIN'), department: z.string().trim().max(120).optional() }),
  z.object({ ...privilegedUserBaseSchema, role: z.literal('CONTENT_EDITOR') }),
  z.object({ ...privilegedUserBaseSchema, role: z.literal('INSTRUCTOR'), bio: z.string().trim().max(2000).optional() }),
]);

export type PrivilegedUserCreationInput = z.input<typeof privilegedUserCreationSchema>;

export class DuplicateUserEmailError extends Error {
  constructor() {
    super('An account with that email already exists.');
    this.name = 'DuplicateUserEmailError';
  }
}

const roleDescriptions: Record<PrivilegedUserRole, string> = {
  ADMIN: 'Administrator role',
  CONTENT_EDITOR: 'Content editor role',
  INSTRUCTOR: 'Instructor role',
};

async function findOrCreateRole(role: PrivilegedUserRole) {
  const existingRole = await roleRepository.findByName(role);
  if (existingRole) return existingRole;

  try {
    return await roleRepository.create({ name: role, description: roleDescriptions[role] });
  } catch (error) {
    const concurrentRole = await roleRepository.findByName(role);
    if (concurrentRole) return concurrentRole;
    throw error;
  }
}

export type UserManagementFilters = {
  search?: string;
  role?: UserManagementRoleFilter;
  status?: 'ALL' | UserManagementStatus;
  page?: number;
  pageSize?: number;
};

type NormalizedUserManagementFilters = Omit<UserManagementFilters, 'status'> & {
  status?: UserManagementStatus;
  page: number;
  pageSize: number;
};

export type UserManagementListItem = {
  id: string;
  email: string;
  displayName?: string | null;
  role: string;
  status: UserManagementStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserManagementListResponse = {
  items: UserManagementListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UserManagementDetail = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: UserManagementStatus;
  createdAt: string;
  updatedAt: string;
  adminApprovalStatus: string | null;
  instructorApprovalStatus: string | null;
  studentName: string | null;
};

export function normalizeUserManagementFilters(filters: UserManagementFilters = {}): NormalizedUserManagementFilters {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));

  return {
    ...filters,
    page,
    pageSize,
    search: filters.search?.trim() || undefined,
    role: filters.role && filters.role !== 'ALL' ? filters.role : undefined,
    status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
  };
}

export function toUserManagementStatus(isActive: boolean | null | undefined): UserManagementStatus {
  return isActive === false ? 'SUSPENDED' : 'ACTIVE';
}

export function getUserRoleLabel(role: string | null | undefined): string {
  return getRoleDisplayName(role);
}

export async function listUsers(filters: UserManagementFilters = {}): Promise<UserManagementListResponse> {
  const normalized = normalizeUserManagementFilters(filters);
  const skip = (normalized.page - 1) * normalized.pageSize;

  const [users, totalItems] = await Promise.all([
    userRepository.findManyForAdmin({
      search: normalized.search,
      role: normalized.role,
      status: normalized.status,
      skip,
      take: normalized.pageSize,
    }),
    userRepository.countManyForAdmin({
      search: normalized.search,
      role: normalized.role,
      status: normalized.status,
    }),
  ]);

  return {
    items: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: normalizeRoleName(user.role?.name).toString(),
      status: toUserManagementStatus(user.isActive),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    totalItems,
    page: normalized.page,
    pageSize: normalized.pageSize,
    totalPages: Math.max(1, Math.ceil(totalItems / normalized.pageSize)),
  };
}

export async function getUserManagementDetail(id: string): Promise<UserManagementDetail | null> {
  const user = await userRepository.findById(id);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: normalizeRoleName(user.role?.name).toString(),
    status: toUserManagementStatus(user.isActive),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    adminApprovalStatus: user.adminProfile?.status ?? null,
    instructorApprovalStatus: user.instructorProfile?.status ?? null,
    studentName: user.studentProfile?.fullName ?? null,
  };
}

export async function createPrivilegedUser(input: PrivilegedUserCreationInput) {
  const parsed = privilegedUserCreationSchema.parse(input);
  const existingUser = await userRepository.findByEmail(parsed.email);
  if (existingUser) throw new DuplicateUserEmailError();

  const [role, passwordHash] = await Promise.all([
    findOrCreateRole(parsed.role),
    bcrypt.hash(parsed.temporaryPassword, 10),
  ]);

  const profile = parsed.role === 'ADMIN'
    ? { adminProfile: { create: { fullName: parsed.fullName, department: parsed.department || undefined, status: 'PENDING' as const } } }
    : parsed.role === 'INSTRUCTOR'
      ? { instructorProfile: { create: { fullName: parsed.fullName, bio: parsed.bio || undefined, status: 'PENDING' as const } } }
      : {};

  let user;
  try {
    user = await userRepository.createUser({
      email: parsed.email,
      displayName: parsed.fullName,
      passwordHash,
      role: { connect: { id: role.id } },
      isActive: parsed.isActive,
      ...profile,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateUserEmailError();
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: parsed.role,
    status: toUserManagementStatus(user.isActive),
    createdAt: user.createdAt.toISOString(),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
