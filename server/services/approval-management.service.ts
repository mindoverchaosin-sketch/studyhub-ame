import prisma from '@/lib/prisma'
import { requireAuth, ForbiddenError, NotFoundError, ValidationError } from '@/auth'
import { ApprovalStatus } from '@prisma/client'

type ApprovalStatusFilter = ApprovalStatus | 'ALL'

const ADMIN_APPROVER_ROLES = new Set(['SUPER_ADMIN'])
const INSTRUCTOR_APPROVER_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

function normalizeStatus(status?: ApprovalStatusFilter): ApprovalStatus | undefined {
  if (!status || status === 'ALL') return undefined
  return status
}

async function getCurrentActor() {
  const session = await requireAuth()
  return session.user
}

async function getUserForApproval(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      adminProfile: true,
      instructorProfile: true,
    },
  })
}

function ensureAdminCaller(actorRole: string | undefined) {
  if (actorRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only SUPER_ADMIN may manage ADMIN approval status.')
  }
}

function ensureInstructorCaller(actorRole: string | undefined) {
  if (!INSTRUCTOR_APPROVER_ROLES.has(actorRole ?? '')) {
    throw new ForbiddenError('Only ADMIN or SUPER_ADMIN may manage instructor approval.')
  }
}

function ensureTargetIsActive(targetUser: { isActive?: boolean | null }) {
  if (targetUser.isActive === false) {
    throw new ValidationError('Target user must be active before approval status can be updated.')
  }
}

async function updateAdminProfileStatus(userId: string, status: ApprovalStatus, approvedById: string) {
  const existingProfile = await prisma.adminProfile.findUnique({ where: { userId } })
  if (!existingProfile) {
    throw new NotFoundError('Admin profile not found.')
  }

  return prisma.adminProfile.update({
    where: { userId },
    data: {
      status,
      approvedById,
      approvedAt: new Date(),
    },
  })
}

async function updateInstructorProfileStatus(userId: string, status: ApprovalStatus, approvedById: string) {
  const existingProfile = await prisma.instructorProfile.findUnique({ where: { userId } })
  if (!existingProfile) {
    throw new NotFoundError('Instructor profile not found.')
  }

  return prisma.instructorProfile.update({
    where: { userId },
    data: {
      status,
      approvedById,
      approvedAt: new Date(),
    },
  })
}

export async function getAdminsByStatus(status: ApprovalStatusFilter = 'ALL') {
  const actor = await getCurrentActor()
  ensureAdminCaller(actor.role)

  const normalized = normalizeStatus(status)

  return prisma.user.findMany({
    where: {
      role: { is: { name: 'ADMIN' } },
      ...(normalized ? { adminProfile: { status: normalized } } : {}),
    },
    include: {
      role: true,
      adminProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveAdmin(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureAdminCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Admin cannot approve themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Admin user not found.')
  }

  if (targetUser.role?.name !== 'ADMIN') {
    throw new ValidationError('Approved target must have the ADMIN role.')
  }

  ensureTargetIsActive(targetUser)

  if (!targetUser.adminProfile) {
    throw new NotFoundError('Admin profile not found for this user.')
  }

  return updateAdminProfileStatus(targetUserId, ApprovalStatus.APPROVED, actor.id ?? '')
}

export async function rejectAdmin(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureAdminCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Admin cannot reject themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Admin user not found.')
  }

  if (targetUser.role?.name !== 'ADMIN') {
    throw new ValidationError('Rejected target must have the ADMIN role.')
  }

  if (!targetUser.adminProfile) {
    throw new NotFoundError('Admin profile not found for this user.')
  }

  return updateAdminProfileStatus(targetUserId, ApprovalStatus.REJECTED, actor.id ?? '')
}

export async function suspendAdmin(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureAdminCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Admin cannot suspend themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Admin user not found.')
  }

  if (targetUser.role?.name !== 'ADMIN') {
    throw new ValidationError('Suspended target must have the ADMIN role.')
  }

  if (!targetUser.adminProfile) {
    throw new NotFoundError('Admin profile not found for this user.')
  }

  return updateAdminProfileStatus(targetUserId, ApprovalStatus.SUSPENDED, actor.id ?? '')
}

export async function reactivateAdmin(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureAdminCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Admin cannot reactivate themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Admin user not found.')
  }

  if (targetUser.role?.name !== 'ADMIN') {
    throw new ValidationError('Reactivated target must have the ADMIN role.')
  }

  ensureTargetIsActive(targetUser)

  if (!targetUser.adminProfile) {
    throw new NotFoundError('Admin profile not found for this user.')
  }

  return updateAdminProfileStatus(targetUserId, ApprovalStatus.APPROVED, actor.id ?? '')
}

export async function getInstructorsByStatus(status: ApprovalStatusFilter = 'ALL') {
  const actor = await getCurrentActor()
  ensureInstructorCaller(actor.role)

  const normalized = normalizeStatus(status)

  return prisma.user.findMany({
    where: {
      role: { is: { name: 'INSTRUCTOR' } },
      ...(normalized ? { instructorProfile: { status: normalized } } : {}),
    },
    include: {
      role: true,
      instructorProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveInstructor(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureInstructorCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Instructor cannot approve themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Instructor user not found.')
  }

  if (targetUser.role?.name !== 'INSTRUCTOR') {
    throw new ValidationError('Approved target must have the INSTRUCTOR role.')
  }

  ensureTargetIsActive(targetUser)

  if (!targetUser.instructorProfile) {
    throw new NotFoundError('Instructor profile not found for this user.')
  }

  return updateInstructorProfileStatus(targetUserId, ApprovalStatus.APPROVED, actor.id ?? '')
}

export async function rejectInstructor(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureInstructorCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Instructor cannot reject themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Instructor user not found.')
  }

  if (targetUser.role?.name !== 'INSTRUCTOR') {
    throw new ValidationError('Rejected target must have the INSTRUCTOR role.')
  }

  if (!targetUser.instructorProfile) {
    throw new NotFoundError('Instructor profile not found for this user.')
  }

  return updateInstructorProfileStatus(targetUserId, ApprovalStatus.REJECTED, actor.id ?? '')
}

export async function suspendInstructor(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureInstructorCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Instructor cannot suspend themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Instructor user not found.')
  }

  if (targetUser.role?.name !== 'INSTRUCTOR') {
    throw new ValidationError('Suspended target must have the INSTRUCTOR role.')
  }

  if (!targetUser.instructorProfile) {
    throw new NotFoundError('Instructor profile not found for this user.')
  }

  return updateInstructorProfileStatus(targetUserId, ApprovalStatus.SUSPENDED, actor.id ?? '')
}

export async function reactivateInstructor(targetUserId: string) {
  const actor = await getCurrentActor()
  ensureInstructorCaller(actor.role)

  if (targetUserId === actor.id) {
    throw new ForbiddenError('Instructor cannot reactivate themselves.')
  }

  const targetUser = await getUserForApproval(targetUserId)
  if (!targetUser) {
    throw new NotFoundError('Instructor user not found.')
  }

  if (targetUser.role?.name !== 'INSTRUCTOR') {
    throw new ValidationError('Reactivated target must have the INSTRUCTOR role.')
  }

  ensureTargetIsActive(targetUser)

  if (!targetUser.instructorProfile) {
    throw new NotFoundError('Instructor profile not found for this user.')
  }

  return updateInstructorProfileStatus(targetUserId, ApprovalStatus.APPROVED, actor.id ?? '')
}
