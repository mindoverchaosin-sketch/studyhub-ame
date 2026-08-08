import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import FooterSection from "@/components/landing/FooterSection";

export const metadata: Metadata = {
  title: "Terms of Service | AeroPrep",
  description: "AeroPrep terms of service covering subscriptions, acceptable use, and intellectual property.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <main id="main-content" className="flex-1 bg-white text-slate-950">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-lg shadow-slate-900/5 sm:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
                Terms of Service
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Terms and conditions for using AeroPrep</h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  These terms describe the relationship between you and AeroPrep, including how subscriptions work, what is permitted on the platform, and how intellectual property is protected.
                </p>
              </div>
            </div>

            <section className="mt-12 space-y-10">
              <article>
                <h2 className="text-2xl font-semibold text-slate-950">Subscriptions and billing</h2>
                <p className="mt-4 text-slate-600 leading-8">
                  AeroPrep offers subscription plans that renew automatically until cancelled. By subscribing, you agree to pay the recurring fee shown at checkout and authorize Razorpay to process your payment.
                </p>
                <p className="mt-4 text-slate-600 leading-8">
                  You may cancel your subscription at any time, but access to premium features will continue until the end of your current billing period unless otherwise specified.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-slate-950">Acceptable use</h2>
                <p className="mt-4 text-slate-600 leading-8">
                  You may use AeroPrep only for lawful and educational purposes. Do not engage in fraud, abuse, unauthorized access, or activities that harm other users or the platform.
                </p>
                <p className="mt-4 text-slate-600 leading-8">
                  Content generated or accessed through AeroPrep is intended for personal exam preparation. Redistribution, copying, or commercial use without permission is prohibited.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-slate-950">Intellectual property</h2>
                <p className="mt-4 text-slate-600 leading-8">
                  AeroPrep owns the platform, course materials, branding, and any original learning content. You may not reproduce, modify, or distribute this content without express permission.
                </p>
                <p className="mt-4 text-slate-600 leading-8">
                  All trademarks, logos, and service marks appearing on AeroPrep are the property of their respective owners and may not be used without authorization.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-slate-950">Account responsibility</h2>
                <p className="mt-4 text-slate-600 leading-8">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify support immediately if you suspect unauthorized access.
                </p>
              </article>
            </section>
          </div>
        </Container>
      </main>
      <FooterSection />
    </>
  );
}
