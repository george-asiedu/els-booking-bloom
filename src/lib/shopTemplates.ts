// Shop website designs by what the shop sells (lib/shopCategories). The
// layout is the same for every shop (shop-website-design); what changes is
// the wording, the trust badges and the heading style, so a perfume shop
// reads differently from a food shop. Owners' own wording always wins.

import type { ShopCategoryId } from "@/lib/shopCategories";

export interface ShopTemplate {
  eyebrow: string;
  headline: string;
  subtext: string;
  cta: string;
  // Serif headings for fashion/beauty, clean sans for tech/food.
  headingStyle: "serif" | "sans";
  badges: [string, string, string];
  newTitle: string;
  bestTitle: string;
  joinTitle: string;
  joinText: string;
}

const base: ShopTemplate = {
  eyebrow: "New in",
  headline: "Things you'll love, delivered to you.",
  subtext: "Browse what's new, pay by Mobile Money or card, and get it delivered or pick it up.",
  cta: "Shop now",
  headingStyle: "sans",
  badges: ["Secure Mobile Money & card", "Delivery or pickup", "Real people on WhatsApp"],
  newTitle: "New arrivals",
  bestTitle: "Customer favourites",
  joinTitle: "Join and earn points",
  joinText: "Create an account to earn points on every order and hear about offers first.",
};

const T = (o: Partial<ShopTemplate>): ShopTemplate => ({ ...base, ...o });

export const SHOP_TEMPLATES: Record<ShopCategoryId, ShopTemplate> = {
  clothing: T({
    eyebrow: "The new collection",
    headline: "Pieces you'll wear on repeat.",
    subtext: "Everyday staples and statement looks, picked for how you live. New styles every week.",
    cta: "Shop the edit",
    headingStyle: "serif",
    newTitle: "This week's edit",
    badges: ["Easy size exchanges", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  shoes: T({
    eyebrow: "Just dropped",
    headline: "Step out in something new.",
    subtext: "Sneakers, heels, sandals and more, in sizes that fit. Find your next favourite pair.",
    cta: "Shop shoes",
    badges: ["Size exchanges", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  "bags-accessories": T({
    eyebrow: "The accessories edit",
    headline: "The finishing touch.",
    subtext: "Bags, belts, sunglasses and more to complete every look.",
    cta: "Shop accessories",
    headingStyle: "serif",
  }),
  jewellery: T({
    eyebrow: "Fine pieces",
    headline: "Made to be noticed.",
    subtext: "Rings, chains, earrings and watches, for every day and every occasion.",
    cta: "Shop jewellery",
    headingStyle: "serif",
    badges: ["Gift-ready packaging", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  beauty: T({
    eyebrow: "Skincare & beauty",
    headline: "Glow naturally. Care deeply.",
    subtext: "Skincare, body care and makeup, chosen for real skin and Ghana's climate.",
    cta: "Discover more",
    headingStyle: "serif",
    newTitle: "Our best-selling skincare",
    bestTitle: "Customer favourites",
    badges: ["Gentle on skin", "Authentic products", "Pay by MoMo or card"],
  }),
  hair: T({
    eyebrow: "Hair & wigs",
    headline: "Your hair, your way.",
    subtext: "Wigs, bundles, braiding hair and hair care, ready to wear and easy to style.",
    cta: "Shop hair",
    headingStyle: "serif",
    badges: ["Quality hair", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  perfume: T({
    eyebrow: "Fragrance",
    headline: "Find a scent that's yours.",
    subtext: "Perfumes, body mists and oils, for him and for her. Original and long-lasting.",
    cta: "Explore scents",
    headingStyle: "serif",
    newTitle: "New fragrances",
    badges: ["100% original", "Gift-ready", "Pay by MoMo or card"],
  }),
  food: T({
    eyebrow: "Fresh every day",
    headline: "Good food, delivered.",
    subtext: "Order your favourites and fresh groceries online. Pay by MoMo and we'll bring it to you.",
    cta: "Order now",
    newTitle: "Fresh today",
    bestTitle: "Most ordered",
    badges: ["Fresh daily", "Fast delivery", "Pay by MoMo or card"],
    joinTitle: "Order again, earn points",
  }),
  drinks: T({
    eyebrow: "Drinks",
    headline: "Something to sip on.",
    subtext: "Juices, smoothies, soft drinks and more, chilled and delivered.",
    cta: "Order drinks",
    newTitle: "New drinks",
    bestTitle: "Most ordered",
    badges: ["Chilled and fresh", "Fast delivery", "Pay by MoMo or card"],
  }),
  bakery: T({
    eyebrow: "Freshly baked",
    headline: "Cakes for every celebration.",
    subtext: "Birthday cakes, pastries and treats, baked to order. Tell us the date and we'll do the rest.",
    cta: "Order a cake",
    headingStyle: "serif",
    newTitle: "Freshly baked",
    bestTitle: "Customer favourites",
    badges: ["Baked to order", "Delivery on the day", "Pay by MoMo or card"],
  }),
  electronics: T({
    eyebrow: "Tech & gadgets",
    headline: "The latest tech, at fair prices.",
    subtext: "Headphones, speakers, chargers and gadgets. Genuine products with warranty.",
    cta: "Shop gadgets",
    newTitle: "Just in",
    badges: ["Genuine products", "Warranty included", "Pay by MoMo or card"],
  }),
  phones: T({
    eyebrow: "Phones & accessories",
    headline: "Stay connected in style.",
    subtext: "Phones, cases, chargers and accessories. Genuine products, delivered fast.",
    cta: "Shop phones",
    newTitle: "Just in",
    badges: ["Genuine products", "Warranty included", "Pay by MoMo or card"],
  }),
  home: T({
    eyebrow: "Home & living",
    headline: "Make home feel like you.",
    subtext: "Decor, kitchenware and everyday essentials for every room.",
    cta: "Shop home",
    headingStyle: "serif",
  }),
  kids: T({
    eyebrow: "Kids & baby",
    headline: "Little things for little ones.",
    subtext: "Clothes, toys and baby essentials, safe, comfortable and fun.",
    cta: "Shop kids",
    badges: ["Safe for little ones", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  health: T({
    eyebrow: "Health & wellness",
    headline: "Feel good, inside and out.",
    subtext: "Supplements, natural remedies and wellness essentials you can trust.",
    cta: "Shop wellness",
    badges: ["Trusted brands", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  sports: T({
    eyebrow: "Sports & fitness",
    headline: "Gear up and go.",
    subtext: "Activewear, equipment and accessories for training, matches and everyday moves.",
    cta: "Shop gear",
  }),
  books: T({
    eyebrow: "Books & stationery",
    headline: "Something good to read.",
    subtext: "Books, notebooks and supplies for school, work and leisure.",
    cta: "Browse books",
    headingStyle: "serif",
  }),
  art: T({
    eyebrow: "Art & crafts",
    headline: "Handmade, with care.",
    subtext: "Original art, crafts and handmade pieces you won't find anywhere else.",
    cta: "Explore the collection",
    headingStyle: "serif",
    badges: ["Handmade", "Delivery across Ghana", "Pay by MoMo or card"],
  }),
  other: base,
};

export const shopTemplateFor = (category: string | null | undefined): ShopTemplate =>
  (category && SHOP_TEMPLATES[category as ShopCategoryId]) || base;
