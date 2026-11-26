import { useEffect } from "react";

// Search and share details for a page: title, description, social preview,
// canonical address, and optional structured data (schema.org JSON-LD) so
// search engines can show a business's address, hours and rating, or a
// product's price. Set while the page is open; the next page sets its own.

interface Seo {
  title: string;
  description?: string | null;
  image?: string | null;
  /** schema.org objects, rendered as one JSON-LD script. */
  structuredData?: Record<string, unknown> | Record<string, unknown>[] | null;
  /** Keep this page out of search results (carts, accounts, callbacks). */
  noIndex?: boolean;
}

const setMeta = (attr: "name" | "property", key: string, content: string | null | undefined) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

export const useSeo = ({ title, description, image, structuredData, noIndex }: Seo) => {
  const data = structuredData ? JSON.stringify(structuredData) : null;
  useEffect(() => {
    document.title = title;
    const desc = description ? description.replace(/\s+/g, " ").trim().slice(0, 160) : null;
    const url = `${window.location.origin}${window.location.pathname}`;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : null);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const id = "seo-structured-data";
    document.getElementById(id)?.remove();
    if (data) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.textContent = data;
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [title, description, image, data, noIndex]);
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "9:00 AM" or "18:30" → "18:30", for schema.org opening hours. */
const hhmm = (t: string | null | undefined) => {
  const m = t?.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  const h = Number(m[1]);
  const mer = m[3]?.toLowerCase();
  const hours = !mer ? h : (h % 12) + (mer === "pm" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${m[2]}`;
};

/** schema.org data for a business's home page. */
export const businessSchema = (b: {
  kind: "studio" | "store";
  name: string;
  description?: string | null;
  image?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number;
  hours?: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[];
}) => ({
  "@context": "https://schema.org",
  "@type": b.kind === "store" ? "Store" : "BeautySalon",
  name: b.name,
  url: window.location.origin,
  ...(b.description ? { description: b.description } : {}),
  ...(b.image ? { image: b.image } : {}),
  ...(b.logo ? { logo: b.logo } : {}),
  ...(b.phone ? { telephone: b.phone } : {}),
  ...(b.email ? { email: b.email } : {}),
  ...(b.address ? { address: { "@type": "PostalAddress", streetAddress: b.address, addressCountry: "GH" } } : {}),
  ...(b.rating && b.reviewCount
    ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(b.rating.toFixed(1)), reviewCount: b.reviewCount } }
    : {}),
  ...(b.hours?.length
    ? {
        openingHoursSpecification: b.hours
          .filter((h) => !h.is_closed && hhmm(h.open_time) && hhmm(h.close_time))
          .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[h.day_of_week], opens: hhmm(h.open_time), closes: hhmm(h.close_time) })),
      }
    : {}),
});

/**
 * Keep a private page (cart, checkout, account, sign-in, payment callbacks,
 * dashboards) out of search results. Removed again when the page closes.
 */
export const useNoIndex = () => {
  useEffect(() => {
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !el;
    if (!el) {
      el = document.createElement("meta");
      el.name = "robots";
      document.head.appendChild(el);
    }
    const before = el.content;
    el.content = "noindex, nofollow";
    return () => {
      if (created) el?.remove();
      else if (el) el.content = before;
    };
  }, []);
};

/** schema.org list of a business's services with their prices (Ghana cedis). */
export const servicesSchema = (
  business: string,
  services: { name: string; description?: string | null; price: number; image_url?: string | null }[],
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${business} services and prices`,
  itemListElement: services.slice(0, 50).map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.name,
      ...(s.description ? { description: s.description.slice(0, 300) } : {}),
      ...(s.image_url?.startsWith("http") ? { image: s.image_url } : {}),
      provider: { "@type": "LocalBusiness", name: business, url: window.location.origin },
      offers: { "@type": "Offer", price: s.price, priceCurrency: "GHS" },
    },
  })),
});

/** schema.org list of products, for a shop's product listing. */
export const productListSchema = (
  shop: string,
  products: { id: string; name: string; image_url?: string | null; effective_price: number; in_stock?: boolean }[],
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${shop} products`,
  itemListElement: products.slice(0, 50).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${window.location.origin}/shop/${p.id}`,
    name: p.name,
  })),
});
