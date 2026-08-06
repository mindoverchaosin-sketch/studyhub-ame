"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { FiChrome, FiEye, FiEyeOff } from "react-icons/fi";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { registerWithCredentials } from "@/app/(auth)/register/actions";

type AuthFormProps = {
  mode: "signin" | "signup";
};

type FormValues = {
  name: string;
  email: string;
  password: string;
  rememberMe: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const signInSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export default function AuthForm({ mode }: AuthFormProps) {
  const [values, setValues] = useState<FormValues>({ name: "", email: "", password: "", rememberMe: true });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const getFriendlyAuthError = (error?: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'SessionRequired':
        return 'Please sign in to continue.';
      case 'AccessDenied':
        return 'Unable to sign in. Please try again.';
      default:
        return undefined;
    }
  };

  const authPageMessage = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const errorCode = searchParams.get('error') ?? undefined;
    return getFriendlyAuthError(errorCode) ?? null;
  }, []);

  const handleFieldChange = (field: keyof Omit<FormValues, "rememberMe">, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const router = useRouter();
  const isSignUp = mode === "signup";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schema = isSignUp ? signUpSchema : signInSchema;
    const result = schema.safeParse(values);

    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: nextErrors.name?.[0],
        email: nextErrors.email?.[0],
        password: nextErrors.password?.[0],
      });
      setIsSubmitting(false);
      setSubmitted(false);
      setFormMessage(null);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitted(false);
    setFormMessage(null);

    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    if (isSignUp) {
      formData.set("name", values.name);
    }

    if (isSignUp) {
      const actionResult = await registerWithCredentials(formData);

      if (actionResult && actionResult.success === false) {
        setFormMessage(actionResult.error ?? "Authentication failed.");
        setIsSubmitting(false);
        setSubmitted(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (!signInResult?.ok) {
        const signInError = signInResult?.error as string | undefined;
        const errorMessage = getFriendlyAuthError(signInError);
        setFormMessage(errorMessage ?? "Registration succeeded, but sign-in failed.");
        setIsSubmitting(false);
        setSubmitted(false);
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;
      const destination = role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";

      router.push(destination);
      return;
    }

    const signInResult = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (!signInResult?.ok) {
      setIsSubmitting(false);
      setSubmitted(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    const destination = role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";

    router.push(destination);
  };

  return (
    <Card variant="elevated" className="border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{isSignUp ? "Create account" : "Welcome back"}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {isSignUp ? "Start your AeroPrep journey" : "Resume your preparation"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {isSignUp
            ? "Set up a premium study routine with structured lessons, revision plans, and exam-ready insights."
            : "Access your notes, progress, and lesson plans in a calm, focused workspace."}
        </p>
      </div>

      <div className="mb-6">
        <Button type="button" variant="secondary" fullWidth className="justify-center gap-2">
          <FiChrome className="h-4 w-4" />
          Continue with Google
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isSignUp ? (
          <Input
            id="name"
            label="Full name"
            name="name"
            value={values.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            placeholder="Alex Morgan"
            autoComplete="name"
            required={isSignUp}
            error={errors.name}
          />
        ) : null}

        <Input
          id="email"
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => handleFieldChange("email", event.target.value)}
          placeholder="student@aeroprep.com"
          autoComplete="email"
          required
          error={errors.email}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => handleFieldChange("password", event.target.value)}
              className={[
                "w-full border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white",
                errors.password ? "border-rose-300" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ borderRadius: "1rem" }}
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.rememberMe}
              onChange={() => setValues((current) => ({ ...current, rememberMe: !current.rememberMe }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
          {/* Password reset is a deferred feature; do not implement in this sprint. */}
          <span className="text-sm font-medium text-blue-600 opacity-60" aria-disabled="true" title="Forgot password is unavailable until a future release">Forgot password?</span>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? (isSignUp ? "Creating account..." : "Signing you in...") : isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      {submitted ? (
        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {isSignUp ? "Account setup looks good. Your study space is ready." : "You are ready to continue your learning sprint."}
        </p>
      ) : null}

      {(authPageMessage || formMessage) ? (
        <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formMessage ?? authPageMessage}
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-600">
        {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={isSignUp ? "/login" : "/register"} className="font-semibold text-blue-600 transition hover:text-blue-700">
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </Card>
  );
}
