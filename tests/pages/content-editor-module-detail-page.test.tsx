import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { requirePermission as productionRequirePermission } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  getServerSession: vi.fn(),
  findUserById: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`); }),
  hasPermission: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn(() => ({})) }));
vi.mock("@/server/repositories/user.repository", () => ({
  userRepository: { findById: mocks.findUserById },
}));
vi.mock("@/server/services/user.service", () => ({ getUserByEmail: vi.fn() }));
vi.mock("@/server/services/audit-log.service", () => ({ auditLogService: { recordEvent: vi.fn() } }));
vi.mock("@/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/content-editor/ContentEditorLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="content-editor-layout">{children}</div>,
}));
vi.mock("@/components/admin/modules/ModuleDetailPageContent", () => ({
  default: (props: { moduleId: string; basePath: string; canPublish: boolean }) => (
    <div data-testid="module-detail-content" data-module-id={props.moduleId} data-base-path={props.basePath} data-can-publish={String(props.canPublish)} />
  ),
}));
vi.mock("@/server/services/authorization.service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/authorization.service")>("@/server/services/authorization.service");
  return { ...actual, hasPermission: mocks.hasPermission };
});
describe("Content Editor module detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "CONTENT_EDITOR" } });
    mocks.hasPermission.mockReturnValue(true);
  });

  it("renders the shared module workspace in the Content Editor shell for an authorized editor", async () => {
    const { default: ContentEditorModuleDetailPage } = await import("@/app/content-editor/modules/[moduleId]/page");
    render(await ContentEditorModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(mocks.requirePermission).toHaveBeenCalledWith("manageModules");
    expect(screen.getByTestId("content-editor-layout")).toContainElement(screen.getByTestId("module-detail-content"));
    expect(screen.getByTestId("module-detail-content")).toHaveAttribute("data-module-id", "module-1");
    expect(screen.getByTestId("module-detail-content")).toHaveAttribute("data-base-path", "/content-editor");
    expect(screen.getByTestId("module-detail-content")).toHaveAttribute("data-can-publish", "true");
  });

  it("denies Instructor access before rendering the workspace", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { id: "instructor-1", role: "INSTRUCTOR" } });
    mocks.findUserById.mockResolvedValueOnce({
      id: "instructor-1",
      isActive: true,
      sessionVersion: 0,
      role: { name: "INSTRUCTOR" },
      instructorProfile: { status: "APPROVED" },
    });
    mocks.requirePermission.mockImplementationOnce((permission: string) => productionRequirePermission(permission));
    const { default: ContentEditorModuleDetailPage } = await import("@/app/content-editor/modules/[moduleId]/page");

    await expect(ContentEditorModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }))
      .rejects.toThrow("REDIRECT:/unauthorized?reason=access-denied");
    expect(mocks.getServerSession).toHaveBeenCalled();
    expect(mocks.findUserById).toHaveBeenCalledWith("instructor-1");
    expect(mocks.redirect).toHaveBeenCalledWith("/unauthorized?reason=access-denied");
  });
});
