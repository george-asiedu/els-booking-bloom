import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Menu, Phone, X } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { PLATFORM } from "@/config/platform";
import { whatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./content";

// "233203631199" -> "+233 20 363 1199"
const displayPhone = (digits: string) =>
  digits.startsWith("233") && digits.length === 12
    ? `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    : `+${digits}`;

/** WhatsApp, phone and email, above the nav. Sticks with it. */
const ContactStrip = () => {
  const wa = whatsappLink(
    PLATFORM.whatsapp,
    `Hi ${PLATFORM.name}, I'd like to know more.`,
  );
  return (
    <div className="bg-foreground text-background">
      <div className="container mx-auto flex items-center justify-center gap-5 px-4 py-2 text-xs sm:justify-end sm:gap-6">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <WhatsappIcon className="h-3.5 w-3.5" />{" "}
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
        {PLATFORM.whatsapp && (
          <a
            href={`tel:+${PLATFORM.whatsapp}`}
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />{" "}
            {displayPhone(PLATFORM.whatsapp)}
          </a>
        )}
        {PLATFORM.email && (
          <a
            href={`mailto:${PLATFORM.email}`}
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />{" "}
            <span className="hidden sm:inline">{PLATFORM.email}</span>
            <span className="sm:hidden">Email</span>
          </a>
        )}
      </div>
    </div>
  );
};

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
      <header className="fixed inset-x-0 top-0 z-50">
        <ContactStrip />
        <div
          className={cn(
            "transition-[background-color,border-color,box-shadow,padding] duration-300",
            scrolled || menuOpen
              ? "border-b border-border bg-background/80 py-2 shadow-sm backdrop-blur-xl"
              : // Over the hero photo: white text and icons so they read on it.
                "border-b border-transparent bg-transparent py-4 text-white [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/85",
          )}
        >
          <div className="container mx-auto flex items-center justify-between px-4">
            <Link to="/" className="animate-fade-in">
              <BrandLogo />
            </Link>
            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="group relative whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-[width] duration-300 group-hover:w-full" />
                </a>
              ))}
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/studio-login">Studio login</Link>
              </Button>
              <Button size="sm" className="group" asChild>
                <Link to="/onboarding">Set up your studio</Link>
              </Button>
            </nav>
            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="p-1"
              >
                {menuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
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
                    <Link to="/studio-login">Studio login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/onboarding">Set up your studio</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
