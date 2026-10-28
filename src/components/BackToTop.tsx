import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** A round "back to top" button that appears once the page is scrolled. */
export const BackToTop = ({ className }: { className?: string }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-[opacity,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        show ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};
