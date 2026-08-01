import { userRepository } from '@/server/repositories/user.repository';
import { getRoleDisplayName, normalizeRoleName } from '@/server/services/authorization.service';

export type UserManagementStatus = 'ACTIVE' | 'SUSPENDED';
export type UserManagementRoleFilter = 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'CONTENT_EDITOR' | 'STUDENT';

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
