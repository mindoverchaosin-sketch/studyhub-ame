import { redirect } from "next/navigation";
import { requirePermission } from "@/auth";
import type { AuthSession } from "@/lib/auth/index";
import ContentEditorLayout from "@/components/content-editor/ContentEditorLayout";
import ModuleDetailPageContent from "@/components/admin/modules/ModuleDetailPageContent";
import { hasPermission } from "@/server/services/authorization.service";

export default async function ContentEditorModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  let session: AuthSession;
  try {
    session = await requirePermission("manageModules");
  } catch {
    redirect("/unauthorized?reason=access-denied");
  }

  const { moduleId } = await params;
  const content = await ModuleDetailPageContent({
    moduleId,
    basePath: "/content-editor",
    canPublish: hasPermission(session.user.role, "publishContent"),
  });

  return (
    <ContentEditorLayout>
      {content}
    </ContentEditorLayout>
  );
}
