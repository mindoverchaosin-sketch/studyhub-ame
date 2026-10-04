'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ForbiddenError, UnauthorizedError, requireApprovedRole, ValidationError } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import {
  reactivateUserAccount,
  revokeAllUserSessions,
  revokePrivilegedRole,
  suspendUserIndefinitely,
  suspendUserTemporarily,
  terminateUserPermanently,
} from '@/server/services/user-lifecycle.service'

const lifecycleBaseSchema = z.object({
  userId: z.string().trim().min(1),
  reason: z.string().trim().min(4),
})

const temporarySuspendSchema = lifecycleBaseSchema.extend({
  suspensionEndsAt: z.string().trim().min(1),
})

function toLifecycleInput(formData: FormData) {
  return Object.fromEntries(formData.entries())
}

export async function suspendUserTemporarilyAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = temporarySuspendSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a valid future suspension end time and reason.')
    }

    const actorId = actor.user.id as string

    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.suspend',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        suspensionType: 'TEMPORARY',
        reason: parsed.data.reason,
        suspensionEndsAt: parsed.data.suspensionEndsAt,
      },
      run: () => suspendUserTemporarily(parsed.data.userId, parsed.data.reason, new Date(parsed.data.suspensionEndsAt), actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to manage account status.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The account could not be suspended right now.')
  }
}

export async function suspendUserIndefinitelyAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = lifecycleBaseSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a valid suspension reason.')
    }

    const actorId = actor.user.id as string
    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.suspend',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        suspensionType: 'INDEFINITE',
        reason: parsed.data.reason,
      },
      run: () => suspendUserIndefinitely(parsed.data.userId, parsed.data.reason, actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to manage account status.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The account could not be suspended indefinitely.')
  }
}

export async function reactivateUserAccountAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = lifecycleBaseSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a reactivation reason.')
    }

    const actorId = actor.user.id as string
    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.reactivate',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        reason: parsed.data.reason,
        oldStatus: 'SUSPENDED',
        newStatus: 'ACTIVE',
      },
      run: () => reactivateUserAccount(parsed.data.userId, parsed.data.reason, actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to reactivate accounts.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The account could not be reactivated.')
  }
}

export async function revokePrivilegedRoleAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = lifecycleBaseSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a valid reason.')
    }

    const actorId = actor.user.id as string
    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.role.revoke',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        reason: parsed.data.reason,
      },
      run: () => revokePrivilegedRole(parsed.data.userId, parsed.data.reason, actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to revoke roles.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The privileged role could not be revoked.')
  }
}

export async function terminateUserPermanentlyAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = lifecycleBaseSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a clear termination reason.')
    }

    const actorId = actor.user.id as string
    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.terminate',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        reason: parsed.data.reason,
      },
      run: () => terminateUserPermanently(parsed.data.userId, parsed.data.reason, actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to terminate accounts.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The account could not be terminated.')
  }
}

export async function revokeAllUserSessionsAction(formData: FormData): Promise<void> {
  try {
    const actor = await requireApprovedRole('SUPER_ADMIN')
    const parsed = lifecycleBaseSchema.safeParse(toLifecycleInput(formData))
    if (!parsed.success) {
      throw new ValidationError('Please provide a valid revocation reason.')
    }

    const actorId = actor.user.id as string
    await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.sessions.revoke',
      entityType: 'USER',
      entityId: parsed.data.userId,
      metadata: {
        reason: parsed.data.reason,
      },
      run: () => revokeAllUserSessions(parsed.data.userId, parsed.data.reason, actorId),
    })

    revalidatePath('/super-admin/users')
    revalidatePath(`/super-admin/users/${parsed.data.userId}`)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new Error('You need Super Admin access to revoke sessions.')
    }
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }
    throw new Error('The account sessions could not be revoked.')
  }
}