import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  archiveContentAction: vi.fn(),
  approvePublishingAction: vi.fn(),
  publishContentAction: vi.fn(),
  rejectPublishingAction: vi.fn(),
  submitForReviewAction: vi.fn(),
  unpublishContentAction: vi.fn(),
  unarchiveModuleAction: vi.fn(),
  updateModuleAction: vi.fn(),
}));

vi.mock("@/server/actions/publishing.actions", () => ({
  archiveContentAction: mocks.archiveContentAction,
  approvePublishingAction: mocks.approvePublishingAction,
  publishContentAction: mocks.publishContentAction,
  rejectPublishingAction: mocks.rejectPublishingAction,
  submitForReviewAction: mocks.submitForReviewAction,
  unpublishContentAction: mocks.unpublishContentAction,
}));
vi.mock("@/server/actions/content-management.actions", () => ({
  unarchiveModuleAction: mocks.unarchiveModuleAction,
  updateModuleAction: mocks.updateModuleAction,
}));

const moduleData = {
  id: "module-1",
  title: "Digital Techniques",
  slug: "digital-techniques",
  moduleNumber: "5",
  description: "Digital systems",
  examType: "DGCA" as const,
  status: "DRAFT" as const,
  difficulty: "BEGINNER" as const,
  estimatedHours: 3,
  displayOrder: 5,
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  publishedAt: null,
  lessons: [],
  resources: [],
};

describe("ModuleDetailActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows save success feedback and only offers draft-valid workflow actions", async () => {
    mocks.updateModuleAction.mockResolvedValueOnce({ id: "module-1", status: "DRAFT" });
    const { default: ModuleDetailActions } = await import("@/components/admin/modules/ModuleDetailActions");
    render(<ModuleDetailActions module={moduleData} canPublish />);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Save changes completed.");
    expect(mocks.updateModuleAction).toHaveBeenCalledWith("module-1", expect.objectContaining({ title: "Digital Techniques" }));
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  it("displays a server action failure", async () => {
    mocks.updateModuleAction.mockRejectedValueOnce(new Error("Module update failed"));
    const { default: ModuleDetailActions } = await import("@/components/admin/modules/ModuleDetailActions");
    render(<ModuleDetailActions module={moduleData} canPublish />);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Module update failed");
  });
});
