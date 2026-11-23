// The platform's own marketing page (the apex domain), in the
// studio-homepage-look layout. Each section lives in src/pages/landing/ and
// owns whatever state it needs.
import { NavSection } from "./landing/LandingNav";
import { useHideSplashWhen } from "@/lib/splash";
import { BackToTop } from "@/components/BackToTop";
import { StorefrontsSection } from "./landing/ShowcaseSections";
import { LoyaltyReviewsSection } from "./landing/ProductSections";
import { PlatformMetricsSection } from "./landing/TrustSections";
import { PricingSection, TrainingSection, FaqSection, FooterSection } from "./landing/ClosingSections";
import {
  PhotoHero,
  WhyRow,
  ApproachSplit,
  FeaturedCards,
  DifferenceBand,
  TypesCarousel,
  StepsBand,
  PhotoCta,
  TestimonialsSection,
} from "./landing/HomeLook";

const PlatformLanding = () => {
  // Everything above the fold is static, so the page is ready once it renders.
  useHideSplashWhen(true);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavSection />
      <PhotoHero />
      <WhyRow />
      <ApproachSplit />
      <FeaturedCards />
      <DifferenceBand />
      <TypesCarousel />
      <StorefrontsSection />
      <PlatformMetricsSection />
      <StepsBand />
      <LoyaltyReviewsSection />
      <TestimonialsSection />
      <PricingSection />
      <TrainingSection />
      <FaqSection />
      <PhotoCta />
      <FooterSection />
      <BackToTop className="bottom-6" />
    </div>
  );
};

export default PlatformLanding;
