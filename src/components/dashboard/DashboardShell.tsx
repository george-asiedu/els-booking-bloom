import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  // Overrides path matching, e.g. for sections chosen by a query string.
  active?: boolean;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The frame every dashboard shares (studio admin, store admin, super admin):
 * a dark sidebar with grouped sections, the person at the bottom, and a top bar
 * for the page's own controls. Only the content area scrolls.
 */
export const DashboardShell = ({
  brand,
  groups,
  user,
  onSignOut,
  topBar,
  footerLink,
  banner,
  exact = [],
  children,
}: {
  brand: ReactNode;
  groups: NavGroup[];
  user: { name: string; email?: string; avatar?: ReactNode };
  onSignOut: () => void;
  topBar?: ReactNode;
  footerLink?: ReactNode;
  // A strip across the top of the content (billing reminders).
  banner?: ReactNode;
  // Paths that are only active on an exact match (e.g. "/admin").
  exact?: string[];
  children: ReactNode;
}) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path: string) =>
    exact.includes(path) ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const sidebar = (
    <div className="flex h-full flex-col bg-band text-band-foreground">
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
        {brand}
        <button type="button" className="rounded-md p-1.5 hover:bg-white/10 md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-band-foreground/45">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = item.active ?? isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-white/10 font-medium text-band-foreground"
                          : "text-band-foreground/70 hover:bg-white/5 hover:text-band-foreground",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge !== undefined && (
                        <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {footerLink && <div className="border-t border-white/10 px-5 py-3 text-sm">{footerLink}</div>}
      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        {user.avatar ?? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.email && <p className="truncate text-xs text-band-foreground/55">{user.email}</p>}
        </div>
        <button type="button" onClick={onSignOut} className="rounded-md p-2 text-band-foreground/70 hover:bg-white/10 hover:text-band-foreground" aria-label="Sign out" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <aside className="hidden w-64 shrink-0 md:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
          <button type="button" className="rounded-md p-2 hover:bg-accent md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {topBar}
            <ThemeToggle />
          </div>
        </header>
        {banner}
        {/* relative: chart tooltips and screen-reader text position against
            this scrolling area. */}
        <main className="relative min-w-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};
