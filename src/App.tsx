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
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AnalysisUpload from "./pages/AnalysisUpload";
import AnalysisResults from "./pages/AnalysisResults";
import PaymentSuccess from "./pages/PaymentSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Coach from "./pages/Coach";
import Plan from "./pages/Plan";
import Progress from "./pages/Progress";
import Features from "./pages/Features";
import PricingPage from "./pages/PricingPage";
import Datenschutz from "./pages/Datenschutz";
import Impressum from "./pages/Impressum";
import AGB from "./pages/AGB";
import NotFound from "./pages/NotFound";
import ConfirmDeletion from "./pages/ConfirmDeletion";
import CookieConsent from "./components/CookieConsent";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DocumentTitleUpdater } from "./components/DocumentTitleUpdater";
import { FaviconUpdater } from "./components/FaviconUpdater";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Support from "./pages/Support";
import SupportManagement from "./pages/admin/SupportManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import RevenueOverview from "./pages/admin/RevenueOverview";
import TestimonialsManagement from "./pages/admin/TestimonialsManagement";
import PromoCodes from "./pages/admin/PromoCodes";
import AdminPasswordReset from "./pages/AdminPasswordReset";
import AdminPasswordManagement from "./pages/admin/AdminPasswordManagement";
import StripeCoupons from "./pages/admin/StripeCoupons";
import RefundManagement from "./pages/admin/RefundManagement";
import RefundStatus from "./pages/RefundStatus";

const queryClient = new QueryClient();

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
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
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