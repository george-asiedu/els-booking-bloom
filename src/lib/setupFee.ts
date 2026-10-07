import { useQuery } from "@tanstack/react-query";
import { onboardingApi, type OnboardingConfig, type Plan, type Cadence } from "@/lib/onboardingApi";

/**
 * The subscription setup fee for a plan and cadence, and the months it covers,
 * or null when that plan has none (the first period is paid at its normal
 * price). Mirrors subscriptionSetupFor in ELS-Server platformService.
 */
export const subscriptionSetup = (
  cfg: OnboardingConfig | null | undefined,
  plan: Plan,
  cadence: Cadence,
): { fee: number; months: number } | null => {
  if (!cfg) return null;
  const fee =
    plan === "PREMIUM" ? cfg.subscriptionSetupFeePremium : cfg.subscriptionSetupFeeStandard;
  if (!(fee > 0)) return null;
  return {
    fee,
    months: cadence === "YEARLY" ? cfg.setupFeeMonthsYearly : cfg.setupFeeMonthsMonthly,
  };
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
