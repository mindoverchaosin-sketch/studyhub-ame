import AuthForm from "@/components/auth/AuthForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your AeroPrep account"
      subtitle="Set up a premium learning environment designed for ambitious aircraft maintenance students."
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
