import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ordersApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";

const KEY = "zuri_coupon";
const stored = () => {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const store = (code: string) => {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* Without storage it's simply re-entered at checkout. */
  }
};

/** Coupon entry. The code carries from the basket to checkout for this visit. */
export const CouponBox = ({
  subtotal,
  onChange,
}: {
  subtotal: number;
  onChange: (coupon: { code: string; discount: number } | null) => void;
}) => {
  const [input, setInput] = useState(stored);
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = async (code: string, silent = false) => {
    setBusy(true);
    setError("");
    try {
      const result = await ordersApi.checkCoupon(code, subtotal);
      setApplied(result);
      setInput(result.code);
      store(result.code);
      onChange(result);
    } catch (e) {
      setApplied(null);
      store("");
      onChange(null);
      if (!silent) setError(e instanceof Error ? e.message : "That code isn't valid");
    } finally {
      setBusy(false);
    }
  };

  // Re-check when the basket changes: the discount and minimum depend on it.
  useEffect(() => {
    const code = stored();
    if (code && subtotal > 0) void check(code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  return (
    <div>
      {applied ? (
        <p className="flex items-center justify-between gap-3 text-sm">
          <span><span className="font-medium">{applied.code}</span> applied: -{formatGHS(applied.discount)}</span>
          <button
            type="button"
            className="text-xs underline underline-offset-2"
            onClick={() => { store(""); setApplied(null); setInput(""); onChange(null); }}
          >
            Remove
          </button>
        </p>
      ) : (
        <form
          className="flex"
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) void check(input.trim()); }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" className="rounded-none border-r-0 uppercase placeholder:normal-case" />
          <button type="submit" disabled={busy || !input.trim()} className="flex h-10 items-center bg-secondary px-4 text-sm font-medium disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        </form>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
};
