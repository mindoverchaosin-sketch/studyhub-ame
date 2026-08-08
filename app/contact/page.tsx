import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import FooterSection from "@/components/landing/FooterSection";

export const metadata: Metadata = {
  title: "Contact | AeroPrep",
  description: "Contact AeroPrep support for questions about subscriptions, courses, and premium exam preparation.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <main id="main-content" className="flex-1 bg-white text-slate-950">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-lg shadow-slate-900/5 sm:p-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
                  Get in touch
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Contact AeroPrep support</h1>
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    Have a question about subscriptions, courses, or exam preparation? Send us a message or use the support contacts below.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
                <h2 className="text-2xl font-semibold text-slate-950">Contact form</h2>
                <p className="mt-3 text-slate-600 leading-7">
                  Fill out the form below and our support team will get back to you shortly. This form is currently non-functional and intended for future integration.
                </p>
                <form className="mt-8 space-y-6" action="#" method="post">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Name
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Email
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-slate-700">
                    Subject
                    <input
                      type="text"
                      name="subject"
                      placeholder="How can we help?"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Message
                    <textarea
                      name="message"
                      rows={6}
                      placeholder="Tell us more about your request"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Send message
                  </button>
                </form>
              </section>

              <aside className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm shadow-slate-900/5">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Support information</h2>
                  <p className="mt-3 text-slate-600 leading-7">
                    We're here to help with account questions, subscription support, and exam prep guidance.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-950">Email</p>
                    <p className="mt-1 text-slate-600">support@aeroprep.com</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Phone</p>
                    <p className="mt-1 text-slate-600">+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Office hours</p>
                    <p className="mt-1 text-slate-600">Monday – Friday, 9:00 AM – 6:00 PM IST</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-900 p-5 text-slate-100">
                  <p className="font-semibold">Need help right away?</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    If you are experiencing issues with your account or subscription, please use the email address above and include your order ID or registered email.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </Container>
      </main>
      <FooterSection />
    </>
  );
}
