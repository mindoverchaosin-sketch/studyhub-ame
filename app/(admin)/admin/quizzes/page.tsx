import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function QuizzesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <div className="space-y-6">
        <PageHeader title="Quizzes" description="Placeholder content for quiz authoring and publishing." />
        <EmptyAdminState title="Quiz workspace" description="Quiz creation and moderation flows will be added here in a future milestone." />
      </div>
  );
}
