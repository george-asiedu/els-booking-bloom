import { applyStudioManifest } from "@/lib/pwa";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStudio } from "@/hooks/useStudio";
import { applyStudioTheme } from "@/lib/theme";
import { studioStore } from "@/lib/apiClient";
import { PLATFORM } from "@/config/platform";
import { rememberStudioSplash } from "@/lib/splash";

/**
 * Applies the active studio's brand colours to the storefront and studio admin,
 * but keeps the neutral default (the pink system theme) on the platform console
 * and the Zuri landing page. A studio's colours only apply when a studio is
 * actually active (subdomain / impersonation / `/s/:slug`), so they never bleed
 * onto the platform, the landing, or another studio.
 */
export const StudioTheme = () => {
  const { config } = useStudio();
  const { pathname } = useLocation();
  const isPlatform = pathname.startsWith("/platform");
  const hasStudio = Boolean(studioStore.getSlug());
  const neutral = isPlatform || !hasStudio;

  useEffect(() => {
    applyStudioTheme(neutral ? null : config?.branding ?? null);
    // A page that sets its own title (useSeo) keeps it; this is the fallback.
    const fallback = !neutral && config?.name ? config.name : PLATFORM.name;
    if (!document.title.includes(fallback)) document.title = fallback;
    if (!neutral && config) {
      rememberStudioSplash({
        name: config.name,
        logoUrl: config.branding.logoUrl,
        primaryColor: config.branding.primaryColor,
      });
    }
    // A studio's own site installs under the studio's name.
    if (hasStudio && config) applyStudioManifest({ name: config.name, themeColor: config.branding.primaryColor });
  }, [neutral, hasStudio, config]);

  return null;
};
