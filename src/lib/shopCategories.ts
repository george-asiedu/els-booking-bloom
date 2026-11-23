import {
  Apple,
  Baby,
  BookOpen,
  CakeSlice,
  CupSoda,
  Dumbbell,
  Footprints,
  Gem,
  Headphones,
  HeartPulse,
  Palette,
  Scissors,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

// What a shop can sell. Mirrors ELS-Server src/billing/shopCategories.ts; the
// ids are stored, and pick the shop website's template.
export const SHOP_CATEGORIES: readonly { id: ShopCategoryId; label: string; icon: LucideIcon }[] = [
  { id: "clothing", label: "Clothing & fashion", icon: Shirt },
  { id: "shoes", label: "Shoes", icon: Footprints },
  { id: "bags-accessories", label: "Bags & accessories", icon: Briefcase },
  { id: "jewellery", label: "Jewellery & watches", icon: Gem },
  { id: "beauty", label: "Beauty & skincare", icon: Sparkles },
  { id: "hair", label: "Hair & wigs", icon: Scissors },
  { id: "perfume", label: "Perfume & fragrance", icon: SprayCan },
  { id: "food", label: "Food & groceries", icon: Apple },
  { id: "drinks", label: "Drinks", icon: CupSoda },
  { id: "bakery", label: "Cakes & pastries", icon: CakeSlice },
  { id: "electronics", label: "Electronics & gadgets", icon: Headphones },
  { id: "phones", label: "Phones & accessories", icon: Smartphone },
  { id: "home", label: "Home & living", icon: Sofa },
  { id: "kids", label: "Kids & baby", icon: Baby },
  { id: "health", label: "Health & wellness", icon: HeartPulse },
  { id: "sports", label: "Sports & fitness", icon: Dumbbell },
  { id: "books", label: "Books & stationery", icon: BookOpen },
  { id: "art", label: "Art & crafts", icon: Palette },
  { id: "other", label: "Something else", icon: ShoppingBag },
];

export type ShopCategoryId =
  | "clothing" | "shoes" | "bags-accessories" | "jewellery" | "beauty" | "hair" | "perfume"
  | "food" | "drinks" | "bakery" | "electronics" | "phones" | "home" | "kids" | "health"
  | "sports" | "books" | "art" | "other";
