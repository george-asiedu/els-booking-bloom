// The platform's own marketing page (the apex domain). Each section lives in
// src/pages/landing/ and owns whatever state it needs, so hovering a demo
// studio or scrolling past the nav threshold re-renders that section only.
import { NavSection } from "./landing/LandingNav";
import { useHideSplashWhen } from "@/lib/splash";
import { HeroSection, FeaturesSection, StorefrontsSection, JourneySection } from "./landing/ShowcaseSections";
import { BookingSection, BusinessSection, LoyaltyReviewsSection, HowSection } from "./landing/ProductSections";
import { PricingSection, FaqSection, FinalCtaSection, FooterSection } from "./landing/ClosingSections";

const PlatformLanding = () => {
  // Everything above the fold is static, so the page is ready once it renders.
  useHideSplashWhen(true);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavSection />
      <HeroSection />
      <FeaturesSection />
      <StorefrontsSection />
      <JourneySection />
      <BookingSection />
      <BusinessSection />
      <LoyaltyReviewsSection />
      <HowSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <FooterSection />
    </div>
  );
};

export default PlatformLanding;
