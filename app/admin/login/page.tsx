import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function AdminLoginPage() {
  return (
    <AuthLayout
      title="Admin sign in"
      subtitle="Secure access for AeroPrep administrators and operations teams."
      theme="admin"
    >
      <AuthForm mode="signin" role="admin" />
    </AuthLayout>
  );
}
