import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppError, NotFoundError, requirePermission } from "@/auth";
import type { AuthSession } from "@/lib/auth/index";
import PageHeader from "@/components/admin/PageHeader";
import { ModuleManagementService } from "@/server/services/module-management.service";
import { StudyMaterialManagementService } from "@/server/services/study-material-management.service";
import ModuleDetailActions from "@/components/admin/modules/ModuleDetailActions";
import { hasPermission } from "@/server/services/authorization.service";
import type { ModuleDetailDTO } from "@/server/application/dto/module-management.dto";
import type { ResourceDTO } from "@/server/application/dto/resource.dto";
import { ModuleDetailWorkspace } from "@/components/admin/modules/ModuleDetailWorkspace";
import { quizRepository } from "@/server/repositories/quiz.repository";
import { questionBankRepository } from "@/server/repositories/question-bank.repository";
import * as adminCmsService from "@/server/services/admin-cms.service";
import type { AdminLesson } from "@/types/admin";

export default async function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  let session: AuthSession;
  try {
    session = await requirePermission('manageModules');
  } catch {
    redirect("/login");
  }

  const { moduleId } = await params;
  const service = new ModuleManagementService();
  const resourceService = new StudyMaterialManagementService();
  let moduleDetail: ModuleDetailDTO | undefined;
  let resources: ResourceDTO[] | undefined;
  let lessons: AdminLesson[] | undefined;
  let quizzes: Array<{ id: string; title: string; status: string; attemptCount: number; questionBankTitles: string[] }> | undefined;
  let questionBanks: Array<{ id: string; title: string; status: string; questionCount: number }> | undefined;
  let mockTests: Array<{ id: string; title: string; status: string; durationMinutes: number; questionCount: number }> | undefined;
  let loadError: string | null = null;

  try {
    [moduleDetail, resources] = await Promise.all([
      service.getModuleDetail(moduleId),
      resourceService.listResources(moduleId),
    ]);
    const [lessonResult, moduleQuizzes, moduleMockTestResult] = await Promise.all([
      adminCmsService.listLessons({ moduleId, pageSize: 1000 }),
      quizRepository.findForAdmin({ moduleId }),
      adminCmsService.listMockTests({ moduleId, pageSize: 1000 }),
    ]);
    if (!lessonResult.success) throw new Error("Unable to load module lessons.");
    if (!moduleMockTestResult.success) throw new Error("Unable to load module mock tests.");
    lessons = lessonResult.data.items;
    quizzes = moduleQuizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      attemptCount: quiz._count.attempts,
      questionBankTitles: quiz.questionBanks.map((bank) => bank.title),
    }));
    const questionBankIds = [...new Set(moduleQuizzes.flatMap((quiz) => quiz.questionBanks.map((bank) => bank.id)))];
    const bankRows = await Promise.all(questionBankIds.map((id) => questionBankRepository.findByIdWithCount(id)));
    questionBanks = bankRows.flatMap((bank) => bank ? [{
      id: bank.id,
      title: bank.title,
      status: bank.status,
      questionCount: bank.questionCount,
    }] : []);
    mockTests = moduleMockTestResult.data.items.map((mockTest) => ({
      id: mockTest.id,
      title: mockTest.title,
      status: mockTest.status,
      durationMinutes: mockTest.durationMinutes,
      questionCount: mockTest.questionCount,
    }));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof AppError && error.status < 500) {
      loadError = error.message;
    } else {
      console.error("Failed to load Admin module detail", { moduleId, error });
      loadError = "The module could not be loaded because of a server or data error. Try again, or contact support if the problem continues.";
    }
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <h1 className="text-lg font-semibold">Unable to load module</h1>
        <p className="mt-2 text-sm">{loadError}</p>
        <Link href={`/admin/modules/${moduleId}`} className="mt-4 inline-block text-sm font-semibold underline">Try again</Link>
      </div>
    );
  }

  if (!moduleDetail || !resources || !lessons || !quizzes || !questionBanks || !mockTests) notFound();

  return (
    <div className="space-y-6">
        <PageHeader title={moduleDetail.title} description={moduleDetail.description || "Module content and management workspace."} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Module metadata</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Exam type</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.examType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Resources</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.resources.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last updated</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{new Date(moduleDetail.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Slug</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Module number</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.moduleNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Difficulty</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{moduleDetail.difficulty}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-slate-600">{moduleDetail.description || "No description provided."}</p>
          </div>

          <ModuleDetailActions module={moduleDetail} canPublish={hasPermission(session.user.role, "publishContent")} />
        </div>

        <ModuleDetailWorkspace
          module={moduleDetail}
          lessons={lessons}
          resources={resources}
          quizzes={quizzes}
          questionBanks={questionBanks}
          mockTests={mockTests}
          basePath={session.user.role === 'CONTENT_EDITOR' ? '/content-editor' : '/admin'}
        />
      </div>
  );
}
