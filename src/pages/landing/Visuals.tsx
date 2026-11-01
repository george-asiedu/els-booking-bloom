import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DemoStudio } from "./content";

// ---------------------------------------------------------------------------
// Browser frame around a studio homepage (the studio showcase)
// ---------------------------------------------------------------------------
export const StorefrontMockup = ({
  studio,
  className,
}: {
  studio: DemoStudio;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        <div className="ml-2 flex-1 truncate rounded-md bg-background/80 px-3 py-1 text-center text-xs text-muted-foreground">
          {studio.slug}.zuristudios.com
        </div>
      </div>

      {/* A real capture of the studio homepage, so it always shows the design
          studios actually get: each uses a different layout and colour. */}
      <img
        src={studio.site}
        alt={`${studio.name}'s website`}
        loading="lazy"
        className="aspect-[4/5] w-full object-cover object-top"
      />
    </div>
  );
};

// A small floating status card that drifts gently around the hero mockup.
export const FloatCard = ({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "animate-float-card absolute z-10 flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur",
      className,
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// A progress bar that fills from 0 to `pct`% once scrolled into view.
export const Bar = ({ pct, className }: { pct: number; className?: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out motion-reduce:transition-none"
        style={{ width: on ? `${Math.min(100, pct)}%` : "0%" }}
      />
    </div>
  );
};


export const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href?: string; to?: string }[];
}) => (
  <div>
    <h4 className="mb-4 text-sm font-semibold">{title}</h4>
    <ul className="space-y-2.5 text-sm">
      {links.map((l) => (
        <li key={l.label}>
          {l.to ? (
            <Link to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ) : (
            <a href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);
