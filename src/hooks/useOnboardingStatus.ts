import { useQuery } from "@tanstack/react-query";
import {
  studioApi,
  studioAdminApi,
  servicesApi,
  productsApi,
} from "@/lib/api";
import { useStudio } from "@/hooks/useStudio";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  path: string;
  cta: string;
}

/**
 * Derives a studio's first-run setup checklist from live data, reused by the
 * onboarding page and the dashboard banner. Queries are shared/cached by
 * react-query, so reading it in two places costs one fetch each.
 */
export const useOnboardingStatus = () => {
  const { features } = useStudio();

  const { data: payout } = useQuery({
    queryKey: ["studio-payout"],
    queryFn: () => studioAdminApi.getPayout(),
  });
  const { data: config } = useQuery({
    queryKey: ["studio-config"],
    queryFn: () => studioApi.getConfig(),
  });
  const { data: services } = useQuery({
    queryKey: ["admin-services-all"],
    queryFn: () => servicesApi.listAll(),
  });
  const { data: products } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: () => productsApi.listAll(),
    enabled: features.commerce,
  });

  const steps: OnboardingStep[] = [
    {
      key: "service",
      label: "Add your first service",
      description: "List a service customers can book.",
      done: (services?.length ?? 0) > 0,
      path: "/admin/services",
      cta: "Add a service",
    },
    {
      key: "branding",
      label: "Add your branding",
      description: "Upload a logo and set your brand colours.",
      done: Boolean(
        config?.branding.primaryColor || config?.branding.logoUrl,
      ),
      path: "/admin/appearance",
      cta: "Set branding",
    },
    {
      key: "content",
      label: "Personalise your landing page",
      description: "Write your hero headline and welcome text.",
      done: Boolean(config?.content.heroHeadline),
      path: "/admin/appearance",
      cta: "Edit landing page",
    },
    {
      key: "payout",
      label: "Connect your payout account",
      description: "Receive customer payments to your mobile money.",
      done: Boolean(payout?.connected),
      path: "/admin/payments",
      cta: "Connect payout",
    },
  ];

  if (features.commerce) {
    steps.push({
      key: "product",
      label: "Add your first product",
      description: "Stock your shop with something to sell.",
      done: (products?.length ?? 0) > 0,
      path: "/admin/products",
      cta: "Add a product",
    });
  }

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const ready = payout !== undefined && config !== undefined && services !== undefined;

  return {
    steps,
    doneCount,
    total,
    allDone: ready && doneCount === total,
    ready,
  };
};
