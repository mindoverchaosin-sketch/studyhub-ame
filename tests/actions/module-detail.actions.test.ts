import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  updateModule: vi.fn(),
  publish: vi.fn(),
  approveStudyMaterial: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/server/actions/audit-helpers", () => ({ withAuditLogging: ({ run }: { run: () => Promise<unknown> }) => run() }));
vi.mock("@/server/services/module-management.service", () => ({
  ModuleManagementService: class {
    updateModule = mocks.updateModule;
  },
}));
vi.mock("@/server/services/publishing.service", () => ({
  publishingService: { publish: mocks.publish },
}));
vi.mock("@/server/services/study-material-document.service", () => ({
  studyMaterialDocumentService: { approve: mocks.approveStudyMaterial },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

describe("module detail server actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.updateModule.mockResolvedValue({ id: "module-1", status: "DRAFT" });
    mocks.publish.mockResolvedValue({ targetId: "module-1", workflowState: "PUBLISHED" });
    mocks.approveStudyMaterial.mockResolvedValue({ id: "material-1", status: "IN_REVIEW" });
  });

  it("saves module changes and revalidates both detail and list routes", async () => {
    const { updateModuleAction } = await import("@/server/actions/content-management.actions");

    await updateModuleAction("module-1", { title: "Updated title" });

    expect(mocks.requirePermission).toHaveBeenCalledWith("manageModules");
    expect(mocks.updateModule).toHaveBeenCalledWith("module-1", { title: "Updated title" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules/module-1");
  });

  it("propagates save errors and does not report a successful revalidation", async () => {
    mocks.updateModule.mockRejectedValueOnce(new Error("Module update failed"));
    const { updateModuleAction } = await import("@/server/actions/content-management.actions");

    await expect(updateModuleAction("module-1", { title: "Updated title" })).rejects.toThrow("Module update failed");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates the module detail page after publishing", async () => {
    const { publishContentAction } = await import("@/server/actions/publishing.actions");

    await publishContentAction("MODULE", "module-1");

    expect(mocks.requirePermission).toHaveBeenCalledWith("publishContent");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules/module-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules");
  });

  it("revalidates a resource's owning module after publishing", async () => {
    const { publishContentAction } = await import("@/server/actions/publishing.actions");

    await publishContentAction("STUDY_MATERIAL", "material-1", "module-1");

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/materials");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules/module-1");
  });

  it("revalidates the owning module after study material approval", async () => {
    const { approveStudyMaterialAction } = await import("@/server/actions/study-material-editorial.actions");

    await approveStudyMaterialAction("material-1", "module-1");

    expect(mocks.requirePermission).toHaveBeenCalledWith("publishContent");
    expect(mocks.approveStudyMaterial).toHaveBeenCalledWith("material-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/materials");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/modules/module-1");
  });
});
