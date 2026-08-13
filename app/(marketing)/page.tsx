import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import Navbar from "@/components/layout/Navbar";
import CtaSection from "@/components/landing/CtaSection";
import ExperienceSection from "@/components/landing/ExperienceSection";
import FaqSection from "@/components/landing/FaqSection";
import FooterSection from "@/components/landing/FooterSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ModulesSection from "@/components/landing/ModulesSection";
import PricingSection from "@/components/landing/PricingSection";
import StatsSection from "@/components/landing/StatsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import TrustSection from "@/components/landing/TrustSection";

const sections = [
  { id: "hero", Component: HeroSection },
  { id: "trust", Component: TrustSection },
  { id: "stats", Component: StatsSection },
  { id: "modules", Component: ModulesSection },
  { id: "experience", Component: ExperienceSection },
  { id: "how-it-works", Component: HowItWorksSection },
  { id: "testimonials", Component: TestimonialsSection },
  { id: "pricing", Component: PricingSection },
  { id: "faq", Component: FaqSection },
  { id: "cta", Component: CtaSection },
];

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (currentUser?.user.role === "STUDENT") {
    redirect("/student/dashboard");
  }

  if (currentUser?.user.role === "INSTRUCTOR") {
    redirect("/instructor/dashboard");
  }

  if (currentUser?.user.role === "CONTENT_EDITOR") {
    redirect("/content-editor/dashboard");
  }

  if (currentUser?.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (currentUser?.user.role === "SUPER_ADMIN") {
    redirect("/super-admin/dashboard");
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {sections.map(({ Component, id }) => (
          <Component key={id} />
        ))}
      </main>
      <FooterSection />
    </>
  );
}
