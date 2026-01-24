import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext";
import { AdminAccessProvider } from "./contexts/AdminAccessContext";
import { MaintenanceProvider, MaintenanceCheck } from "./components/MaintenanceGate";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Critical path - loaded immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DocumentTitleUpdater } from "./components/DocumentTitleUpdater";
import { FaviconUpdater } from "./components/FaviconUpdater";
import { MobileNavigation } from "./components/MobileNavigation";

// Lazy loaded pages - reduces initial bundle size significantly
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnalysisUpload = lazy(() => import("./pages/AnalysisUpload"));
const AnalysisResults = lazy(() => import("./pages/AnalysisResults"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Coach = lazy(() => import("./pages/Coach"));
const Plan = lazy(() => import("./pages/Plan"));
const Progress = lazy(() => import("./pages/Progress"));
const Features = lazy(() => import("./pages/Features"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Impressum = lazy(() => import("./pages/Impressum"));
const AGB = lazy(() => import("./pages/AGB"));
const ConfirmDeletion = lazy(() => import("./pages/ConfirmDeletion"));
const Support = lazy(() => import("./pages/Support"));
const RefundStatus = lazy(() => import("./pages/RefundStatus"));
const AdminPasswordReset = lazy(() => import("./pages/AdminPasswordReset"));

// Admin pages - lazy loaded since rarely accessed
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const SupportManagement = lazy(() => import("./pages/admin/SupportManagement"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const RevenueOverview = lazy(() => import("./pages/admin/RevenueOverview"));
const TestimonialsManagement = lazy(() => import("./pages/admin/TestimonialsManagement"));
const PromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const AdminPasswordManagement = lazy(() => import("./pages/admin/AdminPasswordManagement"));
const StripeCoupons = lazy(() => import("./pages/admin/StripeCoupons"));
const RefundManagement = lazy(() => import("./pages/admin/RefundManagement"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lightweight loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <SystemSettingsProvider>
          <TooltipProvider>
            <DocumentTitleUpdater />
            <FaviconUpdater />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AdminAccessProvider>
                <MaintenanceProvider>
                  <MaintenanceCheck>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Critical path - no lazy loading */}
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Lazy loaded routes */}
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/upload" element={<AnalysisUpload />} />
                        <Route path="/analysis/:id" element={<AnalysisResults />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/coach" element={<Coach />} />
                        <Route path="/plan" element={<Plan />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/refund-status" element={<RefundStatus />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/datenschutz" element={<Datenschutz />} />
                        <Route path="/impressum" element={<Impressum />} />
                        <Route path="/agb" element={<AGB />} />
                        <Route path="/confirm-deletion" element={<ConfirmDeletion />} />
                        <Route path="/admin-password-reset" element={<AdminPasswordReset />} />
                        
                        {/* Admin Routes - Protected by role */}
                        <Route 
                          path="/admin" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/users" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <UserManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/audit" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <AuditLogs />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/support" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <SupportManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/settings" 
                          element={
                            <ProtectedRoute requiredRole={["owner"]}>
                              <SystemSettings />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/billing" 
                          element={
                            <ProtectedRoute requiredRole={["owner"]}>
                              <RevenueOverview />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/testimonials" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <TestimonialsManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/promocodes" 
                          element={
                            <ProtectedRoute requiredRole={["owner"]}>
                              <PromoCodes />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/stripe-coupons" 
                          element={
                            <ProtectedRoute requiredRole={["owner"]}>
                              <StripeCoupons />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/passwords" 
                          element={
                            <ProtectedRoute requiredRole={["owner"]}>
                              <AdminPasswordManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/refunds" 
                          element={
                            <ProtectedRoute requiredRole={["admin", "owner"]}>
                              <RefundManagement />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <MobileNavigation />
                    <CookieConsent />
                  </MaintenanceCheck>
                </MaintenanceProvider>
              </AdminAccessProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SystemSettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
