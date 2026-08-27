import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { StudioProvider } from "@/hooks/useStudio";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SessionGuard } from "@/components/SessionGuard";
import { StudioTheme } from "@/components/StudioTheme";
import { FeatureRoute } from "@/components/FeatureRoute";
import { PlatformAuthProvider } from "@/hooks/usePlatformAuth";
import { PlatformProtectedRoute } from "./pages/platform/PlatformProtectedRoute";
import { PlatformLayout } from "./pages/platform/PlatformLayout";

// Route components are code-split so each page loads on demand — the initial
// bundle stays small and the admin/platform areas never ship to customers.
const Index = lazy(() => import("./pages/Index"));
const Services = lazy(() => import("./pages/Services"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Book = lazy(() => import("./pages/Book"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderCallback = lazy(() => import("./pages/OrderCallback"));
const BookingCallback = lazy(() => import("./pages/BookingCallback"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Account = lazy(() => import("./pages/account/Account"));
const Reviews = lazy(() => import("./pages/Reviews"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminHours = lazy(() => import("./pages/admin/AdminHours"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminAppearance = lazy(() => import("./pages/admin/AdminAppearance"));
const AdminFeatureRequests = lazy(() => import("./pages/admin/AdminFeatureRequests"));
const AdminOnboarding = lazy(() => import("./pages/admin/AdminOnboarding"));
const AdminPromos = lazy(() => import("./pages/admin/AdminPromos"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminContact = lazy(() => import("./pages/admin/AdminContact"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductCategories = lazy(() => import("./pages/admin/AdminProductCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCommerce = lazy(() => import("./pages/admin/AdminCommerce"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const PlatformLogin = lazy(() => import("./pages/platform/PlatformLogin"));
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard"));
const PlatformStudioNew = lazy(() => import("./pages/platform/PlatformStudioNew"));
const PlatformStudioDetail = lazy(() => import("./pages/platform/PlatformStudioDetail"));
const PlatformRequests = lazy(() => import("./pages/platform/PlatformRequests"));
const PlatformAudit = lazy(() => import("./pages/platform/PlatformAudit"));
const StudioEntry = lazy(() => import("./pages/StudioEntry"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Guards all /admin/* pages once and keeps the sidebar mounted while a page's
// chunk loads (only the content area shows a spinner), so navigating between
// admin sections no longer flashes a blank full-screen loader.
const AdminOutlet = () => (
  <ProtectedRoute requireAdmin>
    <Suspense
      fallback={
        <AdminLayout>
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      }
    >
      <Outlet />
    </Suspense>
  </ProtectedRoute>
);

// Same pattern for the platform console: guard once, keep the chrome mounted
// while a page's chunk loads.
const PlatformOutlet = () => (
  <PlatformProtectedRoute>
    <Suspense
      fallback={
        <PlatformLayout>
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PlatformLayout>
      }
    >
      <Outlet />
    </Suspense>
  </PlatformProtectedRoute>
);

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
            <StudioTheme />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/s/:slug" element={<StudioEntry />} />
              <Route path="/services" element={<Services />} />
              <Route
                path="/gallery"
                element={
                  <FeatureRoute feature="gallery">
                    <Gallery />
                  </FeatureRoute>
                }
              />
              <Route path="/book" element={<Book />} />
              <Route
                path="/shop"
                element={
                  <FeatureRoute feature="commerce">
                    <Shop />
                  </FeatureRoute>
                }
              />
              <Route
                path="/shop/:id"
                element={
                  <FeatureRoute feature="commerce">
                    <ProductDetail />
                  </FeatureRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <FeatureRoute feature="commerce">
                    <Cart />
                  </FeatureRoute>
                }
              />
              <Route path="/order/callback" element={<OrderCallback />} />
              <Route path="/booking/callback" element={<BookingCallback />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/account" element={<Account />} />
              <Route
                path="/review"
                element={
                  <FeatureRoute feature="reviews">
                    <Reviews />
                  </FeatureRoute>
                }
              />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              
              {/* Admin Routes — one guard + persistent sidebar for all */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminOutlet />}>
                <Route index element={<AdminAppointments />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="hours" element={<AdminHours />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="appearance" element={<AdminAppearance />} />
                <Route path="promos" element={<AdminPromos />} />
                <Route path="feature-requests" element={<AdminFeatureRequests />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="contact" element={<AdminContact />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="product-categories" element={<AdminProductCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="commerce" element={<AdminCommerce />} />
              </Route>

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
                <Route element={<PlatformOutlet />}>
                  <Route index element={<PlatformDashboard />} />
                  <Route path="studios/new" element={<PlatformStudioNew />} />
                  <Route path="studios/:id" element={<PlatformStudioDetail />} />
                  <Route path="requests" element={<PlatformRequests />} />
                  <Route path="audit" element={<PlatformAudit />} />
                </Route>
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
   </StudioProvider>
  </QueryClientProvider>
);

export default App;
