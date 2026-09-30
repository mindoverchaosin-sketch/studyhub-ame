import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const { mockCreateUser, mockReplace, mockRefresh } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock("@/server/actions/user-management.actions", () => ({ createPrivilegedUserAction: mockCreateUser }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }) }))

import AddUserDialog from "@/components/super-admin/AddUserDialog"

describe("Super Admin Add User dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  it("shows only fields supported by the selected role", async () => {
    render(<AddUserDialog />)
    fireEvent.click(screen.getByRole("button", { name: "Add User" }))

    expect(await screen.findByRole("dialog", { name: "Add User" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Department/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Role/), { target: { value: "INSTRUCTOR" } })
    expect(screen.getByLabelText(/^Instructor bio/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Department/)).not.toBeInTheDocument()
    expect(screen.getByText(/require its existing Instructor approval/)).toBeInTheDocument()
  })

  it("creates the account, closes the dialog, and refreshes the unfiltered Users list", async () => {
    mockCreateUser.mockResolvedValue({
      success: true,
      user: { id: "new-user", email: "editor@example.com", displayName: "Editor User", role: "CONTENT_EDITOR", status: "ACTIVE", createdAt: "2026-09-29T00:00:00.000Z" },
    })
    render(<AddUserDialog />)
    fireEvent.click(screen.getByRole("button", { name: "Add User" }))
    fireEvent.change(await screen.findByLabelText(/^Role/), { target: { value: "CONTENT_EDITOR" } })
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Editor User" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "editor@example.com" } })
    fireEvent.change(screen.getByLabelText(/^Temporary password/), { target: { value: "temporary-secret" } })
    fireEvent.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() => expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ role: "CONTENT_EDITOR", isActive: true })))
    expect(mockReplace).toHaveBeenCalledWith("/super-admin/users")
    expect(mockRefresh).toHaveBeenCalledOnce()
    expect(await screen.findByRole("status")).toHaveTextContent("Editor User was created as Content Editor.")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("displays duplicate-email and permission errors returned by the server", async () => {
    mockCreateUser.mockResolvedValue({ success: false, code: "DUPLICATE_EMAIL", message: "An account with that email already exists." })
    render(<AddUserDialog />)
    fireEvent.click(screen.getByRole("button", { name: "Add User" }))
    fireEvent.change(await screen.findByLabelText("Full Name"), { target: { value: "Example Person" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taken@example.com" } })
    fireEvent.change(screen.getByLabelText(/^Temporary password/), { target: { value: "temporary-secret" } })
    fireEvent.click(screen.getByRole("button", { name: "Create user" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Email already in use")
    expect(screen.getByRole("alert")).toHaveTextContent("An account with that email already exists.")
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})