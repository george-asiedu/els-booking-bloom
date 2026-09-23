import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
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

type ToastKind = "default" | "success" | "info" | "warning" | "destructive";

// Icon + accent CSS variable per toast type. The surface stays on the theme;
// only the icon + left accent carry the type colour.
const TYPE: Record<ToastKind, { icon: LucideIcon; varName: string }> = {
  default: { icon: CheckCircle2, varName: "--toast-success" },
  success: { icon: CheckCircle2, varName: "--toast-success" },
  info: { icon: Info, varName: "--toast-info" },
  warning: { icon: AlertTriangle, varName: "--toast-warning" },
  destructive: { icon: AlertCircle, varName: "--toast-error" },
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={AUTO_DISMISS_MS}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const kind = (variant ?? "default") as ToastKind;
        const { icon: Icon, varName } = TYPE[kind] ?? TYPE.default;
        const color = `hsl(var(${varName}))`;
        const soft = `hsl(var(${varName}) / 0.14)`;
        // Errors are announced assertively; the rest politely.
        const type = kind === "destructive" ? "foreground" : "background";

        return (
          <Toast key={id} variant={variant} type={type} {...props}>
            {/* Icon in a soft type-tinted circle */}
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-75"
              style={{ backgroundColor: soft, color }}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>

            <div className="grid flex-1 gap-0.5">
              {title && <ToastTitle className="text-[15px] font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />

            {/* Auto-dismiss progress bar (pauses on hover, matching Radix). */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[3px] origin-left [animation:toast-progress_var(--toast-ms)_linear_forwards] group-hover:[animation-play-state:paused] motion-reduce:hidden"
              style={
                {
                  backgroundColor: color,
                  opacity: 0.55,
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
