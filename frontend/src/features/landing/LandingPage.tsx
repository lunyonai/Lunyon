import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import HeroSection from "./HeroSection";
import ProblemSection from "./ProblemSection";
import HowItWorksSection from "./HowItWorksSection";
import ConnectedWorkforceSection from "./ConnectedWorkforceSection";
import FeaturesSection from "./FeaturesSection";
import UseCasesSection from "./UseCasesSection";
import TimeCalculatorSection from "./TimeCalculatorSection";
import PricingSection from "./PricingSection";
import CTASection from "./CTASection";
import LandingFooter from "./LandingFooter";
import NeuralBackground from "./NeuralBackground";

export default function LandingPage() {
  const { hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const scrollToHash = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
    };
    scrollToHash();
    const timeout = window.setTimeout(scrollToHash, 50);
    return () => window.clearTimeout(timeout);
  }, [hash]);

  return (
    <div className="relative min-h-screen text-[var(--lunyo-text)]">
      <NeuralBackground preset="landing" />

      <div className="relative z-10">
        <TopNav />
        <main className="overflow-x-hidden">
          <HeroSection />
          <ProblemSection />
          <HowItWorksSection />
          <ConnectedWorkforceSection />
          <FeaturesSection />
          <UseCasesSection />
          <TimeCalculatorSection />
          <PricingSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
