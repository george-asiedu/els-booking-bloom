// Runtime per-studio theming. The design system is driven by HSL CSS variables
// (see index.css); a studio's brand colors are stored as hex, so we convert and
// write them as inline custom properties on <html>, overriding the defaults.

interface Hsl {
  h: number;
  s: number;
  l: number;
}

// "#rrggbb" / "#rgb" -> {h,s,l}. Returns null for anything unparseable.
export const hexToHsl = (hex: string): Hsl | null => {
  if (!hex) return null;
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const cssHsl = ({ h, s, l }: Hsl) => `${h} ${s}% ${l}%`;

export interface StudioBranding {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
}

// The variables a studio's one brand colour sets. Cleared back to the Zuri
// defaults (index.css) when the studio has no colour.
const BRAND_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--rose",
  "--studio-ink-light",
  "--studio-ink-dark",
  "--studio-tint-light",
  "--studio-tint-dark",
];

// WCAG contrast between two HSL colours.
const toRgb = ({ h, s, l }: Hsl) => {
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
};
const luminance = (c: Hsl) =>
  toRgb(c)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: Hsl, b: Hsl) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const WHITE: Hsl = { h: 0, s: 0, l: 100 };
const INK: Hsl = { h: 214, s: 33, l: 10 };
const DARK_BG: Hsl = { h: 214, s: 33, l: 7 };

/** The colour moved darker (or lighter) until it reads at 4.5:1 on `bg`. */
const readableOn = (c: Hsl, bg: Hsl, step: -1 | 1): Hsl => {
  let l = c.l;
  while (contrast({ ...c, l }, bg) < 4.5 && l > 0 && l < 100) l += step;
  return { ...c, l };
};

// Fonts already @imported in index.css — a studio can pick one of these and it
// renders without loading anything extra. Unknown names fall back to sans.
const KNOWN_FONTS: Record<string, string> = {
  inter: "'Inter', sans-serif",
  lora: "'Lora', serif",
  "space mono": "'Space Mono', monospace",
};

/**
 * Apply (or clear) a studio's brand. A studio picks one colour; it's used the
 * same way on white and on dark (blue on white, blue on dark), and everything
 * else follows from it: the text on top of it (ink or white, whichever reads
 * better), a shade readable as text on each background, and a soft tint.
 */
export const applyStudioTheme = (branding?: StudioBranding | null) => {
  const root = document.documentElement;

  const primary = branding?.primaryColor ? hexToHsl(branding.primaryColor) : null;
  if (primary) {
    root.style.setProperty("--primary", cssHsl(primary));
    root.style.setProperty("--ring", cssHsl(primary));
    root.style.setProperty("--rose", cssHsl(primary));
    root.style.setProperty(
      "--primary-foreground",
      cssHsl(contrast(primary, INK) >= contrast(primary, WHITE) ? INK : WHITE),
    );
    root.style.setProperty("--studio-ink-light", cssHsl(readableOn(primary, WHITE, -1)));
    root.style.setProperty("--studio-ink-dark", cssHsl(readableOn(primary, DARK_BG, 1)));
    root.style.setProperty("--studio-tint-light", `${primary.h} ${Math.min(primary.s, 90)}% 95%`);
    root.style.setProperty("--studio-tint-dark", `${primary.h} ${Math.min(primary.s, 60)}% 14%`);
  } else {
    BRAND_VARS.forEach((v) => root.style.removeProperty(v));
  }
  // Older studios may have saved an accent colour; it's no longer used.
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-foreground");

  const font = branding?.fontFamily?.trim();
  if (font) {
    const stack = KNOWN_FONTS[font.toLowerCase()] || `'${font}', sans-serif`;
    document.body.style.fontFamily = stack;
  } else {
    document.body.style.removeProperty("font-family");
  }
};
