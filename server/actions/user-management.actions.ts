'use server'

import { revalidatePath } from 'next/cache'
import { ForbiddenError, requireApprovedRole, UnauthorizedError } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import {
  createPrivilegedUser,
  DuplicateUserEmailError,
  privilegedUserCreationSchema,
} from '@/server/services/user-management.service'

export type CreatePrivilegedUserResult =
  | { success: true; user: Awaited<ReturnType<typeof createPrivilegedUser>> }
  | { success: false; code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INVALID_INPUT' | 'DUPLICATE_EMAIL' | 'SERVER_ERROR'; message: string; fieldErrors?: Record<string, string[]> }

export async function createPrivilegedUserAction(input: unknown): Promise<CreatePrivilegedUserResult> {
  try {
    await requireApprovedRole('SUPER_ADMIN')
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, code: 'UNAUTHENTICATED', message: 'Sign in with a Super Admin account to create users.' }
    }
    return { success: false, code: 'FORBIDDEN', message: 'Only Super Admins can create privileged users.' }
  }

  const parsed = privilegedUserCreationSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      message: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const user = await withAuditLogging({
      permission: 'manageUsers',
      action: 'user.create',
      entityType: 'USER',
      metadata: { source: 'super-admin-users', assignedRole: parsed.data.role },
      run: () => createPrivilegedUser(parsed.data),
    })
    revalidatePath('/super-admin/users')
    return { success: true, user }
  } catch (error) {
    if (error instanceof DuplicateUserEmailError) {
      return { success: false, code: 'DUPLICATE_EMAIL', message: error.message }
    }
    if (error instanceof ForbiddenError) {
      return { success: false, code: 'FORBIDDEN', message: 'Only Super Admins can create privileged users.' }
    }
    return { success: false, code: 'SERVER_ERROR', message: 'The user could not be created. Please try again.' }
  }
}