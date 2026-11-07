import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useStudio } from "@/hooks/useStudio";
import { useAuth } from "@/hooks/useAuth";
import { cartApi, contactInfoApi, productCategoriesApi, promoApi } from "@/lib/api";
import { shopTemplateFor } from "@/lib/shopTemplates";
import { StudioMark } from "@/components/StudioMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { StudioPreviewExit } from "@/components/StudioPreviewExit";
import { cn } from "@/lib/utils";

/**
 * The shop website's frame (shop-website-design): a slim strip, a header with
 * categories, the shop's name in the middle, search and bag, and a footer.
 * Used by every shop page, for a Zuri Storefront and a Premium studio's shop.
 */
export const ShopLayout = ({ children }: { children: ReactNode }) => {
  const { name, config, features } = useStudio();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(() => new URLSearchParams(search).get("q") ?? "");
  const template = shopTemplateFor(config?.shopCategory);
  const booking = features.booking !== false;
  // A Storefront's shop is its home page; a studio's shop lives at /shop.
  const shopHome = booking ? "/shop" : "/";

  const { data: categories = [] } = useQuery({
    queryKey: ["public-product-categories"],
    queryFn: () => productCategoriesApi.listActive(),
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["promo-banners", "shop"],
    queryFn: () => promoApi.listActive("shop"),
    staleTime: 5 * 60 * 1000,
  });
  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
  const isCustomer = !!user && user.role !== "ADMIN";
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: isCustomer,
  });
  const count = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  const links = [
    // A studio's shop links back to the studio's own website.
    ...(booking ? [{ label: "Studio home", to: "/" }, { label: "Shop", to: shopHome }] : [{ label: "Home", to: shopHome }]),
    ...categories.slice(0, 4).map((c) => ({ label: c.name, to: `/shop/products?category=${c.slug}` })),
    { label: "All products", to: "/shop/products" },
  ];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate(`/shop/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };
  const isActive = (to: string) => pathname + search === to;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Strip: the shop's offer, else what the design promises. */}
      <div className="sticky top-0 z-40 bg-[linear-gradient(hsl(var(--primary)/0.15),hsl(var(--primary)/0.15)),linear-gradient(hsl(var(--background)),hsl(var(--background)))] px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-foreground">
        {promos[0]?.message ?? template.badges.join("  ·  ")}
      </div>

      <header className="sticky top-8 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 md:py-4">
          {/* Left: categories (desktop) or menu (mobile) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-2 md:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <nav className="hidden items-center gap-5 md:flex" aria-label="Shop">
              {links.slice(0, booking ? 6 : 5).map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "whitespace-nowrap text-sm transition-colors hover:text-foreground",
                    isActive(l.to) ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centre: the shop */}
          <Link to={shopHome} className="flex min-w-0 items-center justify-center gap-2">
            <StudioMark name={name} logoUrl={config?.branding.logoUrl} className="h-8 w-8" />
            <span
              className={cn(
                "truncate text-lg font-bold tracking-tight md:text-2xl",
                template.headingStyle === "serif" && "font-serif",
              )}
            >
              {name}
            </span>
          </Link>

          {/* Right: search, account, bag */}
          <div className="flex items-center justify-end gap-1">
            <form onSubmit={submit} className="relative hidden lg:block" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search products"
                className="h-9 w-52 rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </form>
            <ThemeToggle />
            <Link
              to={user ? "/account" : "/login"}
              className="hidden items-center gap-1.5 rounded-md p-2 text-sm hover:bg-accent sm:flex"
              aria-label={user ? "Your account" : "Log in"}
            >
              <User className="h-5 w-5" />
              <span className="hidden xl:inline">{user ? "Account" : "Login"}</span>
            </Link>
            <Link to="/wishlist" className="rounded-md p-2 hover:bg-accent" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link to="/cart" className="relative rounded-md p-2 hover:bg-accent" aria-label={`Bag, ${count} items`}>
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border md:hidden">
            <div className="container mx-auto space-y-1 px-4 py-4">
              <form onSubmit={submit} className="relative mb-3" role="search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="h-11 w-full rounded-full border border-input bg-background pl-9 pr-3 text-base outline-none"
                />
              </form>
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                  {l.label}
                </Link>
              ))}
              <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                {user ? "Your account" : "Log in"}
              </Link>
              {booking && (
                <Link to="/book" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium text-primary hover:bg-accent">
                  Book an appointment
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-10 bg-foreground text-background [&_.border-border]:border-background/15 [&_.text-muted-foreground]:text-background/65 [&_a:hover]:text-background dark:bg-card dark:text-foreground dark:[&_.border-border]:border-border dark:[&_.text-muted-foreground]:text-muted-foreground dark:[&_a:hover]:text-foreground">
        <div className="container mx-auto grid gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={cn("text-xl font-bold", template.headingStyle === "serif" && "font-serif")}>{name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{template.subtext}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Shop</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Your account</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to={user ? "/account" : "/login"} className="hover:text-foreground">{user ? "Orders and points" : "Log in"}</Link></li>
              <li><Link to="/cart" className="hover:text-foreground">Your bag</Link></li>
                          </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Get in touch</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {contact?.showPhone && contact.phone && <li><a href={`tel:${contact.phone}`} className="hover:text-foreground">{contact.phone}</a></li>}
              {contact?.showEmail && contact.email && <li><a href={`mailto:${contact.email}`} className="hover:text-foreground">{contact.email}</a></li>}
              {contact?.showAddress && contact.address && <li>{contact.address}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {name}</span>
            <a href="https://zuristudios.com" target="_blank" rel="noreferrer" className="hover:text-foreground">Powered by Zuri Studios</a>
          </div>
        </div>
      </footer>
      <FloatingActions />
      <StudioPreviewExit />
    </div>
  );
};
