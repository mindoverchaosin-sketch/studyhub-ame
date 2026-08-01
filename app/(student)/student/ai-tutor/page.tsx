import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import AIChatPanel from "@/components/ai/AIChatPanel";

export default async function AITutorPage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AIChatPanel />
    </div>
  );
}
