// Default hero photo for a new shop or studio, chosen by what it sells / does.
// Until the owner uploads a photo (or adds products or gallery pictures), the
// hero shows a real photograph that fits the business: a shop's photo follows
// its category, a studio's follows its kind. Owner photos always win.
//
// The photos are self-hosted in /public/hero (1600x900 JPEG, from Unsplash,
// free to use under the Unsplash License), so heroes never depend on a
// third-party CDN. Each is checked to carry no brand logos or price tags.

import { useMemo } from "react";
import { useStudio } from "@/hooks/useStudio";
import { studioTypeOf } from "@/lib/studioTemplates";
import { SHOP_CATEGORIES, type ShopCategoryId } from "@/lib/shopCategories";

const shopIds = new Set<string>(SHOP_CATEGORIES.map((c) => c.id));

export const shopHeroArt = (category: string | null | undefined): string => {
  const id: ShopCategoryId = category && shopIds.has(category) ? (category as ShopCategoryId) : "other";
  return `/hero/shop-${id}.jpg`;
};

export const studioHeroArt = (type: string | null | undefined): string =>
  `/hero/studio-${studioTypeOf(type)}.jpg`;

/**
 * The default hero for the current business: a shop's photo follows what it
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
