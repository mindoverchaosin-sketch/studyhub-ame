import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LearningPathsSection from "@/components/landing/LearningPathsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <LearningPathsSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <FooterSection />
    </>
  );
}
