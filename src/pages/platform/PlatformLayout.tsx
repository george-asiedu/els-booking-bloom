import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";

export const PlatformLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = usePlatformAuth();
  const navigate = useNavigate();

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
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
};
