export type UserRole = "STUDENT" | "ADMIN" | "INSTRUCTOR";
export type PermissionName = "read:content" | "write:content" | "manage:users" | "manage:commerce" | "manage:access";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  targetExam?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  userId: string;
  fullName: string;
  department?: string;
  permissions: PermissionName[];
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  userId: string;
  fullName: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: PermissionName[];
}

export interface Permission {
  id: string;
  name: PermissionName;
  description: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}
