import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`); }),
  notFound: vi.fn((): never => { throw new Error("NEXT_NOT_FOUND"); }),
  getModuleDetail: vi.fn(),
  listResources: vi.fn(),
  listLessons: vi.fn(),
  listMockTests: vi.fn(),
  findForAdmin: vi.fn(),
  findByIdWithCount: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/auth", () => {
  class AppError extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  }
  class NotFoundError extends AppError {
    constructor(message: string) {
      super(message, 404);
    }
  }
  return { AppError, NotFoundError, requirePermission: mocks.requirePermission };
});
vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/components/admin/PageHeader", () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock("@/server/services/module-management.service", () => ({
  ModuleManagementService: class {
    getModuleDetail = mocks.getModuleDetail;
  },
}));
vi.mock("@/server/services/study-material-management.service", () => ({
  StudyMaterialManagementService: class {
    listResources = mocks.listResources;
  },
}));
vi.mock("@/components/admin/modules/ModuleDetailActions", () => ({ default: () => <div>Module actions</div> }));
vi.mock("@/components/admin/modules/ModuleResourcesPanel", () => ({ default: () => <div>Module resources</div> }));
vi.mock("@/components/admin/modules/ModuleDetailWorkspace", () => ({
  ModuleDetailWorkspace: (props: { mockTests: Array<{ id: string; title: string }>; quizzes: Array<{ id: string }>; questionBanks: Array<{ id: string }> }) => (
    <div data-testid="module-workspace" data-mock-tests={props.mockTests.map((item) => item.id).join(",")} data-quizzes={props.quizzes.map((item) => item.id).join(",")} data-question-banks={props.questionBanks.map((item) => item.id).join(",")} />
  ),
}));
vi.mock("@/server/services/authorization.service", () => ({ hasPermission: mocks.hasPermission }));
vi.mock("@/server/services/admin-cms.service", () => ({
  listLessons: mocks.listLessons,
  listMockTests: mocks.listMockTests,
}));
vi.mock("@/server/repositories/quiz.repository", () => ({
  quizRepository: { findForAdmin: mocks.findForAdmin },
}));
vi.mock("@/server/repositories/question-bank.repository", () => ({
  questionBankRepository: { findByIdWithCount: mocks.findByIdWithCount },
}));

const moduleDetail = {
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

describe("Admin module detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.getModuleDetail.mockResolvedValue(moduleDetail);
    mocks.listResources.mockResolvedValue([]);
    mocks.listLessons.mockResolvedValue({ success: true, data: { items: [] } });
    mocks.listMockTests.mockResolvedValue({ success: true, data: { items: [] } });
    mocks.findForAdmin.mockResolvedValue([]);
    mocks.findByIdWithCount.mockResolvedValue(null);
    mocks.hasPermission.mockReturnValue(true);
  });

  it("uses notFound for a missing module", async () => {
    const { NotFoundError } = await import("@/auth");
    mocks.getModuleDetail.mockRejectedValueOnce(new NotFoundError("Module not found"));
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    await expect(ModuleDetailPage({ params: Promise.resolve({ moduleId: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("shows an expected domain error to the administrator", async () => {
    const { AppError } = await import("@/auth");
    mocks.getModuleDetail.mockRejectedValueOnce(new AppError("Module data is invalid.", 400));
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    render(await ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("Module data is invalid.");
  });

  it("renders a useful state and logs unexpected data errors", async () => {
    const error = new Error("Database connection details");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getModuleDetail.mockRejectedValueOnce(error);
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    render(await ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("The module could not be loaded");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Database connection details");
    expect(log).toHaveBeenCalledWith("Failed to load Admin module detail", { moduleId: "module-1", error });
    log.mockRestore();
  });

  it("loads module-scoped quiz, question-bank, lesson, and mock-test data", async () => {
    mocks.listLessons.mockResolvedValue({ success: true, data: { items: [{ id: "lesson-1" }] } });
    mocks.findForAdmin.mockResolvedValue([{
      id: "quiz-1",
      title: "Module quiz",
      status: "PUBLISHED",
      _count: { attempts: 2 },
      questionBanks: [{ id: "bank-1", title: "Shared bank" }],
    }]);
    mocks.findByIdWithCount.mockResolvedValue({ id: "bank-1", title: "Shared bank", status: "ACTIVE", questionCount: 8 });
    mocks.listMockTests.mockResolvedValue({ success: true, data: { items: [{
      id: "template-1",
      title: "Module mock test",
      status: "Published",
      durationMinutes: 60,
      questionCount: 20,
    }] } });
    const { default: ModuleDetailPage } = await import("@/app/(admin)/admin/modules/[moduleId]/page");

    render(await ModuleDetailPage({ params: Promise.resolve({ moduleId: "module-1" }) }));

    expect(mocks.findForAdmin).toHaveBeenCalledWith({ moduleId: "module-1" });
    expect(mocks.listMockTests).toHaveBeenCalledWith({ moduleId: "module-1", pageSize: 1000 });
    expect(screen.getByTestId("module-workspace")).toHaveAttribute("data-mock-tests", "template-1");
    expect(screen.getByTestId("module-workspace")).toHaveAttribute("data-quizzes", "quiz-1");
    expect(screen.getByTestId("module-workspace")).toHaveAttribute("data-question-banks", "bank-1");
  });

});
