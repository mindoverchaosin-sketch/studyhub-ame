import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import RolePermissionMatrix from "@/components/super-admin/RolePermissionMatrix"
import { getPermissionMatrix } from "@/server/services/authorization.service"

describe("Super Admin role permission matrix", () => {
  it("renders the existing role capabilities without introducing client-side grants", () => {
    render(<RolePermissionMatrix matrix={getPermissionMatrix()} />)

    expect(screen.getByRole("columnheader", { name: "SUPER_ADMIN" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "ADMIN" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "CONTENT_EDITOR" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "STUDENT" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "INSTRUCTOR" })).toBeInTheDocument()
    const modulesRow = screen.getByRole("row", { name: /Manage modules/ })
    expect(within(modulesRow).getByLabelText("CONTENT_EDITOR: granted")).toBeInTheDocument()
    expect(within(modulesRow).getByLabelText("STUDENT: not granted")).toBeInTheDocument()
  })
})