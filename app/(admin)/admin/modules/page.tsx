import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import ModuleTable from "@/components/admin/modules/ModuleTable";
import ModuleWizard from "@/components/admin/modules/ModuleWizard";
import { getModules } from "@/services/module.service";

export default async function ModulesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const modules = await getModules();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Module management"
          description="A premium admin workspace for designing, organizing, and preparing modules for future publishing workflows."
        />

        <ModuleWizard />
        <ModuleTable modules={modules} />
      </div>
    </AdminLayout>
  );
}
