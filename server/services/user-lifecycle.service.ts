import { ForbiddenError, ValidationError } from '@/auth'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { effectiveAccountStatusWhere, userRepository } from '@/server/repositories/user.repository'
import { roleRepository } from '@/server/repositories/role.repository'
import { normalizeRoleName } from '@/server/services/authorization.service'
import { getAccountStatus, type AccountStatus } from '@/server/services/account-status.service'

export type LifecycleResult = {
  id: string
  accountStatus: AccountStatus
  role: string
  oldStatus: AccountStatus
}

async function getActor(actorId: string) {
  const actor = await userRepository.findById(actorId)
  if (!actor) {
    throw new ForbiddenError('Authenticated Super Admin required.')
  }

  return actor
}

async function ensureActorIsSuperAdmin(actorId: string) {
  const actor = await getActor(actorId)
  if (normalizeRoleName(actor.role?.name) !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only Super Admins can manage user lifecycle.')
  }
}

async function getTargetUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })
}

async function ensureTargetNotSelf(actorId: string, targetId: string, action: string) {
  if (actorId === targetId) {
    throw new ForbiddenError(`A Super Admin cannot ${action} itself.`)
  }
}

async function ensureLastActiveSuperAdminIsProtected(
  tx: Prisma.TransactionClient,
  targetUser: { id: string; role?: { name?: string | null } | null },
  action: 'suspend' | 'terminate',
) {
  const roleName = normalizeRoleName(targetUser.role?.name)
  if (roleName !== 'SUPER_ADMIN') {
    return
  }

  const activeSuperAdmins = await tx.user.count({
    where: {
      role: { is: { name: 'SUPER_ADMIN' } },
      ...effectiveAccountStatusWhere('ACTIVE'),
    },
  })
  if (activeSuperAdmins <= 1) {
    if (action === 'suspend') {
      throw new ForbiddenError('The last active Super Admin cannot be suspended.')
    }
    throw new ForbiddenError('The last active Super Admin cannot be terminated.')
  }
}

export async function suspendUserTemporarily(userId: string, reason: string, suspensionEndsAt: Date | string, actorId: string): Promise<LifecycleResult> {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  const oldStatus = getAccountStatus(target)
  if (oldStatus === 'TERMINATED') {
    throw new ValidationError('Terminated accounts cannot be suspended.')
  }

  await ensureTargetNotSelf(actorId, userId, 'suspend')

  const expiresAt = new Date(suspensionEndsAt)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new ValidationError('Temporary suspension must end in the future.')
  }

  if (!reason.trim()) {
    throw new ValidationError('A reason is required for suspension.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await ensureLastActiveSuperAdminIsProtected(tx, target, 'suspend')
    await tx.session.deleteMany({ where: { userId } })
    return tx.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        accountStatus: 'SUSPENDED',
        suspensionType: 'TEMPORARY',
        suspensionEndsAt: expiresAt,
        suspensionReason: reason.trim(),
        terminationReason: null,
        lastAccountStatusUpdatedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      include: { role: true },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return {
    id: updated.id,
    accountStatus: 'SUSPENDED',
    role: normalizeRoleName(updated.role?.name),
    oldStatus,
  }
}

export async function suspendUserIndefinitely(userId: string, reason: string, actorId: string): Promise<LifecycleResult> {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  const oldStatus = getAccountStatus(target)
  if (oldStatus === 'TERMINATED') {
    throw new ValidationError('Terminated accounts cannot be suspended.')
  }

  await ensureTargetNotSelf(actorId, userId, 'suspend')

  if (!reason.trim()) {
    throw new ValidationError('A reason is required for suspension.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await ensureLastActiveSuperAdminIsProtected(tx, target, 'suspend')
    await tx.session.deleteMany({ where: { userId } })
    return tx.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        accountStatus: 'SUSPENDED',
        suspensionType: 'INDEFINITE',
        suspensionEndsAt: null,
        suspensionReason: reason.trim(),
        terminationReason: null,
        lastAccountStatusUpdatedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      include: { role: true },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return {
    id: updated.id,
    accountStatus: 'SUSPENDED',
    role: normalizeRoleName(updated.role?.name),
    oldStatus,
  }
}

export async function reactivateUserAccount(userId: string, reason: string, actorId: string): Promise<LifecycleResult> {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  const oldStatus = getAccountStatus(target)
  if (oldStatus === 'TERMINATED') {
    throw new ValidationError('Terminated accounts cannot be reactivated through the normal lifecycle controls.')
  }

  if (!reason.trim()) {
    throw new ValidationError('A reason is required to reactivate an account.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } })
    return tx.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        accountStatus: 'ACTIVE',
        suspensionType: null,
        suspensionEndsAt: null,
        suspensionReason: null,
        terminationReason: null,
        lastAccountStatusUpdatedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      include: { role: true },
    })
  })

  return {
    id: updated.id,
    accountStatus: 'ACTIVE',
    role: normalizeRoleName(updated.role?.name),
    oldStatus,
  }
}

export async function revokePrivilegedRole(userId: string, reason: string, actorId: string): Promise<LifecycleResult> {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  const oldRole = normalizeRoleName(target.role?.name)
  const oldStatus = getAccountStatus(target)

  if (oldStatus === 'TERMINATED') {
    throw new ValidationError('Terminated accounts cannot have their role revoked.')
  }

  await ensureTargetNotSelf(actorId, userId, 'revoke the role of')

  if (oldRole === 'SUPER_ADMIN') {
    throw new ValidationError('Super Admin privileges cannot be revoked through the standard user lifecycle controls.')
  }

  if (oldRole === 'STUDENT') {
    throw new ValidationError('Student role does not need privilege revocation.')
  }

  if (!['ADMIN', 'INSTRUCTOR', 'CONTENT_EDITOR'].includes(oldRole)) {
    throw new ValidationError('Only privileged roles can be revoked through this action.')
  }

  const fallbackRole = await roleRepository.findByName('STUDENT') ?? await roleRepository.create({ name: 'STUDENT', description: 'Student role' })

  const updated = await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } })
    return tx.user.update({
      where: { id: userId },
      data: {
        roleId: fallbackRole.id,
        sessionVersion: { increment: 1 },
      },
      include: { role: true },
    })
  })

  return {
    id: updated.id,
    accountStatus: oldStatus,
    role: 'STUDENT',
    oldStatus,
  }
}

export async function terminateUserPermanently(userId: string, reason: string, actorId: string): Promise<LifecycleResult> {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  const oldStatus = getAccountStatus(target)
  if (oldStatus === 'TERMINATED') {
    throw new ValidationError('The user is already terminated.')
  }

  await ensureTargetNotSelf(actorId, userId, 'terminate')

  if (!reason.trim()) {
    throw new ValidationError('A termination reason is required.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await ensureLastActiveSuperAdminIsProtected(tx, target, 'terminate')
    await tx.session.deleteMany({ where: { userId } })
    return tx.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        accountStatus: 'TERMINATED',
        suspensionType: null,
        suspensionEndsAt: null,
        suspensionReason: null,
        terminationReason: reason.trim(),
        lastAccountStatusUpdatedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      include: { role: true },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return {
    id: updated.id,
    accountStatus: 'TERMINATED',
    role: normalizeRoleName(updated.role?.name),
    oldStatus,
  }
}

export async function revokeAllUserSessions(userId: string, reason: string, actorId: string) {
  await ensureActorIsSuperAdmin(actorId)

  const target = await getTargetUser(userId)
  if (!target) {
    throw new ValidationError('Target user was not found.')
  }

  if (!reason.trim()) {
    throw new ValidationError('A reason is required to revoke sessions.')
  }

  const result = await userRepository.revokeAllSessionsForUser(userId)

  return {
    userId,
    deletedCount: result.deletedCount,
    accountStatus: getAccountStatus(target),
  }
}