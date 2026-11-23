import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

const AUTO_DISMISS_MS = 5000;

// An invisible animated bar is the clock. When its animation finishes the toast
// closes, and anything that pauses the bar (hovering the toast, or keyboard
// focus inside it) pauses the close too. Radix's own timer is switched off
// (duration Infinity): it also pauses whenever the browser window loses focus,
// e.g. a click into DevTools, and a toast that arrived while the window was
// unfocused never started its timer at all, so the bar ran out and the toast
// stayed.

type ToastKind = "default" | "success" | "info" | "warning" | "destructive";

// Icon + colour per toast type. Only the icon carries the colour.
const TYPE: Record<ToastKind, { icon: LucideIcon; varName: string }> = {
  default: { icon: CheckCircle2, varName: "--toast-success" },
  success: { icon: CheckCircle2, varName: "--toast-success" },
  info: { icon: Info, varName: "--toast-info" },
  warning: { icon: AlertTriangle, varName: "--toast-warning" },
  destructive: { icon: XCircle, varName: "--toast-error" },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider duration={Infinity}>
      {toasts.map(function ({ id, title, description, variant, action: _action, ...props }) {
        const kind = (variant ?? "default") as ToastKind;
        const { icon: Icon, varName } = TYPE[kind] ?? TYPE.default;
        const color = `hsl(var(${varName}))`;
        // Errors are announced assertively; the rest politely.
        const type = kind === "destructive" ? "foreground" : "background";

        return (
          <Toast key={id} variant={variant} type={type} {...props}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} aria-hidden />

            <div className="grid flex-1 gap-1">
              {title && <ToastTitle className="text-[15px] font-medium leading-tight">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-[13px] leading-relaxed text-neutral-500 opacity-100 dark:text-neutral-400">
                  {description}
                </ToastDescription>
              )}
            </div>

            <ToastClose />

            {/* The invisible auto-dismiss clock: pauses on hover or focus, closes
                at the end. Opacity, not display:none, because a hidden element
                never fires animationend. */}
            <span
              aria-hidden
              onAnimationEnd={() => dismiss(id)}
              className="absolute inset-x-0 bottom-0 h-[3px] origin-left [animation:toast-progress_var(--toast-ms)_linear_forwards] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] opacity-0"
              style={
                {
                  "--toast-ms": `${AUTO_DISMISS_MS}ms`,
                } as React.CSSProperties
              }
            />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
