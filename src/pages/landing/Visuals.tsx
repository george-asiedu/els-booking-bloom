import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { GHS, DemoStudio } from "./content";

// ---------------------------------------------------------------------------
// Presentational storefront mockup (used in the hero + the studio showcase)
// ---------------------------------------------------------------------------
export const StorefrontMockup = ({
  studio,
  className,
}: {
  studio: DemoStudio;
  className?: string;
}) => {
  const brand = `hsl(${studio.accent})`;
  const brandSoft = `hsl(${studio.accent} / 0.12)`;
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

      <div className="p-5">
        {/* Studio header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            {studio.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-semibold leading-tight">
              {studio.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="flex" style={{ color: "hsl(var(--gold))" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </span>
              4.9 · 214 reviews
            </div>
          </div>
        </div>

        {/* Service chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {studio.tags.map((t, i) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={
                i === 0
                  ? { backgroundColor: brand, color: "#fff" }
                  : { backgroundColor: brandSoft, color: brand }
              }
            >
              {t}
            </span>
          ))}
        </div>

        {/* Featured service */}
        <div className="mt-4 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Featured
              </p>
              <p className="mt-0.5 font-semibold">{studio.featured.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {GHS(studio.featured.price)} · {studio.featured.duration}
              </p>
            </div>
          </div>
          <button
            className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-transform duration-200 hover:brightness-105"
            style={{ backgroundColor: brand }}
          >
            Book appointment
          </button>
        </div>

        {/* Gallery */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {studio.gallery.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </div>
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
