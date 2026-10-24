import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  approveStudyMaterialAction: vi.fn(),
  archiveStudyMaterialEditorialAction: vi.fn(),
  publishStudyMaterialAction: vi.fn(),
  rejectStudyMaterialAction: vi.fn(),
  submitStudyMaterialForReviewAction: vi.fn(),
  unpublishStudyMaterialEditorialAction: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { role: "ADMIN" } } }) }));
vi.mock("@/server/services/authorization.service", () => ({ hasPermission: mocks.hasPermission }));
vi.mock("@/server/actions/study-material-editorial.actions", () => ({
  approveStudyMaterialAction: mocks.approveStudyMaterialAction,
  archiveStudyMaterialEditorialAction: mocks.archiveStudyMaterialEditorialAction,
  publishStudyMaterialAction: mocks.publishStudyMaterialAction,
  rejectStudyMaterialAction: mocks.rejectStudyMaterialAction,
  submitStudyMaterialForReviewAction: mocks.submitStudyMaterialForReviewAction,
  unpublishStudyMaterialEditorialAction: mocks.unpublishStudyMaterialEditorialAction,
}));

const resource = {
  id: "material-1",
  moduleId: "module-1",
  lessonId: "lesson-1",
  title: "Digital Logic Notes",
  description: null,
  type: "PDF",
  url: "/media/notes.pdf",
  isPremium: false,
  status: "IN_REVIEW" as const,
  editorialStatus: "IN_REVIEW" as const,
  publishedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("ModuleResourcesPanel actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasPermission.mockReturnValue(true);
  });

  it("awaits resource actions and displays server action errors", async () => {
    mocks.rejectStudyMaterialAction.mockRejectedValueOnce(new Error("Review rejection failed"));
    const { default: ModuleResourcesPanel } = await import("@/components/admin/modules/ModuleResourcesPanel");
    render(<ModuleResourcesPanel moduleId="module-1" resources={[resource]} />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Review rejection failed");
    expect(mocks.rejectStudyMaterialAction).toHaveBeenCalledWith("material-1", "module-1", "Needs revision");
  });

  it("shows success feedback and advances the editorial status after approval", async () => {
    mocks.approveStudyMaterialAction.mockResolvedValueOnce({ id: "material-1", status: "IN_REVIEW" });
    const { default: ModuleResourcesPanel } = await import("@/components/admin/modules/ModuleResourcesPanel");
    render(<ModuleResourcesPanel moduleId="module-1" resources={[resource]} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("status")).toHaveTextContent('Approve completed for "Digital Logic Notes".');
    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument());
  });
});
