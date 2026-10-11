import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`); }),
  hasPermission: vi.fn(),
}));

vi.mock("@/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/admin/modules/ModuleDetailPageContent", () => ({
  default: () => <div data-testid="module-workspace" />,
}));
vi.mock("@/server/services/authorization.service", () => ({ hasPermission: mocks.hasPermission }));

describe("Admin module detail route (Phase 2C-2 Step 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.hasPermission.mockReturnValue(true);
  });

  it("keeps the Admin detail route available to Super Admin", async () => {
    mocks.requirePermission.mockResolvedValueOnce({ user: { id: "super-admin-1", role: "SUPER_ADMIN" } });
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    render(await ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(mocks.requirePermission).toHaveBeenCalledWith("manageModules");
    expect(screen.getByTestId("module-workspace")).toBeInTheDocument();
  });

  it("keeps the Admin detail route available to Admin", async () => {
    mocks.requirePermission.mockResolvedValueOnce({ user: { id: "admin-1", role: "ADMIN" } });
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    render(await ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(mocks.requirePermission).toHaveBeenCalledWith("manageModules");
    expect(screen.getByTestId("module-workspace")).toBeInTheDocument();
  });

  it("redirects Content Editors from the Admin shell to their module route", async () => {
    mocks.requirePermission.mockResolvedValueOnce({ user: { id: "editor-1", role: "CONTENT_EDITOR" } });
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    await expect(ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }))
      .rejects.toThrow("REDIRECT:/content-editor/modules/module-1");
    expect(mocks.redirect).toHaveBeenCalledWith("/content-editor/modules/module-1");
  });
});
