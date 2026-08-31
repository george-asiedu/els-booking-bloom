// Platform-level branding & marketing config (the "Zuri" platform, distinct from
// any individual studio). Values are overridable via Vite env at build time.

const env = import.meta.env as Record<string, string | undefined>;
const num = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
};

export const PLATFORM = {
  name: env.VITE_PLATFORM_NAME || "Zuri",
  tagline: env.VITE_PLATFORM_TAGLINE || "Beauty businesses, booked.",
  // Small badge shown above the hero headline.
  heroBadge:
    env.VITE_PLATFORM_HERO_BADGE || "Bookings · Shop · Payments — in one place",
  description:
    "Zuri is the all-in-one platform that lets beauty studios take bookings, sell products, accept Mobile-Money payments and reward loyal clients — from one branded site.",
  whatsapp: env.VITE_PLATFORM_WHATSAPP || "", // e.g. "233200000000"
  email: env.VITE_PLATFORM_EMAIL || "hello@zuri.app",
  // A live studio to showcase from the landing page.
  demoSlug: env.VITE_DEMO_STUDIO_SLUG || "els",
  // Platform root domain (studios live at <slug>.<rootDomain> in production).
  rootDomain: (env.VITE_ROOT_DOMAIN || "").trim().toLowerCase(),
};

// URL to a studio's storefront: its real subdomain in production, or the local
// /s/<slug> preview in dev. Opened in a new tab so the landing page is kept.
export const studioUrl = (slug: string) =>
  PLATFORM.rootDomain
    ? `${window.location.protocol}//${slug}.${PLATFORM.rootDomain}`
    : `/s/${slug}`;

export type PlanId = "STANDARD" | "PREMIUM";

export interface PlanDef {
  id: PlanId;
  name: string;
  blurb: string;
  monthly: number; // GHS
  yearly: number; // GHS
  featured?: boolean;
  features: string[];
}

const STANDARD_FEATURES = [
  "Online bookings & scheduling",
  "Your own branded site + subdomain",
  "Accept booking payments (Mobile Money & card)",
  "Loyalty points & referrals",
  "Reviews & photo/video gallery",
  "Promotions banner",
];

export const PLANS: PlanDef[] = [
  {
    id: "STANDARD",
    name: "Standard",
    blurb: "Everything you need to take bookings and get paid.",
    monthly: num(env.VITE_PRICE_STANDARD_MONTHLY, 150),
    yearly: num(env.VITE_PRICE_STANDARD_YEARLY, 1500),
    features: STANDARD_FEATURES,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    blurb: "Standard, plus an online shop to sell your products.",
    monthly: num(env.VITE_PRICE_PREMIUM_MONTHLY, 350),
    yearly: num(env.VITE_PRICE_PREMIUM_YEARLY, 3500),
    featured: true,
    features: [
      "Everything in Standard",
      "Online shop — products, cart & orders",
      "Sell products during booking",
      "Split settlement straight to your account",
    ],
  },
];

export const planPrice = (plan: PlanDef, cadence: "MONTHLY" | "YEARLY") =>
  cadence === "YEARLY" ? plan.yearly : plan.monthly;
