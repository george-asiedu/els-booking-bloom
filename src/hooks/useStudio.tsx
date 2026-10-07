import { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioApi, StudioConfigDTO, StudioFeatureFlags } from "@/lib/api";

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

const FALLBACK_NAME = "Zuri Studios";

const ALL_ON: StudioFeatureFlags = {
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
  });

  // Theming is applied by <StudioTheme/> inside the router, so the platform
  // console stays neutral and a studio's colors never bleed onto other areas.
  const value = useMemo(
    () => ({
      config: config ?? null,
      isLoading,
      name: config?.name || FALLBACK_NAME,
      features: config?.settings ?? ALL_ON,
    }),
    [config, isLoading],
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
