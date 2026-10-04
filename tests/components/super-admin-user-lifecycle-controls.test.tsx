import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const { actions, refresh } = vi.hoisted(() => ({
  actions: {
    reactivateUserAccountAction: vi.fn(),
    revokeAllUserSessionsAction: vi.fn(),
    revokePrivilegedRoleAction: vi.fn(),
    suspendUserIndefinitelyAction: vi.fn(),
    suspendUserTemporarilyAction: vi.fn(),
    terminateUserPermanentlyAction: vi.fn(),
  },
  refresh: vi.fn(),
}))

vi.mock('@/server/actions/user-lifecycle.actions', () => actions)
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import UserLifecycleControls from '@/components/super-admin/UserLifecycleControls'

describe('Super Admin lifecycle controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(actions).forEach((action) => action.mockResolvedValue(undefined))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('shows status-appropriate actions and hides role revocation for student and Super Admin roles', () => {
    const { rerender } = render(<UserLifecycleControls userId="user-1" role="ADMIN" status="ACTIVE" />)

    expect(screen.getByRole('button', { name: 'Suspend Temporarily' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suspend Indefinitely' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revoke Privileged Role' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reactivate' })).not.toBeInTheDocument()

    rerender(<UserLifecycleControls userId="user-1" role="STUDENT" status="SUSPENDED" />)
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Suspend/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Revoke Privileged Role' })).not.toBeInTheDocument()

    rerender(<UserLifecycleControls userId="user-1" role="SUPER_ADMIN" status="ACTIVE" />)
    expect(screen.queryByRole('button', { name: 'Revoke Privileged Role' })).not.toBeInTheDocument()

    rerender(<UserLifecycleControls userId="user-1" role="STUDENT" status="TERMINATED" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('confirms before dispatch, shows pending state, and reports success', async () => {
    let completeAction: (() => void) | undefined
    actions.suspendUserTemporarilyAction.mockImplementation(() => new Promise<void>((resolve) => { completeAction = resolve }))
    render(<UserLifecycleControls userId="student-1" role="STUDENT" status="ACTIVE" />)

    fireEvent.change(screen.getAllByLabelText('Reason')[0], { target: { value: 'Policy violation' } })
    fireEvent.change(screen.getByLabelText('Suspension end'), { target: { value: '2030-01-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Suspend Temporarily' }))

    expect(window.confirm).toHaveBeenCalledWith('Suspend this account temporarily?')
    await waitFor(() => expect(actions.suspendUserTemporarilyAction).toHaveBeenCalledOnce())
    const pendingButtons = screen.getAllByRole('button', { name: 'Working...' })
    expect(pendingButtons.length).toBeGreaterThan(1)
    pendingButtons.forEach((button) => expect(button).toBeDisabled())
    expect(actions.suspendUserTemporarilyAction.mock.calls[0][0].get('userId')).toBe('student-1')

    completeAction?.()
    expect(await screen.findByRole('status')).toHaveTextContent('Temporary suspension completed.')
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('does not dispatch when confirmation is declined', () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<UserLifecycleControls userId="student-1" role="STUDENT" status="ACTIVE" />)

    fireEvent.change(screen.getAllByLabelText('Reason')[0], { target: { value: 'Policy violation' } })
    fireEvent.change(screen.getByLabelText('Suspension end'), { target: { value: '2030-01-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Suspend Temporarily' }))

    expect(actions.suspendUserTemporarilyAction).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('surfaces server failures accessibly and does not refresh', async () => {
    actions.terminateUserPermanentlyAction.mockRejectedValue(new Error('Termination was rejected.'))
    render(<UserLifecycleControls userId="student-1" role="STUDENT" status="ACTIVE" />)

    fireEvent.change(screen.getByLabelText('Termination reason'), { target: { value: 'Policy violation' } })
    fireEvent.click(screen.getByRole('button', { name: 'Terminate Permanently' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Termination was rejected.')
    expect(refresh).not.toHaveBeenCalled()
  })
})