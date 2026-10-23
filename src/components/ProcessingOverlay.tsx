import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useStudio } from "@/hooks/useStudio";
import { studioStore } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

/**
 * The "Please wait" screen for money moments: setting up a payment, and
 * confirming one when the customer comes back from Paystack. Whose payment it
 * is shows at the top (the studio's logo, or the Zuri logo on the platform's
 * own pages), then a spinner and a plain sentence about what's happening.
 */

export interface ProcessingCopy {
  title?: string;
  message: string;
}

const BrandMark = () => {
  const { name, config } = useStudio();
  if (!studioStore.getSlug()) {
    return <img src="/zuri-lockup.png" alt="Zuri Studios" className="h-24 w-auto" />;
  }
  const logo = config?.branding.logoUrl;
  return (
    <div className="flex flex-col items-center gap-3">
      {logo && <img src={logo} alt="" className="h-16 w-16 rounded-xl object-cover" />}
      <p className="font-serif text-2xl font-semibold text-foreground">{name}</p>
    </div>
  );
};

/** The panel itself: used full-screen by the overlay and by result pages. */
export const ProcessingPanel = ({
  title = "Please wait",
  message,
  className,
}: ProcessingCopy & { className?: string }) => (
  <div className={cn("flex max-w-md flex-col items-center px-6 text-center", className)}>
    <BrandMark />
    <div
      className="mt-10 h-12 w-12 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary motion-reduce:animate-[spin_2.4s_linear_infinite]"
      aria-hidden
    />
    <h2 className="mt-8 text-2xl font-bold text-foreground">{title}</h2>
    <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{message}</p>
  </div>
);

// ---- the full-screen overlay ------------------------------------------------

interface ProcessingApi {
  /** Cover the screen with the panel until hide() is called. */
  show: (copy: ProcessingCopy) => void;
  hide: () => void;
}

const ProcessingContext = createContext<ProcessingApi | null>(null);

// Quick operations never flash the screen; once it does show, it stays long
// enough to read rather than blinking away.
const SHOW_AFTER_MS = 200;
const MIN_VISIBLE_MS = 700;

export const ProcessingProvider = ({ children }: { children: ReactNode }) => {
  const [copy, setCopy] = useState<ProcessingCopy | null>(null);
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  const showTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((next: ProcessingCopy) => {
    clearTimeout(hideTimer.current);
    setCopy(next);
    if (shownAt.current) return; // already up: just update the words
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      shownAt.current = Date.now();
      setVisible(true);
    }, SHOW_AFTER_MS);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    if (!shownAt.current) {
      setCopy(null);
      return;
    }
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    hideTimer.current = setTimeout(() => {
      shownAt.current = 0;
      setVisible(false);
      setCopy(null);
    }, wait);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  // Keep the page behind from scrolling while it's covered.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const api = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ProcessingContext.Provider value={api}>
      {children}
      {visible &&
        copy &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-busy="true"
            aria-live="polite"
            aria-label={copy.title ?? "Please wait"}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/75 backdrop-blur-md animate-in fade-in-0 duration-200"
          >
            <ProcessingPanel {...copy} />
          </div>,
          document.body,
        )}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = (): ProcessingApi => {
  const ctx = useContext(ProcessingContext);
  if (!ctx) throw new Error("useProcessing must be used inside ProcessingProvider");
  return ctx;
};

// Shared wording, so every payment reads the same way.
export const PROCESSING = {
  preparing: {
    message: "We're setting up your payment. This only takes a moment.",
  },
  booking: {
    message: "We're saving your booking and setting up your payment. This only takes a moment.",
  },
  creatingStudio: {
    message: "We're creating your studio and setting up your payment. This only takes a moment.",
  },
  confirming: {
    title: "Confirming your payment",
    message:
      "Your payment is being confirmed. This can take a few moments when it's busy. Please don't close or refresh this page.",
  },
} satisfies Record<string, ProcessingCopy>;
