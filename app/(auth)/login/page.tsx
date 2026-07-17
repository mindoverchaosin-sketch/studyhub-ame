import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back to AeroPrep"
      subtitle="Pick up where you left off with focused study blocks, revision notes, and exam prep guidance."
    >
      <AuthForm mode="signin" />
    </AuthLayout>
  );
}
