import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatGHS } from "@/lib/currency";
import type { PaymentSettingsDTO, ServiceDTO } from "@/lib/api";
import type { BookingPricing } from "./pricing";
import type { AddOnItem } from "./useAddOns";

interface BookingSummaryProps {
  service: ServiceDTO;
  pricing: BookingPricing;
  signedIn: boolean;
  availablePoints: number;
  loyaltyCapPercent: number;
  applyPoints: boolean;
  onApplyPointsChange: (apply: boolean) => void;
  addOnItems: AddOnItem[];
  productSubtotal: number;
  referral: string;
  onReferralChange: (code: string) => void;
  paymentEnabled: boolean;
  paymentSettings: PaymentSettingsDTO | undefined;
  paymentMethod: "full" | "partial";
  onPaymentMethodChange: (method: "full" | "partial") => void;
}

const Row = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    {children}
  </div>
);

const MethodOption = ({
  selected,
  onSelect,
  label,
  hint,
  amount,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
  amount: number;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
    )}
  >
    <span className="text-sm font-medium text-foreground">
      {label}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </span>
    <span className="text-sm font-semibold text-primary tabular-nums">{formatGHS(amount)}</span>
  </button>
);

/** Loyalty toggle, price breakdown, add-on lines and payment choice. */
export const BookingSummary = ({
  service,
  pricing: p,
  signedIn,
  availablePoints,
  loyaltyCapPercent,
  applyPoints,
  onApplyPointsChange,
  addOnItems,
  productSubtotal,
  referral,
  onReferralChange,
  paymentEnabled,
  paymentSettings,
  paymentMethod,
  onPaymentMethodChange,
}: BookingSummaryProps) => {
  const hasAddOns = addOnItems.length > 0;
  const depositPercent = paymentSettings?.deposit_percent ?? 50;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 bg-secondary/40 tabular-nums">
      {p.canUsePoints && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">Use my loyalty points</p>
            <p className="text-sm text-muted-foreground">
              You have {availablePoints.toLocaleString()} points. Save{" "}
              <span className="font-medium text-foreground">{formatGHS(p.discount)}</span>{" "}
              ({p.pointsToUse.toLocaleString()} pts) on this booking — up to{" "}
              {loyaltyCapPercent}% off.
            </p>
          </div>
          <Switch checked={applyPoints} onCheckedChange={onApplyPointsChange} />
        </div>
      )}

      <Row label="Service price">
        {p.onPromo ? (
          <span className="flex items-baseline gap-2">
            <span className="text-muted-foreground line-through">{formatGHS(service.price)}</span>
            <span className="text-foreground">{formatGHS(p.servicePrice)}</span>
            <span className="text-xs font-medium text-green-600">Promo</span>
          </span>
        ) : (
          <span className="text-foreground">{formatGHS(p.servicePrice)}</span>
        )}
      </Row>
      {p.effectiveApplyPoints && (
        <Row label="Points discount">
          <span className="text-green-600">− {formatGHS(p.discount)}</span>
        </Row>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="font-semibold text-foreground">
          {hasAddOns ? "Service" : "Amount due"}
        </span>
        <span
          className={hasAddOns ? "font-semibold text-foreground" : "text-xl font-bold text-primary"}
        >
          {formatGHS(p.amountDue)}
        </span>
      </div>

      {hasAddOns && (
        <>
          {addOnItems.map((i) => (
            <Row
              key={i.product.id}
              label={
                <>
                  {i.product.name} <span className="text-xs">x{i.qty}</span>
                </>
              }
            >
              <span className="text-foreground">
                {formatGHS(i.product.effective_price * i.qty)}
              </span>
            </Row>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Products</span>
            <span className="font-semibold text-foreground">{formatGHS(productSubtotal)}</span>
          </div>
          <div className="space-y-1 pt-1">
            <FormLabel htmlFor="referral" className="text-xs text-muted-foreground">
              Referral code (optional)
            </FormLabel>
            <Input
              id="referral"
              placeholder="Friend's code"
              value={referral}
              onChange={(e) => onReferralChange(e.target.value)}
            />
          </div>
          {!paymentEnabled && (
            <p className="text-xs text-muted-foreground">
              The service is settled at the studio; products are paid now.
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-semibold text-foreground">You'll pay now</span>
            <span className="text-xl font-bold text-primary">{formatGHS(p.bookingPayNow)}</span>
          </div>
        </>
      )}

      {/* Payment method — only when the admin requires payment. */}
      {paymentEnabled && (
        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Pay to confirm your booking</p>
          <div className="grid gap-2">
            {paymentSettings?.allow_full && (
              <MethodOption
                selected={paymentMethod === "full"}
                onSelect={() => onPaymentMethodChange("full")}
                label="Pay in full"
                amount={p.amountDue}
              />
            )}
            {paymentSettings?.allow_partial && (
              <MethodOption
                selected={paymentMethod === "partial"}
                onSelect={() => onPaymentMethodChange("partial")}
                label={`Pay ${depositPercent}% deposit`}
                hint={`${formatGHS(p.balanceAfterDeposit)} due at the studio`}
                amount={p.depositAmount}
              />
            )}
          </div>
          <Row label="You'll pay now">
            <span className="font-semibold text-foreground">{formatGHS(p.payNowAmount)}</span>
          </Row>
        </div>
      )}
      {!paymentEnabled && (
        <p className="text-xs text-muted-foreground">
          No payment needed to book — you'll settle at the studio.
        </p>
      )}
      {p.onPromo && (
        <p className="text-xs text-muted-foreground">
          This service is on promo — loyalty points can't be applied.
        </p>
      )}
      {!signedIn && (
        <p className="text-xs text-muted-foreground">
          Log in to earn and redeem loyalty points on your bookings.
        </p>
      )}
    </div>
  );
};
