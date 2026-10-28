import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

      {/* Hero: photo, studio name, headline and the booking button, like a
          studio's real homepage. */}
      <div className="relative isolate overflow-hidden">
        <img src={studio.gallery[0]} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: brand }}
            >
              {studio.name.charAt(0)}
            </span>
            <span className="truncate font-serif text-sm font-semibold">{studio.name}</span>
          </span>
          <span className="hidden gap-3 text-[10px] text-white/80 sm:flex">
            <span>Services</span>
            <span>Gallery</span>
            <span>Contact</span>
          </span>
        </div>
        <div className="px-4 pb-6 pt-4 text-white">
          <p className="max-w-[14rem] font-serif text-xl font-semibold leading-tight">
            Book your next {studio.tags[0].toLowerCase()} appointment in a minute.
          </p>
          <span
            className="mt-3 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            Book an appointment
          </span>
        </div>
      </div>

      {/* Why choose us */}
      <div className="grid grid-cols-3 gap-2 border-b border-border px-4 py-3 text-center text-[10px] font-medium">
        {["Skilled team", "Clean and safe", "On time"].map((r) => (
          <span key={r} className="flex flex-col items-center gap-1">
            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: brandSoft, boxShadow: `inset 0 0 0 1.5px ${brand}` }} />
            {r}
          </span>
        ))}
      </div>

      {/* Featured services */}
      <div className="p-4">
        <p className="text-center font-serif text-sm font-semibold">Our featured services</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {studio.gallery.map((src, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border">
              <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <div className="p-1.5">
                <p className="truncate text-[10px] font-semibold">{studio.tags[i] ?? studio.featured.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {GHS(i === 0 ? studio.featured.price : studio.featured.price - 40 * i)}
                </p>
              </div>
            </div>
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
