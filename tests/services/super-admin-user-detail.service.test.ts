import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockFindById } = vi.hoisted(() => ({ mockFindById: vi.fn() }))

vi.mock("@/server/repositories/user.repository", () => ({ userRepository: { findById: mockFindById } }))

describe("Super Admin user detail projection", () => {
  beforeEach(() => mockFindById.mockReset())

  it("returns only account details needed by the portal", async () => {
    mockFindById.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      password: "must-not-be-returned",
      displayName: "Aero User",
      role: { name: "ADMIN" },
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-02-01T00:00:00Z"),
      adminProfile: { status: "PENDING" },
      instructorProfile: null,
      studentProfile: null,
    })

    const { getUserManagementDetail } = await import("@/server/services/user-management.service")
    const result = await getUserManagementDetail("user-1")

    expect(result).toMatchObject({ id: "user-1", role: "ADMIN", status: "ACTIVE", adminApprovalStatus: "PENDING" })
    expect(result).not.toHaveProperty("password")
  })

  it("returns null for a missing account", async () => {
    mockFindById.mockResolvedValue(null)

    const { getUserManagementDetail } = await import("@/server/services/user-management.service")
    await expect(getUserManagementDetail("missing")).resolves.toBeNull()
  })
})