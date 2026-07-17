import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";

const plans: Array<{
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}> = [
  { name: "Starter", price: "$19", description: "A focused starter plan for students building their routine.", features: ["Core modules", "Revision notes", "Practice quizzes"] },
  { name: "Pro", price: "$39", description: "Everything serious learners need for deeper exam prep.", features: ["All modules", "Mock exams", "Progress insights"], featured: true },
];

export default function PricingSection() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <Badge variant="accent">Pricing preview</Badge>
          <Heading as="h2" size="md" className="mt-4">
            Pick the plan that fits your prep rhythm.
          </Heading>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.name} variant={plan.featured ? "elevated" : "default"} className={plan.featured ? "border-blue-200 bg-gradient-to-br from-blue-50/80 to-white shadow-[0_24px_80px_-34px_rgba(37,99,235,0.35)]" : "shadow-[0_16px_60px_-34px_rgba(15,23,42,0.2)]"}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{plan.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
                </div>
                {plan.featured ? <Badge variant="accent">Most popular</Badge> : null}
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">{plan.price}</span>
                <span className="pb-1 text-sm text-slate-600">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant={plan.featured ? "primary" : "secondary"} className="mt-6" fullWidth>
                Choose {plan.name}
              </Button>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
