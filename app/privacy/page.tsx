import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import AeroPrepLogo from "@/components/brand/AeroPrepLogo";
import FooterSection from "@/components/landing/FooterSection";

export const metadata: Metadata = {
  title: "Privacy Policy | AeroPrep",
  description:
    "AeroPrep privacy policy describing how we collect, use, and protect student data, Razorpay payments, and AdSense usage for free learners.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <main id="main-content" className="flex-1 bg-slate-950 text-slate-50">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20 sm:p-12">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                <AeroPrepLogo variant="icon" invert className="text-white" />
                Privacy Policy
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Your privacy matters.</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                  AeroPrep protects your personal information and explains how we use data for learning services, secure Razorpay payments, and AdSense support on the free plan.
                </p>
              </div>
            </div>

            <section className="mt-12 space-y-10">
              <article>
                <h2 className="text-2xl font-semibold text-white">Data collection</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  We collect information you provide when you register, enroll in courses, or interact with our platform. This includes your name, email, authentication details, and usage information necessary to deliver personalized study pathways.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  We may also collect analytics data to improve study content, exam performance tracking, and product stability. This data is stored securely and used in accordance with our privacy principles.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Razorpay payments</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  When you purchase a premium subscription, payment processing is handled by Razorpay. We transmit only the information required to complete your purchase, such as your order details, billing amount, and contact email.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  AeroPrep does not store full payment card details. Razorpay manages the secure processing of your financial transactions and complies with applicable payment security standards.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Google AdSense usage</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  To support our free tier, AeroPrep may display Google AdSense ads to users on the free plan. These ads help us keep study content available at no cost while maintaining service quality.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  Paid subscribers benefit from an ad-free experience. Ad personalization is managed by Google and is subject to Google’s own privacy practices.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Security and retention</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  We protect your information using industry-standard encryption, access controls, and monitoring. Personal data is retained only as long as necessary to provide services and comply with legal obligations.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  If you have questions about your privacy or want to request data access, please contact our support team using the contact page below.
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
