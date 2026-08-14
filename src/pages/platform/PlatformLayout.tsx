import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, LogOut, Building2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";

const navItems = [
  { name: "Studios", path: "/platform", icon: Building2 },
  { name: "Requests", path: "/platform/requests", icon: Lightbulb },
];

export const PlatformLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    navigate("/platform/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/platform" className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
            <span className="font-serif text-lg font-semibold truncate">
              Platform Console
            </span>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="shrink-0"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 pb-2">
          {navItems.map((item) => {
            const active =
              item.path === "/platform"
                ? location.pathname === "/platform"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
};
