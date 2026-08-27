import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStudio } from "@/hooks/useStudio";
import { applyStudioTheme } from "@/lib/theme";

/**
 * Applies the current studio's brand colors to the storefront and studio admin,
 * but keeps the super-admin platform console neutral — a studio's colors must
 * never bleed onto the platform (or onto another studio). Runs inside the router
 * so it reacts to navigation, not just config changes.
 */
export const StudioTheme = () => {
  const { config } = useStudio();
  const { pathname } = useLocation();
  const isPlatform = pathname.startsWith("/platform");

  useEffect(() => {
    if (isPlatform) {
      applyStudioTheme(null); // neutral, default palette
    } else {
      applyStudioTheme(config?.branding ?? null);
    }
    if (!isPlatform && config?.name) {
      document.title = config.name;
    }
  }, [isPlatform, config]);

  return null;
};
