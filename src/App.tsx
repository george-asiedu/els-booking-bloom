import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { StudioProvider } from "@/hooks/useStudio";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SessionGuard } from "@/components/SessionGuard";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Book from "./pages/Book";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import OrderCallback from "./pages/OrderCallback";
import BookingCallback from "./pages/BookingCallback";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Account from "./pages/account/Account";
import Reviews from "./pages/Reviews";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminServices from "./pages/admin/AdminServices";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminHours from "./pages/admin/AdminHours";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAppearance from "./pages/admin/AdminAppearance";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminContact from "./pages/admin/AdminContact";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductCategories from "./pages/admin/AdminProductCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCommerce from "./pages/admin/AdminCommerce";
import PaymentCallback from "./pages/PaymentCallback";
import { PlatformAuthProvider } from "@/hooks/usePlatformAuth";
import { PlatformProtectedRoute } from "./pages/platform/PlatformProtectedRoute";
import PlatformLogin from "./pages/platform/PlatformLogin";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformStudioNew from "./pages/platform/PlatformStudioNew";
import PlatformStudioDetail from "./pages/platform/PlatformStudioDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reuse cached data across page visits; only refetch when it's stale or
      // a mutation invalidates it. Stops the same GET firing on every navigation.
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // keep unused data cached for 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
   <StudioProvider>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <SessionGuard />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/book" element={<Book />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order/callback" element={<OrderCallback />} />
              <Route path="/booking/callback" element={<BookingCallback />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/account" element={<Account />} />
              <Route path="/review" element={<Reviews />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              
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
                path="/admin/categories"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCategories />
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
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminReviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appearance"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAppearance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contact"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminContact />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/product-categories"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProductCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/commerce"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCommerce />
                  </ProtectedRoute>
                }
              />
              
              {/* Platform (super-admin) Routes — own auth session */}
              <Route
                path="/platform"
                element={
                  <PlatformAuthProvider>
                    <Outlet />
                  </PlatformAuthProvider>
                }
              >
                <Route path="login" element={<PlatformLogin />} />
                <Route
                  index
                  element={
                    <PlatformProtectedRoute>
                      <PlatformDashboard />
                    </PlatformProtectedRoute>
                  }
                />
                <Route
                  path="studios/new"
                  element={
                    <PlatformProtectedRoute>
                      <PlatformStudioNew />
                    </PlatformProtectedRoute>
                  }
                />
                <Route
                  path="studios/:id"
                  element={
                    <PlatformProtectedRoute>
                      <PlatformStudioDetail />
                    </PlatformProtectedRoute>
                  }
                />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
   </StudioProvider>
  </QueryClientProvider>
);

export default App;
