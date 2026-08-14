import { Link } from "react-router-dom";
import { Sparkles, Instagram, Phone, Mail, MapPin } from "lucide-react";
import { useStudio } from "@/hooks/useStudio";

export const Footer = () => {
  const { name: studioName, config } = useStudio();
  const logoUrl = config?.branding.logoUrl ?? null;
  const tagline =
    config?.content.aboutText ||
    "Where beauty meets artistry. Specializing in stunning nails, lashes and hair that make you feel confident.";

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={studioName}
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              ) : (
                <Sparkles className="h-6 w-6 text-primary shrink-0" />
              )}
              <span className="truncate text-lg font-serif font-semibold text-foreground">
                {studioName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">{tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Services", "Gallery", "Book Now", "Contact"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(" ", "-")}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-2">
              {["Acrylic Nails", "Gel Manicure", "Classic Lashes", "Volume Lashes"].map((service) => (
                <li key={service}>
                  <span className="text-sm text-muted-foreground">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@elsbeauty.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Instagram className="h-4 w-4 text-primary" />
                <span>@elsbeautystudio</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>123 Beauty Lane, Suite 101</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {studioName}. All rights reserved.
          </p>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <Link
            to="/admin/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
};
