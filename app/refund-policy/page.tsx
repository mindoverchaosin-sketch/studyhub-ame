import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import FooterSection from "@/components/landing/FooterSection";

export const metadata: Metadata = {
  title: "Refund Policy | AeroPrep",
  description: "AeroPrep refund policy outlining subscription cancellation, refund eligibility, and processing timelines.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <>
      <main id="main-content" className="flex-1 bg-slate-950 text-slate-50">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20 sm:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Refund Policy
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Subscription cancellations and refunds</h1>
                <p className="mt-4 text-lg leading-8 text-slate-300">
                  Learn how AeroPrep handles cancellations, refund eligibility, and the timing of any returned payments.
                </p>
              </div>
            </div>

            <section className="mt-12 space-y-10">
              <article>
                <h2 className="text-2xl font-semibold text-white">Cancelling your subscription</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  You can cancel your subscription at any time through your billing dashboard. After cancellation, premium access remains active until the end of your current billing cycle.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  No further recurring payments will be charged after the cancellation date, but the current period is not refunded automatically unless otherwise stated.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Refund eligibility</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  Refunds are considered on a case-by-case basis. In general, AeroPrep does not offer automatic refunds for completed billing periods, but we may review requests for exceptional circumstances.
                </p>
                <p className="mt-4 text-slate-300 leading-8">
                  If you believe you are entitled to a refund, contact support with your order details and a description of the issue.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Processing refunds</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  Approved refunds are processed through Razorpay and may take several business days to appear on your original payment method, depending on your bank or card issuer.
                </p>
              </article>

              <article>
                <h2 className="text-2xl font-semibold text-white">Exceptions</h2>
                <p className="mt-4 text-slate-300 leading-8">
                  Refunds are not guaranteed for every cancellation. Refund eligibility may vary for promotional offers, trial periods, or third-party billing arrangements.
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
