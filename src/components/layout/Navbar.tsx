import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sparkles, User, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { cartApi, commerceApi } from "@/lib/api";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Shop", path: "/shop" },
  { name: "Gallery", path: "/gallery" },
  { name: "Book Now", path: "/book" },
  { name: "Contact", path: "/contact" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { name: studioName, config, features } = useStudio();
  const logoUrl = config?.branding.logoUrl ?? null;

  // Hide the shop entirely when the admin has disabled it.
  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  // A module is visible only when the studio's feature flag allows it (and, for
  // the shop, when the studio has also turned commerce on in its settings).
  const shopEnabled = features.commerce && (commerce?.enabled ?? true);
  const visibleLinks = navLinks.filter((l) => {
    if (l.path === "/shop") return shopEnabled;
    if (l.path === "/gallery") return features.gallery;
    return true;
  });

  // Show a cart icon with a live item count for logged-in customers.
  const isCustomer = !!user && user.role !== "ADMIN";
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: isCustomer,
  });
  const cartCount = cart?.count ?? 0;

  const CartButton = () => (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link to="/cart" aria-label="Cart">
        <ShoppingBag className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {cartCount}
          </span>
        )}
      </Link>
    </Button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={studioName}
                className="h-8 w-8 rounded object-cover shrink-0"
              />
            ) : (
              <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:rotate-12 shrink-0" />
            )}
            <span className="truncate text-xl font-serif font-semibold text-foreground">
              {studioName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {link.name}
              </Link>
            ))}
            {isCustomer && shopEnabled && <CartButton />}
            <Button variant="ghost" size="icon" asChild>
              <Link to={user ? "/account" : "/login"}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isCustomer && shopEnabled && <CartButton />}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    location.pathname === link.path
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              {/* Account / Login on Mobile */}
              <Link
                to={user ? "/account" : "/login"}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors border-t border-border mt-1 pt-3",
                  location.pathname === (user ? "/account" : "/login")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <User className="h-5 w-5" />
                {user ? "My Account" : "Login"}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
