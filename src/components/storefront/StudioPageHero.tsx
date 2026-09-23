import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/hero-beauty.jpg";

type Variant = "editorial" | "split" | "minimal" | "commerce" | "compact";

interface CTA {
  label: string;
  to: string;
}

interface StudioPageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  image?: string | null;
  variant?: Variant;
  cta?: CTA;
  secondaryCta?: CTA;
  className?: string;
}

const HEIGHTS: Record<Exclude<Variant, "split" | "minimal">, string> = {
  editorial: "min-h-[360px] md:min-h-[440px]",
  commerce: "min-h-[300px] md:min-h-[380px]",
  compact: "min-h-[180px] md:min-h-[220px]",
};

const CtaButtons = ({
  cta,
  secondaryCta,
}: {
  cta?: CTA;
  secondaryCta?: CTA;
}) =>
  cta || secondaryCta ? (
    <div className="animate-fade-in mt-7 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
      {cta && (
        <Button size="lg" className="group" asChild>
          <Link to={cta.to}>
            {cta.label}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      )}
      {secondaryCta && (
        <Button size="lg" variant="outline" asChild>
          <Link to={secondaryCta.to}>{secondaryCta.label}</Link>
        </Button>
      )}
    </div>
  ) : null;

const TextBlock = ({
  eyebrow,
  title,
  description,
  cta,
  secondaryCta,
  center,
}: Pick<StudioPageHeroProps, "eyebrow" | "title" | "description" | "cta" | "secondaryCta"> & {
  center?: boolean;
}) => (
  <div className={cn("max-w-xl", center && "mx-auto text-center")}>
    <span className="animate-fade-in inline-block text-sm font-medium uppercase tracking-[0.2em] text-primary">
      {eyebrow}
    </span>
    <h1 className="animate-fade-in mt-3 font-serif text-3xl font-bold leading-[1.08] text-foreground [animation-delay:120ms] sm:text-4xl md:text-5xl">
      {title}
    </h1>
    {description && (
      <p
        className={cn(
          "animate-fade-in mt-4 text-muted-foreground [animation-delay:240ms]",
          center ? "mx-auto max-w-xl" : "max-w-md",
        )}
      >
        {description}
      </p>
    )}
    <CtaButtons cta={cta} secondaryCta={secondaryCta} />
  </div>
);

/**
 * Shared storefront banner used across /services, /shop, /gallery, /cart so the
 * pages read as one design system while each keeps its own editorial hero.
 * Variants change height + composition; colours come from the studio theme.
 */
export const StudioPageHero = ({
  eyebrow,
  title,
  description,
  image,
  variant = "editorial",
  cta,
  secondaryCta,
  className,
}: StudioPageHeroProps) => {
  // Text over a full-bleed image (with a left-weighted scrim for legibility).
  if (variant === "editorial" || variant === "commerce" || variant === "compact") {
    const bg = image ?? heroFallback;
    return (
      <section
        className={cn(
          "relative flex items-center overflow-hidden",
          HEIGHTS[variant],
          className,
        )}
      >
        <img src={bg} alt="" className="animate-fade-in absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <TextBlock
            eyebrow={eyebrow}
            title={title}
            description={description}
            cta={cta}
            secondaryCta={secondaryCta}
          />
        </div>
      </section>
    );
  }

  // Text + image side by side.
  if (variant === "split") {
    return (
      <section className={cn("py-14 md:py-20", className)}>
        <div className="container mx-auto grid grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2">
          <TextBlock
            eyebrow={eyebrow}
            title={title}
            description={description}
            cta={cta}
            secondaryCta={secondaryCta}
          />
          <div className="animate-fade-in [animation-delay:200ms]">
            <img
              src={image ?? heroFallback}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  // Minimal: no image, centered, on the soft surface.
  return (
    <section className={cn("bg-secondary py-14 md:py-20", className)}>
      <div className="container mx-auto px-4">
        <TextBlock
          eyebrow={eyebrow}
          title={title}
          description={description}
          cta={cta}
          secondaryCta={secondaryCta}
          center
        />
      </div>
    </section>
  );
};
