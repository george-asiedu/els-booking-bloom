import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Book from "./pages/Book";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminServices from "./pages/admin/AdminServices";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminHours from "./pages/admin/AdminHours";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/book" element={<Book />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/gallery"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGallery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hours"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminHours />
                  </ProtectedRoute>
                }
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
