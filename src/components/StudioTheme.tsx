import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStudio } from "@/hooks/useStudio";
import { applyStudioTheme } from "@/lib/theme";
import { studioStore } from "@/lib/apiClient";
import { PLATFORM } from "@/config/platform";

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
    document.title = !neutral && config?.name ? config.name : PLATFORM.name;
  }, [neutral, config]);

  return null;
};
