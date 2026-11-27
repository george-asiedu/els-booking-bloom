import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** The team member's own area: a staff account (or an owner who is also on the team). */
  staffArea?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, staffArea = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // A team member who wanders into the dashboard goes to their own page.
  if (requireAdmin && user.role === "STAFF") {
    return <Navigate to="/staff" replace />;
  }

  if (staffArea && user.role !== "STAFF" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have admin privileges to access this page.
          </p>
          <a href="/" className="text-primary hover:underline">
            Return to homepage
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
