import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default async function ContentEditorLoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.user.role && currentUser.user.role !== "CONTENT_EDITOR") {
    redirect("/unauthorized?reason=role-mismatch");
  }

  if (currentUser?.user.role === "CONTENT_EDITOR") {
    redirect("/content-editor/dashboard");
  }

  return (
    <AuthLayout
      title="Content editor sign in"
      subtitle="Manage courses, modules, questions, and revision content for the platform."
      theme="admin"
    >
      <AuthForm mode="signin" role="content-editor" />
    </AuthLayout>
  );
}
