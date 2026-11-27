import { useQuery } from "@tanstack/react-query";
import { onboardingApi, type OnboardingConfig, type Plan, type Cadence } from "@/lib/onboardingApi";

/**
 * The one-time subscription setup fee for a plan, ADDED to the first period's
 * price at signup (the next renewal is the plan price alone), or null when that
 * plan has none. Mirrors subscriptionSetupFeeFor in ELS-Server platformService.
 */
export const subscriptionSetup = (
  cfg: OnboardingConfig | null | undefined,
  plan: Plan,
  _cadence?: Cadence,
): { fee: number } | null => {
  if (!cfg) return null;
  const fee =
    plan === "PREMIUM"
      ? cfg.subscriptionSetupFeePremium
      : plan === "STOREFRONT"
        ? (cfg.subscriptionSetupFeeStorefront ?? 0)
        : cfg.subscriptionSetupFeeStandard;
  if (!(fee > 0)) return null;
  return { fee };
};

/** The public billing settings (setup fees etc.), cached for the session. */
export const useOnboardingConfig = () =>
  useQuery({
    queryKey: ["onboarding-config"],
    queryFn: () => onboardingApi.config(),
    staleTime: 10 * 60 * 1000,
  });

/** True once loaded and neither plan has a subscription setup fee. */
export const hasNoSetupFee = (cfg: OnboardingConfig | undefined) =>
  !!cfg && !(cfg.subscriptionSetupFeeStandard > 0) && !(cfg.subscriptionSetupFeePremium > 0);
