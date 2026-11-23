// Studio websites: the kind of studio sets the default wording, the template
// sets the layout. Mirrors STUDIO_TYPES / SITE_TEMPLATES in ELS-Server
// studioService. Everything here is a default: what an owner writes in
// Appearance always wins.

export type StudioType =
  | "hair"
  | "braids"
  | "nails"
  | "lashes-brows"
  | "makeup"
  | "skin-spa"
  | "barber"
  | "wellness"
  | "general";

export type SiteTemplate = "editorial" | "bold" | "minimal";

export interface ReasonItem {
  icon: "sparkles" | "shield" | "heart" | "clock" | "award" | "leaf" | "users" | "calendar";
  title: string;
  text: string;
}

interface TypeDefaults {
  label: string;
  headline: string;
  subtext: string;
  reasons: ReasonItem[];
  steps: { title: string; text: string }[];
}

const STEPS_DEFAULT = [
  { title: "Book online", text: "Pick a service and a free time. It takes about a minute." },
  { title: "We confirm", text: "You'll get a confirmation, and a reminder the day before." },
  { title: "Your visit", text: "We talk through what you'd like before we start." },
  { title: "Aftercare", text: "Leave with tips to keep it looking good, and rebook when you're ready." },
];

export const STUDIO_TYPES: Record<StudioType, TypeDefaults> = {
  hair: {
    label: "Hair salon",
    headline: "Hair that feels like you, on a good day.",
    subtext: "Cuts, colour, styling and treatments, done with care. See our prices and book a free time online.",
    reasons: [
      { icon: "award", title: "Skilled stylists", text: "Trained in cuts, colour and treatments for every hair type." },
      { icon: "leaf", title: "Gentle products", text: "Quality products that care for your hair and scalp." },
      { icon: "clock", title: "On time", text: "Your slot is held for you, so there's no waiting around." },
      { icon: "heart", title: "We listen first", text: "Every visit starts with a chat about what you want." },
    ],
    steps: STEPS_DEFAULT,
  },
  braids: {
    label: "Braids & protective styles",
    headline: "Neat braids that last, without the long wait.",
    subtext: "Knotless, box braids, cornrows and more. Pick a style, choose your length, and book your time.",
    reasons: [
      { icon: "sparkles", title: "Neat, even parts", text: "Clean partings and tidy ends, every time." },
      { icon: "heart", title: "Kind to your edges", text: "No pulling too tight. Your scalp comes first." },
      { icon: "clock", title: "A time that's yours", text: "Book ahead and walk straight into your chair." },
      { icon: "award", title: "Long-lasting", text: "Styles made to stay fresh for weeks." },
    ],
    steps: STEPS_DEFAULT,
  },
  nails: {
    label: "Nail studio",
    headline: "Nails you'll keep looking at.",
    subtext: "Gel, acrylics, extensions and nail art. See the price list and book a time that suits you.",
    reasons: [
      { icon: "shield", title: "Clean tools", text: "Sterilised tools and fresh files for every client." },
      { icon: "sparkles", title: "Detailed art", text: "From simple shine to custom designs." },
      { icon: "award", title: "Lasting finish", text: "Products and prep that keep your set looking fresh." },
      { icon: "heart", title: "Relaxed visits", text: "Sit back. We'll take our time getting it right." },
    ],
    steps: STEPS_DEFAULT,
  },
  "lashes-brows": {
    label: "Lashes & brows",
    headline: "Lashes and brows that frame your face.",
    subtext: "Extensions, lifts, tints and shaping. Book online and we'll match the look to you.",
    reasons: [
      { icon: "award", title: "Certified artists", text: "Trained in classic, hybrid and volume sets." },
      { icon: "shield", title: "Safe, gentle products", text: "Patch tests on request and quality adhesives." },
      { icon: "sparkles", title: "Natural to bold", text: "We match the look to your eyes and your style." },
      { icon: "clock", title: "Easy refills", text: "Book refills in a few taps, right on time." },
    ],
    steps: STEPS_DEFAULT,
  },
  makeup: {
    label: "Makeup artist",
    headline: "Makeup for the moments that matter.",
    subtext: "Bridal, events, photoshoots and lessons. Check availability and book your session.",
    reasons: [
      { icon: "sparkles", title: "Camera-ready", text: "Looks that stay put and photograph beautifully." },
      { icon: "heart", title: "Your look, not ours", text: "We plan the look with you before the day." },
      { icon: "calendar", title: "We come to you", text: "Studio or on location, whatever suits the day." },
      { icon: "award", title: "Quality products", text: "Professional kits for every skin tone." },
    ],
    steps: STEPS_DEFAULT,
  },
  "skin-spa": {
    label: "Skin & spa",
    headline: "Calm, clear skin, one visit at a time.",
    subtext: "Facials, treatments and massages in a quiet space. Book online and take the time for you.",
    reasons: [
      { icon: "leaf", title: "Made for your skin", text: "Treatments chosen after we look at your skin together." },
      { icon: "shield", title: "Clean and calm", text: "Hygienic rooms, fresh linen, no rush." },
      { icon: "award", title: "Trained therapists", text: "Experienced hands for every treatment." },
      { icon: "heart", title: "Honest advice", text: "We'll tell you what you need, and what you don't." },
    ],
    steps: STEPS_DEFAULT,
  },
  barber: {
    label: "Barbershop",
    headline: "Sharp cuts. No waiting.",
    subtext: "Fades, trims, beards and shaves. Pick your barber's next free time and walk straight in.",
    reasons: [
      { icon: "award", title: "Skilled barbers", text: "Clean fades and sharp lines, every time." },
      { icon: "clock", title: "No queue", text: "Book your slot and skip the wait." },
      { icon: "shield", title: "Clean tools", text: "Sterilised clippers and fresh blades." },
      { icon: "users", title: "For everyone", text: "Kids, adults and every hair type welcome." },
    ],
    steps: STEPS_DEFAULT,
  },
  wellness: {
    label: "Wellness",
    headline: "Time to rest, reset and feel good.",
    subtext: "Massage, body treatments and wellness sessions. Book a time that's just for you.",
    reasons: [
      { icon: "leaf", title: "Quiet space", text: "Somewhere calm to switch off for a while." },
      { icon: "award", title: "Experienced therapists", text: "Skilled, attentive and professional." },
      { icon: "heart", title: "Made for you", text: "Pressure and focus adjusted to how you feel." },
      { icon: "calendar", title: "Easy booking", text: "See free times and book in a minute." },
    ],
    steps: STEPS_DEFAULT,
  },
  general: {
    label: "Beauty studio (several services)",
    headline: "Book your next appointment in under a minute.",
    subtext: "See our prices and free times, pick the slot that suits you, and we'll confirm it by email.",
    reasons: [
      { icon: "award", title: "Skilled team", text: "Trained, experienced and careful with every client." },
      { icon: "shield", title: "Clean and safe", text: "Sterilised tools and hygienic spaces." },
      { icon: "clock", title: "On time", text: "Your slot is held, so you won't be kept waiting." },
      { icon: "heart", title: "We listen", text: "Every visit starts with what you'd like." },
    ],
    steps: STEPS_DEFAULT,
  },
};

export const SITE_TEMPLATES: Record<SiteTemplate, { label: string; description: string }> = {
  editorial: {
    label: "Editorial",
    description: "Calm and elegant: serif headings, a full-width photo, soft sections.",
  },
  bold: {
    label: "Bold",
    description: "Confident: a big photo hero with your highlights in a band across it.",
  },
  minimal: {
    label: "Minimal",
    description: "Clean and simple: plain background, lots of space, your work up front.",
  },
};

export const studioTypeOf = (v: string | null | undefined): StudioType =>
  v && v in STUDIO_TYPES ? (v as StudioType) : "general";
export const templateOf = (v: string | null | undefined): SiteTemplate =>
  v === "bold" || v === "minimal" ? v : "editorial";
