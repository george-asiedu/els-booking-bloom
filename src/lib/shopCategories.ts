// What a shop can sell. Mirrors ELS-Server src/billing/shopCategories.ts; the
// ids are stored, and pick the shop website's template.
export const SHOP_CATEGORIES = [
  { id: "clothing", label: "Clothing & fashion", emoji: "👗" },
  { id: "shoes", label: "Shoes", emoji: "👟" },
  { id: "bags-accessories", label: "Bags & accessories", emoji: "👜" },
  { id: "jewellery", label: "Jewellery & watches", emoji: "💍" },
  { id: "beauty", label: "Beauty & skincare", emoji: "🧴" },
  { id: "hair", label: "Hair & wigs", emoji: "💇🏾‍♀️" },
  { id: "perfume", label: "Perfume & fragrance", emoji: "🌸" },
  { id: "food", label: "Food & groceries", emoji: "🥘" },
  { id: "drinks", label: "Drinks", emoji: "🥤" },
  { id: "bakery", label: "Cakes & pastries", emoji: "🎂" },
  { id: "electronics", label: "Electronics & gadgets", emoji: "🎧" },
  { id: "phones", label: "Phones & accessories", emoji: "📱" },
  { id: "home", label: "Home & living", emoji: "🛋️" },
  { id: "kids", label: "Kids & baby", emoji: "🧸" },
  { id: "health", label: "Health & wellness", emoji: "🌿" },
  { id: "sports", label: "Sports & fitness", emoji: "🏋🏾" },
  { id: "books", label: "Books & stationery", emoji: "📚" },
  { id: "art", label: "Art & crafts", emoji: "🎨" },
  { id: "other", label: "Something else", emoji: "🛍️" },
] as const;

export type ShopCategoryId = (typeof SHOP_CATEGORIES)[number]["id"];
