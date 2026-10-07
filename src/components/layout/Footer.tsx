import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Phone, Mail, MapPin } from "lucide-react";
import { useStudio } from "@/hooks/useStudio";
import { contactInfoApi, servicesApi } from "@/lib/api";
import { StudioMark } from "@/components/StudioMark";
import { landingDefaults } from "@/lib/landingDefaults";

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-primary";

export const Footer = () => {
  const { name: studioName, config, features } = useStudio();
  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
  // Same query (and cache) as the home page's price list.
  const { data: services = [] } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });
  const popular = services.filter((s) => s.popular);
  const footerServices = (popular.length > 0 ? popular : services).slice(0, 4);

  const logoUrl = config?.branding.logoUrl ?? null;
  const tagline = config?.content.aboutText || landingDefaults(studioName).aboutText;

  const pages = [
    { label: "Services and prices", to: "/services" },
    ...(features.gallery ? [{ label: "Gallery", to: "/gallery" }] : []),
    ...(features.commerce ? [{ label: "Shop", to: "/shop" }] : []),
    { label: "Book an appointment", to: "/book" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex min-w-0 items-center gap-2">
              <StudioMark name={studioName} logoUrl={logoUrl} />
              <span className="truncate font-serif text-lg font-semibold text-foreground">
                {studioName}
              </span>
            </Link>
            <p className="line-clamp-4 text-sm text-muted-foreground">{tagline}</p>
          </div>

          <nav aria-label="Footer">
            <h4 className="mb-4 font-semibold text-foreground">Pages</h4>
            <ul className="space-y-2">
              {pages.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className={linkClass}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {footerServices.length > 0 && (
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Popular services</h4>
              <ul className="space-y-2">
                {footerServices.map((s) => (
                  <li key={s.id}>
                    <Link to="/services" className={linkClass}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3">
              {contact?.showPhone && contact.phone && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${contact.phone}`} className="hover:text-primary">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.showEmail && contact.email && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`mailto:${contact.email}`} className="break-all hover:text-primary">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.showInstagram && contact.instagram && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Instagram className="h-4 w-4 shrink-0 text-primary" />
                  <span>@{contact.instagram.replace(/^@/, "")}</span>
                </li>
              )}
              {contact?.showAddress && contact.address && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {studioName}
          </p>
          <div className="flex items-center gap-5">
            <Link to="/admin/login" className="transition-colors hover:text-primary">
              Studio login
            </Link>
            <a
              href="https://zuristudios.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs transition-colors hover:text-primary"
            >
              Made with Zuri Studios
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
