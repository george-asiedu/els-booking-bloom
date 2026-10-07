// Platform-level details (the "Zuri" platform, distinct from any individual
// studio): its name, contact details and plan prices.
//
// The super admin edits these in the platform console (Settings, Billing).
// main.tsx calls loadPlatformConfig() before the first render, which fills
// PLATFORM and PLANS in place, so every page reads live values without
// fetching anything itself. The values below are only the fallback for a
// field the super admin hasn't set, or when the API can't be reached.
// Only the API URL and root domain still come from the build environment.

const env = import.meta.env as Record<string, string | undefined>;

export const SITE_DEFAULTS = {
  name: "Zuri Studios",
  // Short line above the hero headline: who the product is for. Deliberately
  // not a list of trades, so no beauty business reads itself as left out.
  heroBadge: "Made for beauty businesses across Ghana",
  // Digits with country code: what a wa.me link needs.
  whatsapp: "233203631199",
  email: "customersupport@zuristudios.com",
  // A live studio to showcase from the landing page.
  demoSlug: "els",
};

export const PLATFORM = {
  ...SITE_DEFAULTS,
  description:
    "Zuri gives beauty studios their own booking website: clients book a free time, pay by Mobile Money or card, and earn loyalty points.",
  // Platform root domain (studios live at <slug>.<rootDomain> in production).
  // Normalised to a bare host: strips any scheme, path, port and stray dots so a
  // misconfigured value (e.g. an API URL) can't produce a broken storefront URL.
  rootDomain: normalizeDomain(env.VITE_ROOT_DOMAIN),
};

function normalizeDomain(v: string | undefined): string {
  return (v || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "") // drop scheme
    .replace(/[/?#].*$/, "") // drop path/query/hash
    .replace(/:\d+$/, "") // drop port
    .replace(/^\.+|\.+$/g, ""); // drop leading/trailing dots
}

// URL to a studio's storefront: its real subdomain in production, or the local
// /s/<slug> preview in dev. Opened in a new tab so the landing page is kept.
export const studioUrl = (slug: string) =>
  PLATFORM.rootDomain
    ? `${window.location.protocol}//${slug}.${PLATFORM.rootDomain}`
    : `/s/${slug}`;

// A yearly plan is priced at 12 months minus this many. The server derives
// yearly prices the same way (YEARLY_MONTHS_CHARGED in ELS-Server
// platformService), so the "save 2 months" label is always true.
export const YEARLY_FREE_MONTHS = 2;

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
  "Your own website and web address",
  "Accept booking payments (Mobile Money & card)",
  "Loyalty points & referrals",
  "Reviews & photo/video gallery",
  "A banner for offers and promotions",
];

export const PLANS: PlanDef[] = [
  {
    id: "STANDARD",
    name: "Standard",
    blurb: "Everything you need to take bookings and get paid.",
    monthly: 150,
    yearly: 1500,
    features: STANDARD_FEATURES,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    blurb: "Standard, plus an online shop to sell your products.",
    monthly: 350,
    yearly: 3500,
    featured: true,
    features: [
      "Everything in Standard",
      "An online shop with cart and checkout",
      "Sell products during booking",
      "Payments settled straight to your account",
    ],
  },
];

export const planPrice = (plan: PlanDef, cadence: "MONTHLY" | "YEARLY") =>
  cadence === "YEARLY" ? plan.yearly : plan.monthly;

// ---- Live values from the API ---------------------------------------------

// GET /platform/public-config. Site fields are null when the super admin
// hasn't set them; prices are always the effective (charged) prices.
export interface PublicPlatformConfig {
  site: {
    siteName: string | null;
    siteHeroBadge: string | null;
    supportEmail: string | null;
    supportWhatsapp: string | null;
    demoStudioSlug: string | null;
  };
  billing: {
    priceStandardMonthly: number;
    priceStandardYearly: number;
    pricePremiumMonthly: number;
    pricePremiumYearly: number;
  };
}

const CACHE_KEY = "zuri_platform_config";

const applyPlatformConfig = (cfg: PublicPlatformConfig) => {
  PLATFORM.name = cfg.site.siteName || SITE_DEFAULTS.name;
  PLATFORM.heroBadge = cfg.site.siteHeroBadge || SITE_DEFAULTS.heroBadge;
  PLATFORM.email = cfg.site.supportEmail || SITE_DEFAULTS.email;
  PLATFORM.whatsapp = cfg.site.supportWhatsapp || SITE_DEFAULTS.whatsapp;
  PLATFORM.demoSlug = cfg.site.demoStudioSlug || SITE_DEFAULTS.demoSlug;
  for (const plan of PLANS) {
    const b = cfg.billing;
    plan.monthly = plan.id === "PREMIUM" ? b.pricePremiumMonthly : b.priceStandardMonthly;
    plan.yearly = plan.id === "PREMIUM" ? b.pricePremiumYearly : b.priceStandardYearly;
  }
};

/**
 * Fill PLATFORM and PLANS before the app renders. The last values seen are
 * applied straight away (so a repeat visit is instant), then fresh ones are
 * fetched; a slow or failed request leaves whatever is already applied rather
 * than holding the page up for more than `timeoutMs`.
 */
export const loadPlatformConfig = async (
  fetchConfig: () => Promise<PublicPlatformConfig>,
  timeoutMs = 2500,
): Promise<void> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) applyPlatformConfig(JSON.parse(cached) as PublicPlatformConfig);
  } catch {
    // Unreadable cache: carry on with the defaults.
  }
  try {
    const fresh = await Promise.race([
      fetchConfig(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    applyPlatformConfig(fresh);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    } catch {
      // Storage full or blocked: next visit just fetches again.
    }
  } catch {
    // Offline or slow API: keep the cached or default values.
  }
};
