import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useStudio } from "@/hooks/useStudio";
import { StudioFeatureFlags } from "@/lib/api";

/**
 * Gates a storefront route behind a studio feature flag. While the studio config
 * is still loading we show a spinner (rather than flash the page and redirect);
 * once loaded, a disabled feature sends the visitor home.
 */
export const FeatureRoute = ({
  feature,
  children,
}: {
  feature: keyof StudioFeatureFlags;
  children: React.ReactNode;
}) => {
  const { features, isLoading } = useStudio();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!features[feature]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
