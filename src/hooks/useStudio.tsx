import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioApi, StudioConfigDTO, StudioContentDTO, StudioFeatureFlags } from "@/lib/api";
import { studioStore } from "@/lib/apiClient";

interface StudioContextType {
  config: StudioConfigDTO | null;
  isLoading: boolean;
  // Convenience: studio display name, falling back to a neutral default.
  name: string;
  // Which modules this studio has enabled. Defaults to all-on until the config
  // loads (and if it can't be fetched), so nothing is hidden prematurely.
  features: StudioFeatureFlags;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const FALLBACK_NAME = "Zuri";

const ALL_ON: StudioFeatureFlags = {
  booking: true,
  commerce: true,
  loyalty: true,
  referrals: true,
  reviews: true,
  gallery: true,
  onlinePayments: true,
  productsInBooking: true,
};

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const { data: config, isLoading } = useQuery({
    queryKey: ["studio-config"],
    queryFn: () => studioApi.getConfig(),
    staleTime: 10 * 60 * 1000,
    // The platform's own pages have no studio to load.
    enabled: Boolean(studioStore.getSlug()),
  });

  // The Appearance page shows the site in a frame and sends it what the owner is
  // typing, unsaved. Only inside that frame (same address, opened with
  // ?zuri-preview) does the site take it; a normal visitor never does.
  const [draft, setDraft] = useState<Partial<StudioContentDTO> | null>(null);
  useEffect(() => {
    let framed = false;
    try {
      framed = window.self !== window.top && new URLSearchParams(window.location.search).has("zuri-preview");
    } catch {
      framed = false;
    }
    if (!framed) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { source?: string; content?: Partial<StudioContentDTO> } | null;
      if (d?.source === "zuri-preview" && d.content && typeof d.content === "object") setDraft(d.content);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: "zuri-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Theming is applied by <StudioTheme/> inside the router, so the platform
  // console stays neutral and a studio's colors never bleed onto other areas.
  const value = useMemo(
    () => ({
      config: config && draft
        ? {
            ...config,
            content: { ...config.content, ...draft },
            shopCategory: draft.shopCategory !== undefined ? draft.shopCategory : config.shopCategory,
            shopCategories: draft.shopCategories ?? config.shopCategories,
          }
        : config ?? null,
      isLoading,
      name: config?.name || FALLBACK_NAME,
      features: config?.settings ?? ALL_ON,
    }),
    [config, isLoading, draft],
  );

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (ctx === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return ctx;
};
