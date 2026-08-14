import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioApi, StudioConfigDTO } from "@/lib/api";
import { applyStudioTheme } from "@/lib/theme";

interface StudioContextType {
  config: StudioConfigDTO | null;
  isLoading: boolean;
  // Convenience: studio display name, falling back to a neutral default.
  name: string;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const FALLBACK_NAME = "El's Beauty Studio";

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const { data: config, isLoading } = useQuery({
    queryKey: ["studio-config"],
    queryFn: () => studioApi.getConfig(),
    staleTime: 10 * 60 * 1000,
  });

  // Apply brand colors whenever the config changes; set the document title.
  useEffect(() => {
    if (!config) return;
    applyStudioTheme(config.branding);
    if (config.name) document.title = config.name;
  }, [config]);

  const name = config?.name || FALLBACK_NAME;

  return (
    <StudioContext.Provider value={{ config: config ?? null, isLoading, name }}>
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
