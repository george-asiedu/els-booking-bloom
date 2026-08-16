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

// The variables a studio's brand can override. Cleared back to the stylesheet
// defaults when the studio provides no colors.
const PRIMARY_VARS = ["--primary", "--primary-foreground", "--ring", "--rose"];
const ACCENT_VARS = ["--accent", "--accent-foreground"];

// Fonts already @imported in index.css — a studio can pick one of these and it
// renders without loading anything extra. Unknown names fall back to sans.
const KNOWN_FONTS: Record<string, string> = {
  inter: "'Inter', sans-serif",
  lora: "'Lora', serif",
  "space mono": "'Space Mono', monospace",
};

/**
 * Apply (or clear) a studio's brand colors on the document root. Primary drives
 * buttons/links/rings; accent drives the soft highlight backgrounds. Foreground
 * colors are chosen for contrast against the brand color.
 */
export const applyStudioTheme = (branding?: StudioBranding | null) => {
  const root = document.documentElement;

  const primary = branding?.primaryColor
    ? hexToHsl(branding.primaryColor)
    : null;
  if (primary) {
    root.style.setProperty("--primary", cssHsl(primary));
    root.style.setProperty("--ring", cssHsl(primary));
    root.style.setProperty("--rose", cssHsl(primary));
    // Readable text on top of the primary color.
    root.style.setProperty(
      "--primary-foreground",
      primary.l > 65 ? "340 20% 15%" : "0 0% 100%",
    );
  } else {
    PRIMARY_VARS.forEach((v) => root.style.removeProperty(v));
  }

  const accent = branding?.accentColor ? hexToHsl(branding.accentColor) : null;
  if (accent) {
    // Keep accent as a soft tint background with a saturated foreground, matching
    // the default design's light-accent pattern.
    root.style.setProperty("--accent", `${accent.h} ${accent.s}% 92%`);
    root.style.setProperty(
      "--accent-foreground",
      `${accent.h} ${Math.max(accent.s, 40)}% 35%`,
    );
  } else {
    ACCENT_VARS.forEach((v) => root.style.removeProperty(v));
  }

  const font = branding?.fontFamily?.trim();
  if (font) {
    const stack = KNOWN_FONTS[font.toLowerCase()] || `'${font}', sans-serif`;
    document.body.style.fontFamily = stack;
  } else {
    document.body.style.removeProperty("font-family");
  }
};
