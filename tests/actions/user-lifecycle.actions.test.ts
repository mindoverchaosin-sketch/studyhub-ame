import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireApprovedRole, requirePermission, recordAuditEvent, revalidatePath, services } = vi.hoisted(() => ({
  requireApprovedRole: vi.fn(),
  requirePermission: vi.fn(),
  recordAuditEvent: vi.fn(),
  revalidatePath: vi.fn(),
  services: {
    reactivateUserAccount: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    revokePrivilegedRole: vi.fn(),
    suspendUserIndefinitely: vi.fn(),
    suspendUserTemporarily: vi.fn(),
    terminateUserPermanently: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({
  requireApprovedRole,
  requirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
  ValidationError: class ValidationError extends Error {},
}))
vi.mock('@/server/services/audit-log.service', () => ({ auditLogService: { recordEvent: recordAuditEvent } }))
vi.mock('@/server/services/user-lifecycle.service', () => services)
vi.mock('next/cache', () => ({ revalidatePath }))

import { ForbiddenError, UnauthorizedError, ValidationError } from '@/auth'
import {
  reactivateUserAccountAction,
  revokeAllUserSessionsAction,
  revokePrivilegedRoleAction,
  suspendUserIndefinitelyAction,
  suspendUserTemporarilyAction,
  terminateUserPermanentlyAction,
} from '@/server/actions/user-lifecycle.actions'

const actor = { user: { id: 'actor-super-1', role: 'SUPER_ADMIN' } }

function makeForm(fields: Record<string, string> = {}) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}

const actions = [
  {
    name: 'temporary suspension',
    action: suspendUserTemporarilyAction,
    service: services.suspendUserTemporarily,
    auditAction: 'user.suspend',
    form: makeForm({ userId: 'target-1', reason: 'Policy violation', suspensionEndsAt: '2030-01-01T12:00' }),
    metadata: { suspensionType: 'TEMPORARY', reason: 'Policy violation', suspensionEndsAt: '2030-01-01T12:00' },
  },
  {
    name: 'indefinite suspension',
    action: suspendUserIndefinitelyAction,
    service: services.suspendUserIndefinitely,
    auditAction: 'user.suspend',
    form: makeForm({ userId: 'target-1', reason: 'Policy violation' }),
    metadata: { suspensionType: 'INDEFINITE', reason: 'Policy violation' },
  },
  {
    name: 'reactivation',
    action: reactivateUserAccountAction,
    service: services.reactivateUserAccount,
    auditAction: 'user.reactivate',
    form: makeForm({ userId: 'target-1', reason: 'Review completed' }),
    metadata: { reason: 'Review completed', oldStatus: 'SUSPENDED', newStatus: 'ACTIVE' },
  },
  {
    name: 'role revocation',
    action: revokePrivilegedRoleAction,
    service: services.revokePrivilegedRole,
    auditAction: 'user.role.revoke',
    form: makeForm({ userId: 'target-1', reason: 'Role no longer required' }),
    metadata: { reason: 'Role no longer required' },
  },
  {
    name: 'termination',
    action: terminateUserPermanentlyAction,
    service: services.terminateUserPermanently,
    auditAction: 'user.terminate',
    form: makeForm({ userId: 'target-1', reason: 'Confirmed policy breach' }),
    metadata: { reason: 'Confirmed policy breach' },
  },
  {
    name: 'session revocation',
    action: revokeAllUserSessionsAction,
    service: services.revokeAllUserSessions,
    auditAction: 'user.sessions.revoke',
    form: makeForm({ userId: 'target-1', reason: 'Security review' }),
    metadata: { reason: 'Security review' },
  },
] as const

describe('Super Admin lifecycle server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireApprovedRole.mockResolvedValue(actor)
    requirePermission.mockResolvedValue(actor)
    recordAuditEvent.mockResolvedValue({ id: 'audit-1' })
    for (const action of actions) action.service.mockResolvedValue({ id: 'target-1', accountStatus: 'SUSPENDED', role: 'STUDENT' })
  })

  it.each(actions)('authorizes and audits $name with actor and target details', async ({ action, service, auditAction, form, metadata }) => {
    await action(form)

    expect(requireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(requirePermission).toHaveBeenCalledWith('manageUsers')
    expect(service).toHaveBeenCalled()
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'actor-super-1',
      actorRole: 'SUPER_ADMIN',
      action: auditAction,
      entityType: 'USER',
      entityId: 'target-1',
      success: true,
      metadata: expect.objectContaining({ source: 'server-action', ...metadata }),
    }))
    expect(revalidatePath).toHaveBeenCalledWith('/super-admin/users')
    expect(revalidatePath).toHaveBeenCalledWith('/super-admin/users/target-1')
  })

  it.each(actions)('rejects direct unauthenticated invocation of $name', async ({ action, service, form }) => {
    requireApprovedRole.mockRejectedValue(new UnauthorizedError('Sign in required.'))

    await expect(action(form)).rejects.toThrow()

    expect(service).not.toHaveBeenCalled()
    expect(requirePermission).not.toHaveBeenCalled()
    expect(recordAuditEvent).not.toHaveBeenCalled()
  })

  it.each(actions)('rejects direct non-Super-Admin invocation of $name', async ({ action, service, form }) => {
    requireApprovedRole.mockRejectedValue(new ForbiddenError('Super Admin required.'))

    await expect(action(form)).rejects.toThrow()

    expect(service).not.toHaveBeenCalled()
    expect(requirePermission).not.toHaveBeenCalled()
    expect(recordAuditEvent).not.toHaveBeenCalled()
  })

  it('rejects malformed inputs before invoking lifecycle services or audit logging', async () => {
    await expect(suspendUserTemporarilyAction(makeForm({ userId: 'target-1', reason: 'bad', suspensionEndsAt: 'invalid' }))).rejects.toThrow(ValidationError)
    await expect(terminateUserPermanentlyAction(makeForm({ userId: 'target-1', reason: ' ' }))).rejects.toThrow(ValidationError)

    for (const action of actions) expect(action.service).not.toHaveBeenCalled()
    expect(requirePermission).not.toHaveBeenCalled()
    expect(recordAuditEvent).not.toHaveBeenCalled()
  })

  it('records failed lifecycle attempts with actor, target, and reason', async () => {
    services.terminateUserPermanently.mockRejectedValue(new ValidationError('The user is already terminated.'))

    await expect(actions[4].action(actions[4].form)).rejects.toThrow('The user is already terminated.')

    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'actor-super-1',
      actorRole: 'SUPER_ADMIN',
      action: 'user.terminate',
      entityType: 'USER',
      entityId: 'target-1',
      success: false,
      metadata: expect.objectContaining({ reason: 'Confirmed policy breach', error: 'The user is already terminated.' }),
    }))
  })

  it('returns a safe server error and records the audit failure when persistence fails', async () => {
    services.revokeAllUserSessions.mockRejectedValue(new Error('Database request failed.'))

    await expect(actions[5].action(actions[5].form)).rejects.toThrow('The account sessions could not be revoked.')

    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'actor-super-1',
      actorRole: 'SUPER_ADMIN',
      action: 'user.sessions.revoke',
      entityId: 'target-1',
      success: false,
      metadata: expect.objectContaining({ reason: 'Security review', error: 'Database request failed.' }),
    }))
  })
})