import { redirect } from "next/navigation"
import { requirePermission } from "@/auth"
import AdminLayout from "@/components/admin/AdminLayout"
import { listExamTemplates, activateExamTemplate } from "@/server/actions/exam.actions"

export default async function AdminExamsPage() {
  try {
    await requirePermission("manageModules")
  } catch {
    redirect("/login")
  }

  const templates = await listExamTemplates({ pageSize: 50 })

  return (
    <AdminLayout>
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Mock Exams</h1>
        <div>
          <button className="rounded bg-blue-600 text-white px-3 py-1">Create Template</button>
        </div>
        <div className="mt-4">
          {templates.length === 0 ? (
            <p>No templates found</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between border p-3 rounded">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.description}</div>
                  </div>
                  <div className="space-x-2">
                    <form action={async () => { await activateExamTemplate(t.id, !t.active); }}>
                      <button className="rounded border px-2 py-1">{t.active ? 'Deactivate' : 'Activate'}</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
