import { Calendar, ShoppingBag, Smartphone, Gift, Star } from "lucide-react";
import { PLATFORM } from "@/config/platform";
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";
import { formatGHS } from "@/lib/currency";

export const GHS = formatGHS;

// ---- Sample studios for the multi-tenant showcase (presentational only) ----
export interface DemoStudio {
  key: string;
  name: string;
  slug: string;
  accent: string; // raw HSL channels, e.g. "340 45% 55%"
  tags: string[];
  featured: { name: string; price: number; duration: string };
  gallery: string[];
}

export const STUDIOS: DemoStudio[] = [
  {
    key: "els",
    name: "El's Beauty Studio",
    slug: "elsbeautystudio",
    accent: "340 45% 55%",
    tags: ["Nails", "Lashes", "Braids", "Facials"],
    featured: { name: "Gel Extensions", price: 180, duration: "60 min" },
    gallery: [nails1, lashes1, nails2],
  },
  {
    key: "zara",
    name: "Nailed by Zara",
    slug: "nailedbyzara",
    accent: "286 34% 52%",
    tags: ["Acrylics", "Gel", "Nail art", "Pedicure"],
    featured: { name: "Full Set Acrylics", price: 160, duration: "75 min" },
    gallery: [nails2, nails1, lashes2],
  },
  {
    key: "ama",
    name: "Glow by Ama",
    slug: "glowbyama",
    accent: "18 58% 52%",
    tags: ["Facials", "Makeup", "Waxing", "Brows"],
    featured: { name: "Glow Facial", price: 220, duration: "50 min" },
    gallery: [lashes1, lashes2, nails1],
  },
];

export const FEATURES = [
  {
    icon: Calendar,
    title: "Bookings",
    text: "Let clients discover your services and book anytime — with availability, deposits and reminders built in.",
  },
  {
    icon: Smartphone,
    title: "Payments",
    text: "Accept Mobile Money and card payments, with money settling straight to your own account.",
  },
  {
    icon: ShoppingBag,
    title: "Products",
    text: "Sell products directly from your branded storefront, with cart, checkout and orders.",
  },
  {
    icon: Gift,
    title: "Loyalty",
    text: "Reward repeat clients with points and referrals — give them a reason to come back.",
  },
  {
    icon: Star,
    title: "Reviews",
    text: "Build trust with real customer experiences shown right on your storefront.",
  },
];

export const JOURNEY = [
  { n: "01", title: "Discover", text: "A client discovers your studio online — on your own branded link." },
  { n: "02", title: "Book", text: "They choose a service, date and time in a few taps." },
  { n: "03", title: "Pay", text: "They pay securely with Mobile Money or card." },
  { n: "04", title: "Return", text: "They leave a review and earn loyalty points." },
  { n: "05", title: "Repeat", text: "They come back — and become a loyal, paying regular." },
];

export const FAQ = [
  {
    q: "Do I need any technical skills?",
    a: "None. You add your services, colours and logo from a simple dashboard, and your booking site is ready the same day.",
  },
  {
    q: "How do I get paid?",
    a: "Connect your Mobile Money or bank account and customer payments settle straight to you. Take deposits or full payment at booking.",
  },
  {
    q: "What's the difference between Standard and Premium?",
    a: "Both include bookings, payments, loyalty and your branded site. Premium adds an online shop to sell products and add them during booking.",
  },
  {
    q: "Can I cancel or change my plan?",
    a: "Yes — upgrade, downgrade or switch between monthly and yearly anytime from your dashboard. Cancel whenever you like.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Point your own web address to your studio with a quick DNS verification.",
  },
];

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#for-studios", label: "For studios" },
];

// How a prospective studio gets in touch: WhatsApp when configured, else email.
export const isWhatsapp = Boolean(PLATFORM.whatsapp);
export const contactHref = isWhatsapp
  ? `https://wa.me/${PLATFORM.whatsapp}?text=${encodeURIComponent(
      `Hi ${PLATFORM.name}, I'd like to set up my studio.`,
    )}`
  : `mailto:${PLATFORM.email}?subject=${encodeURIComponent(
      `Setting up my studio on ${PLATFORM.name}`,
    )}`;
