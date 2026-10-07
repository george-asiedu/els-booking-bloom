import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./content";

export const NavSection = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ---------------------------------------------------------------- Nav */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,padding] duration-300",
          scrolled
            ? "border-b border-border bg-background/80 py-2 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-background/40 py-4 backdrop-blur-sm",
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link to="/" className="animate-fade-in">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-[width] duration-300 group-hover:w-full" />
              </a>
            ))}
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/login">Studio login</Link>
            </Button>
            <Button size="sm" className="group" asChild>
              <Link to="/onboarding">
                Set up your studio
              </Link>
            </Button>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="p-1"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm hover:bg-secondary"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link to="/admin/login">Studio login</Link>
                </Button>
                <Button asChild>
                  <Link to="/onboarding">Set up your studio</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

    </>
  );
};
