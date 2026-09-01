import { useEffect } from "react";

/**
 * Loads the Umami analytics script when configured. Set both:
 *   VITE_UMAMI_SRC=https://<your-umami>/script.js
 *   VITE_UMAMI_WEBSITE_ID=<website-id>
 * No-op when either is missing, so it never runs in local dev by default.
 */
export const UmamiAnalytics = () => {
  useEffect(() => {
    const src = import.meta.env.VITE_UMAMI_SRC as string | undefined;
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
    if (!src || !websiteId) return;
    if (document.querySelector(`script[data-website-id="${websiteId}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = src;
    script.setAttribute("data-website-id", websiteId);
    document.head.appendChild(script);
  }, []);

  return null;
};
