import { Link } from "react-router-dom";
import { Heart, ImageOff } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { Stars } from "./Stars";
import type { ProductDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * A product in a shop grid: a rounded photo with the wishlist heart, then the
 * name and brand beside the price in a pill.
 */
export const ProductCard = ({
  product,
  badge,
  tall = false,
  className,
}: {
  product: ProductDTO;
  badge?: string;
  // Fill the available height (a big tile in a grid).
  tall?: boolean;
  className?: string;
}) => {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);
  const label = !product.in_stock ? "Sold out" : product.on_promo ? "Sale" : badge;
  return (
    <Link to={`/shop/${product.id}`} className={cn("group flex flex-col", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl bg-muted", tall ? "min-h-[20rem] flex-1" : "aspect-[3/4]")}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </div>
        )}
        {label && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              !product.in_stock ? "bg-background/90 text-muted-foreground" : product.on_promo ? "bg-primary text-primary-foreground" : "bg-band text-band-foreground",
            )}
          >
            {label}
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-transform hover:scale-105 active:scale-[0.96]"
        >
          <Heart className={cn("h-4 w-4", saved && "fill-current text-rose-500")} aria-hidden />
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {product.brand ?? product.category.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())}
          </p>
          {product.rating_average !== null && <Stars value={product.rating_average} count={product.rating_count} className="mt-1" />}
        </div>
        <p className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-right text-xs font-semibold tabular-nums">
          {product.on_promo && <span className="mr-1 font-normal text-muted-foreground line-through">{formatGHS(product.price)}</span>}
          {formatGHS(product.effective_price)}
        </p>
      </div>
    </Link>
  );
};

/** A row of up to four products under a heading (similar, recently viewed). */
export const ProductRow = ({ title, products }: { title: string; products: ProductDTO[] }) =>
  products.length ? (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-4">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  ) : null;

/** Home / Shop / Current trail at the top of shop pages. */
export const Breadcrumbs = ({ items }: { items: { label: string; to?: string }[] }) => (
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
    {items.map((c, i) => (
      <span key={c.label} className="flex items-center gap-1.5">
        {i > 0 && <span aria-hidden>/</span>}
        {c.to ? (
          <Link to={c.to} className="hover:text-foreground">{c.label}</Link>
        ) : (
          <span className="text-foreground">{c.label}</span>
        )}
      </span>
    ))}
  </nav>
);

// The shop's main action, solid and square-cornered as in the design.
export const SHOP_CTA =
  "inline-flex h-12 items-center justify-center bg-primary px-8 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-40";
