import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default async function InstructorLoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.user.role && currentUser.user.role !== "INSTRUCTOR") {
    redirect("/unauthorized?reason=role-mismatch");
  }

  if (currentUser?.user.role === "INSTRUCTOR") {
    redirect("/instructor/dashboard");
  }

  return (
    <AuthLayout
      title="Instructor sign in"
      subtitle="Access your teaching workspace, course context, and AI tutor tools."
      theme="admin"
    >
      <AuthForm mode="signin" role="instructor" />
    </AuthLayout>
  );
}
