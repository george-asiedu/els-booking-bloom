// What a studio's landing page says when the owner hasn't written their own
// wording for a slot. Shared by the storefront (Index.tsx) and the editor
// (Appearance → Landing page), which shows these as placeholders so an owner
// knows exactly what a blank field will display.
//
// Written to sound like a person at the front desk: plain, specific, no
// superlatives. Works for any kind of studio (hair, nails, lashes, makeup).
export const landingDefaults = (studioName: string) => ({
  heroEyebrow: studioName,
  heroHeadline: "Book your next appointment in under a minute.",
  heroSubtext:
    "See our prices and free times, pick the slot that suits you, and we'll confirm it by email.",
  aboutHeading: "Every appointment starts with a chat.",
  aboutText: `At ${studioName} we start by talking through what you'd like, then take the time to get it right. Ask us anything before you book.`,
  featuresHeading: "Why clients keep coming back",
  servicesHeading: "What we do",
  galleryHeading: "Recent work",
  reviewsHeading: "What clients say",
  loyaltyHeading: "Earn points every time you visit",
  loyaltyText:
    "Points are added after each appointment. Use them for money off a later booking.",
  ctaHeading: "Find a time that works for you.",
  contactHeading: "Find us",
});

export type LandingCopy = ReturnType<typeof landingDefaults>;

// Character limits, matching the server's (ELS-Server studioService).
export const LANDING_LIMITS: Record<keyof LandingCopy, number> = {
  heroEyebrow: 40,
  heroHeadline: 100,
  heroSubtext: 300,
  aboutHeading: 120,
  aboutText: 500,
  featuresHeading: 120,
  servicesHeading: 120,
  galleryHeading: 120,
  reviewsHeading: 120,
  loyaltyHeading: 120,
  loyaltyText: 300,
  ctaHeading: 120,
  contactHeading: 120,
};
