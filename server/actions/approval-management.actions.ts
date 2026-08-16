'use server'

import { ForbiddenError, requireAuth } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import {
  approveAdmin,
  approveInstructor,
  getAdminsByStatus,
  getInstructorsByStatus,
  reactivateAdmin,
  reactivateInstructor,
  rejectAdmin,
  rejectInstructor,
  suspendAdmin,
  suspendInstructor,
} from '@/server/services/approval-management.service'
import type { ApprovalStatus } from '@prisma/client'

function requireSuperAdmin() {
  return requireAuth().then((session) => {
    if (session.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only SUPER_ADMIN may manage ADMIN approval status.')
    }
    return session
  })
}

function requireAdminOrSuperAdmin() {
  return requireAuth().then((session) => {
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only ADMIN or SUPER_ADMIN may manage instructor approval.')
    }
    return session
  })
}

export async function getAdminsByStatusAction(status: ApprovalStatus | 'ALL' = 'ALL') {
  await requireSuperAdmin()
  return getAdminsByStatus(status)
}

export async function approveAdminAction(targetUserId: string) {
  await requireSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'admin.approve',
    entityType: 'ADMIN',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => approveAdmin(targetUserId),
  })
}

export async function rejectAdminAction(targetUserId: string) {
  await requireSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'admin.reject',
    entityType: 'ADMIN',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => rejectAdmin(targetUserId),
  })
}

export async function suspendAdminAction(targetUserId: string) {
  await requireSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'admin.suspend',
    entityType: 'ADMIN',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => suspendAdmin(targetUserId),
  })
}

export async function reactivateAdminAction(targetUserId: string) {
  await requireSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'admin.reactivate',
    entityType: 'ADMIN',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => reactivateAdmin(targetUserId),
  })
}

export async function getInstructorsByStatusAction(status: ApprovalStatus | 'ALL' = 'ALL') {
  await requireAdminOrSuperAdmin()
  return getInstructorsByStatus(status)
}

export async function approveInstructorAction(targetUserId: string) {
  await requireAdminOrSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'instructor.approve',
    entityType: 'INSTRUCTOR',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => approveInstructor(targetUserId),
  })
}

export async function rejectInstructorAction(targetUserId: string) {
  await requireAdminOrSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'instructor.reject',
    entityType: 'INSTRUCTOR',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => rejectInstructor(targetUserId),
  })
}

export async function suspendInstructorAction(targetUserId: string) {
  await requireAdminOrSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'instructor.suspend',
    entityType: 'INSTRUCTOR',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => suspendInstructor(targetUserId),
  })
}

export async function reactivateInstructorAction(targetUserId: string) {
  await requireAdminOrSuperAdmin()
  return withAuditLogging({
    permission: 'manageUsers',
    action: 'instructor.reactivate',
    entityType: 'INSTRUCTOR',
    entityId: targetUserId,
    metadata: { source: 'approval-management' },
    run: async () => reactivateInstructor(targetUserId),
  })
}
