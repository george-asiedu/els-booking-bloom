import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Scissors, 
  ImageIcon, 
  Clock, 
  LogOut, 
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "Appointments", path: "/admin", icon: Calendar },
  { name: "Services", path: "/admin/services", icon: Scissors },
  { name: "Gallery", path: "/admin/gallery", icon: ImageIcon },
  { name: "Hours", path: "/admin/hours", icon: Clock },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/admin" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-serif font-semibold hidden sm:inline">
                El's Beauty Studio
              </span>
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border min-h-[calc(100vh-57px)]">
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-border">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← View Public Site
            </Link>
          </div>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="fixed left-0 top-14 bottom-0 w-64 bg-background border-r border-border p-4">
              <nav>
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          location.pathname === item.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-4 pt-4 border-t border-border">
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ← View Public Site
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
