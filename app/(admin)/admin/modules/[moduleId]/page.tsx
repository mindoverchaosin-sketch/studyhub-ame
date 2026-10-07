import { redirect } from "next/navigation";
import { requirePermission } from "@/auth";
import type { AuthSession } from "@/lib/auth/index";
import { hasPermission } from "@/server/services/authorization.service";
import ModuleDetailPageContent from "@/components/admin/modules/ModuleDetailPageContent";

export default async function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  let session: AuthSession;
  try {
    session = await requirePermission("manageModules");
  } catch {
    redirect("/login");
  }

  const { moduleId } = await params;
  if (session.user.role === "CONTENT_EDITOR") {
    redirect(`/content-editor/modules/${moduleId}`);
  }

  return ModuleDetailPageContent({
    moduleId,
    basePath: "/admin",
    canPublish: hasPermission(session.user.role, "publishContent"),
  });
}
