import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import type { ProductDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** One product in a shop grid: photo, name, category, price (with offer). */
export const ProductCard = ({
  product,
  badge,
  large = false,
  className,
}: {
  product: ProductDTO;
  badge?: string;
  large?: boolean;
  className?: string;
}) => (
  <Link to={`/shop/${product.id}`} className={cn("group flex flex-col bg-card", className)}>
    <div className={cn("relative overflow-hidden bg-muted", large ? "aspect-[4/5]" : "aspect-square")}>
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="h-8 w-8" aria-hidden />
        </div>
      )}
      {(badge || product.on_promo || !product.in_stock) && (
        <span
          className={cn(
            "absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-semibold",
            !product.in_stock ? "bg-muted text-muted-foreground" : "bg-foreground text-background",
          )}
        >
          {!product.in_stock ? "Sold out" : product.on_promo ? "Sale" : badge}
        </span>
      )}
    </div>
    <div className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
      <div className="min-w-0">
        <h3 className="line-clamp-1 text-sm font-semibold group-hover:underline">{product.name}</h3>
        {product.category && (
          <p className="line-clamp-1 text-xs capitalize text-muted-foreground">{product.category.replace(/-/g, " ")}</p>
        )}
      </div>
      <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
        {product.on_promo && (
          <span className="mr-1 block text-xs font-normal text-muted-foreground line-through">
            {formatGHS(product.price)}
          </span>
        )}
        {formatGHS(product.effective_price)}
      </p>
    </div>
  </Link>
);
