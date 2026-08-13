import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default async function SuperAdminLoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.user.role && currentUser.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized?reason=role-mismatch");
  }

  if (currentUser?.user.role === "SUPER_ADMIN") {
    redirect("/super-admin/dashboard");
  }

  return (
    <AuthLayout
      title="Super admin sign in"
      subtitle="Secure access to the full AeroPrep platform and privileged governance controls."
      theme="admin"
    >
      <AuthForm mode="signin" role="super-admin" />
    </AuthLayout>
  );
}
