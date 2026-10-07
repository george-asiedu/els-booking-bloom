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
    text: "Clients only see times you're actually free, pay a deposit if you ask for one, and get a reminder the day before.",
  },
  {
    icon: Smartphone,
    title: "Payments",
    text: "Clients pay by Mobile Money or card. The money goes straight to your own account.",
  },
  {
    icon: ShoppingBag,
    title: "Shop",
    text: "Sell the products you use. Clients can add them to a booking and collect them at their appointment.",
  },
  {
    icon: Gift,
    title: "Loyalty points",
    text: "Clients earn points each visit and spend them on a later booking. Referrals earn points too.",
  },
  {
    icon: Star,
    title: "Reviews",
    text: "Clients review you after their appointment. You choose which reviews appear on your page.",
  },
];

export const JOURNEY = [
  { n: "1", title: "They find you", text: "From your link on Instagram, WhatsApp or Google, they land on your own page." },
  { n: "2", title: "They book", text: "They choose a service and a free time. Nothing to download, no account needed to look." },
  { n: "3", title: "They pay", text: "A deposit or the full amount, by Mobile Money or card, and get a receipt by email." },
  { n: "4", title: "They come back", text: "A reminder before the visit, points after it, and a quick review if they're happy." },
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
    a: "Yes. Upgrade, downgrade or switch between monthly and yearly from your dashboard at any time, or cancel.",
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
