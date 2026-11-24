// Default hero art for a new shop or studio, drawn from what it sells / does.
// Until the owner uploads a photo (or adds products or gallery pictures), the
// hero shows a soft gradient with a pattern of that business's own motif, not
// a stock photo that may not fit. Returned as an SVG data URL so it works
// anywhere an image URL does.

import { useMemo } from "react";
import { useStudio } from "@/hooks/useStudio";
import { studioTypeOf } from "@/lib/studioTemplates";

interface Art {
  // Two gradient colours (dark enough for white hero text) and the motif.
  from: string;
  to: string;
  motif: string[];
}

const SHOP: Record<string, Art> = {
  clothing: { from: "#3b2a4a", to: "#8a4f7d", motif: ["👗", "👕", "👖", "🧥"] },
  shoes: { from: "#1f3a5f", to: "#3f6fa8", motif: ["👟", "👠", "🥿", "👡"] },
  "bags-accessories": { from: "#4a3426", to: "#9a6b43", motif: ["👜", "🕶️", "🎒", "🧣"] },
  jewellery: { from: "#3a2f12", to: "#a8842c", motif: ["💍", "💎", "⌚", "📿"] },
  beauty: { from: "#5a2a3c", to: "#c0607f", motif: ["💄", "🧴", "🌸", "✨"] },
  hair: { from: "#3a2340", to: "#7d4a8f", motif: ["💇🏾‍♀️", "🎀", "✨", "💆🏾‍♀️"] },
  perfume: { from: "#2b2350", to: "#6b57b8", motif: ["🧴", "🌹", "✨", "🌿"] },
  food: { from: "#2f4a1f", to: "#6f9a3a", motif: ["🍎", "🥦", "🥖", "🍅"] },
  drinks: { from: "#14485a", to: "#2f9bb8", motif: ["🥤", "🍹", "🧃", "🍊"] },
  bakery: { from: "#5a3a2a", to: "#c98a5a", motif: ["🎂", "🧁", "🥐", "🍰"] },
  electronics: { from: "#10223f", to: "#2a5aa8", motif: ["🎧", "💻", "⌚", "🔌"] },
  phones: { from: "#142a44", to: "#2f6fb0", motif: ["📱", "🔋", "🎧", "🔌"] },
  home: { from: "#3a3a2a", to: "#8a8a4f", motif: ["🛋️", "🪴", "🕯️", "🛏️"] },
  kids: { from: "#2a3f6b", to: "#e0a526", motif: ["🧸", "🧩", "🚂", "🍼", "🎈", "👶"] },
  health: { from: "#14503f", to: "#2fa886", motif: ["💊", "🌿", "🧘🏾", "💧"] },
  sports: { from: "#4a1f1f", to: "#c0432f", motif: ["⚽", "🏀", "🏋🏾", "👟"] },
  books: { from: "#33261f", to: "#7a5a3f", motif: ["📚", "✏️", "📓", "🖊️"] },
  art: { from: "#4a1f4a", to: "#b8409a", motif: ["🎨", "🖌️", "🧵", "🏺"] },
  other: { from: "#1f2937", to: "#4b5563", motif: ["🛍️", "🎁", "⭐", "📦"] },
};

const STUDIO: Record<string, Art> = {
  hair: { from: "#3a2340", to: "#7d4a8f", motif: ["💇🏾‍♀️", "✂️", "💆🏾‍♀️", "✨"] },
  braids: { from: "#3a2a1f", to: "#9a6b43", motif: ["💇🏾‍♀️", "🎀", "✨", "💫"] },
  nails: { from: "#5a2a3c", to: "#c0607f", motif: ["💅🏾", "✨", "💎", "🌸"] },
  "lashes-brows": { from: "#2f2340", to: "#7a5aa8", motif: ["👁️", "✨", "🌸", "💫"] },
  makeup: { from: "#5a1f3a", to: "#c04f8a", motif: ["💄", "✨", "🪞", "🌸"] },
  "skin-spa": { from: "#14503f", to: "#4fb89a", motif: ["🧖🏾‍♀️", "🌿", "💧", "🕯️"] },
  barber: { from: "#1f2937", to: "#4b5f7a", motif: ["💈", "✂️", "🪒", "🧔🏾"] },
  wellness: { from: "#1f4a3a", to: "#5aa88a", motif: ["🧘🏾", "🌿", "💆🏾", "🕯️"] },
  general: { from: "#1f2937", to: "#4b5563", motif: ["✨", "📅", "💫", "🌸"] },
};

const build = ({ from, to, motif }: Art): string => {
  // A loose grid of faint motifs, alternately offset.
  let glyphs = "";
  const step = 220;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 10; col++) {
      const g = motif[(row * 3 + col) % motif.length];
      const x = col * step + (row % 2 ? step / 2 : 0) + 40;
      const y = row * step + 120;
      const rot = ((row * 7 + col * 11) % 40) - 20;
      glyphs += `<text x="${x}" y="${y}" font-size="96" opacity="0.14" transform="rotate(${rot} ${x} ${y})">${g}</text>`;
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="1920" height="1080" fill="url(#g)"/>${glyphs}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const cache = new Map<string, string>();
const cached = (key: string, art: Art) => {
  let url = cache.get(key);
  if (!url) {
    url = build(art);
    cache.set(key, url);
  }
  return url;
};

export const shopHeroArt = (category: string | null | undefined): string =>
  cached(`shop:${category ?? "other"}`, SHOP[category ?? ""] ?? SHOP.other);

export const studioHeroArt = (type: string | null | undefined): string => {
  const t = studioTypeOf(type);
  return cached(`studio:${t}`, STUDIO[t] ?? STUDIO.general);
};

/**
 * The default hero for the current business: a shop's art follows what it
 * sells, a studio's follows the kind of studio. Used wherever a hero has no
 * photo of its own.
 */
export const useHeroFallback = (): string => {
  const { config, features } = useStudio();
  const isShop = features.booking === false || config?.plan === "STOREFRONT";
  const category = config?.shopCategory;
  const type = config?.content?.studioType;
  return useMemo(() => (isShop ? shopHeroArt(category) : studioHeroArt(type)), [isShop, category, type]);
};
