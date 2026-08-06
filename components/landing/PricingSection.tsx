import Link from "next/link";
import { FiCheck, FiX } from "react-icons/fi";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: { label: string; included: boolean }[];
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Start exploring the platform and build a study habit.",
    cta: "Get Started",
    href: "/modules",
    features: [
      { label: "5 AI tutor questions / day", included: true },
      { label: "2 mock exams / month", included: true },
      { label: "Core question bank access", included: true },
      { label: "Ad-supported experience", included: true },
      { label: "Advanced analytics", included: false },
      { label: "Unlimited access", included: false },
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per month",
    description: "For serious candidates preparing for their next exam.",
    cta: "Upgrade to Pro",
    href: "/pricing",
    featured: true,
    features: [
      { label: "100 AI tutor questions / day", included: true },
      { label: "Unlimited mock exams", included: true },
      { label: "Full question bank access", included: true },
      { label: "Ad-free experience", included: true },
      { label: "Performance analytics", included: true },
      { label: "Priority AI responses", included: false },
    ],
  },
  {
    name: "Premium",
    price: "₹899",
    period: "per month",
    description: "Everything unlocked, unlimited, with priority support.",
    cta: "Go Premium",
    href: "/pricing",
    features: [
      { label: "Unlimited AI tutor", included: true },
      { label: "Unlimited mock exams", included: true },
      { label: "Full question bank + updates", included: true },
      { label: "Ad-free experience", included: true },
      { label: "Advanced analytics + planner", included: true },
      { label: "Priority AI + support", included: true },
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Pricing
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple plans that grow with you
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Ads only on Free. Unlimited everything on Premium. Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "glass shadow-[0_40px_90px_-45px_rgba(8,15,35,0.6)] ring-2 ring-primary/50 lg:-my-2"
                  : "border border-border bg-card/60 backdrop-blur"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">/ {plan.period}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-3 text-sm">
                    {f.included ? (
                      <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    ) : (
                      <FiX className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/70 line-through"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                  plan.featured
                    ? "bg-primary text-primary-foreground shadow-[0_16px_35px_-18px_var(--primary)]"
                    : "border border-border bg-background/60 text-foreground hover:border-primary/40"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
