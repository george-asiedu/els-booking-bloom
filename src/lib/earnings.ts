import type { EarningPurpose } from "@/lib/platformApi";

export const PURPOSE_LABEL: Record<EarningPurpose, string> = {
  SETUP_FEE: "Setup fee",
  ACTIVATION_FEE: "Activation fee",
  RENEWAL: "Renewal",
  PLAN_CHANGE: "Plan change",
  COMMISSION: "Commission",
};

export const PURPOSE_HELP: Record<EarningPurpose, string> = {
  SETUP_FEE: "Paid at signup by a studio on a subscription. Covers its first months.",
  ACTIVATION_FEE: "Paid at signup by a pay-as-you-earn studio.",
  RENEWAL: "A studio paying for another month or year of its plan.",
  PLAN_CHANGE: "A studio switching plan or billing period. Starts a fresh period.",
  COMMISSION:
    "Your share of a pay-as-you-earn studio's customer payments that month. Estimated from its rate, because Paystack splits it at payment time.",
};
