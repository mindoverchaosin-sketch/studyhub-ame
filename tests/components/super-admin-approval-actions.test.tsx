import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const { mockActions, mockRefresh } = vi.hoisted(() => ({
  mockActions: {
    approveAdminAction: vi.fn(),
    approveInstructorAction: vi.fn(),
    reactivateAdminAction: vi.fn(),
    reactivateInstructorAction: vi.fn(),
    rejectAdminAction: vi.fn(),
    rejectInstructorAction: vi.fn(),
    suspendAdminAction: vi.fn(),
    suspendInstructorAction: vi.fn(),
  },
  mockRefresh: vi.fn(),
}))

vi.mock("@/server/actions/approval-management.actions", () => mockActions)
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

import ApprovalActionButtons from "@/components/super-admin/ApprovalActionButtons"

describe("Super Admin approval action controls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(mockActions).forEach((action) => action.mockResolvedValue({}))
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("confirms before calling the existing approve action and refreshes on success", async () => {
    render(<ApprovalActionButtons userId="admin-1" kind="admin" status="PENDING" />)

    fireEvent.click(screen.getByRole("button", { name: "Approve" }))

    expect(window.confirm).toHaveBeenCalledWith("Approve this administrator account?")
    await waitFor(() => expect(mockActions.approveAdminAction).toHaveBeenCalledWith("admin-1"))
    expect(mockRefresh).toHaveBeenCalledOnce()
    expect(screen.getByRole("status")).toHaveTextContent("Approve completed.")
  })

  it("does not call a privileged action when confirmation is declined", () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<ApprovalActionButtons userId="admin-2" kind="admin" status="PENDING" />)

    fireEvent.click(screen.getByRole("button", { name: "Reject" }))

    expect(mockActions.rejectAdminAction).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("shows server errors without hiding them in the UI", async () => {
    mockActions.suspendInstructorAction.mockRejectedValue(new Error("Target cannot be suspended."))
    render(<ApprovalActionButtons userId="instructor-1" kind="instructor" status="APPROVED" />)

    fireEvent.click(screen.getByRole("button", { name: "Suspend" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Target cannot be suspended.")
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})