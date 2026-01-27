import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { Loader2 } from "lucide-react";
import { useNativePlatform } from "@/hooks/useNativePlatform";

// Check native platform immediately at module level (before React renders)
const IS_NATIVE_PLATFORM = Capacitor.isNativePlatform();
const NATIVE_PLATFORM = Capacitor.getPlatform();

console.log("[Index] Platform detection:", { IS_NATIVE_PLATFORM, NATIVE_PLATFORM });

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { shouldUseMobileLayout, isMobilePreview } = useNativePlatform();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Determine if we should use mobile behavior (native OR mobile preview mode)
  const useMobileBehavior = IS_NATIVE_PLATFORM || isMobilePreview;

  useEffect(() => {
    console.log("[Index] useEffect:", { IS_NATIVE_PLATFORM, isMobilePreview, loading, user: !!user, hasRedirected });
    
    // On native platforms or mobile preview, skip landing page and go directly to app
    if (useMobileBehavior && !loading && !hasRedirected) {
      setHasRedirected(true);
      if (user) {
        console.log("[Index] Redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        console.log("[Index] Redirecting to login");
        navigate("/login", { replace: true });
      }
    }
  }, [loading, user, navigate, hasRedirected, useMobileBehavior, isMobilePreview]);

  // On native platforms or mobile preview, show loading immediately and wait for redirect
  if (useMobileBehavior) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {loading ? "Lade..." : "Weiterleitung..."}
        </p>
      </div>
    );
  }

  // Desktop: Show full landing page
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <FeatureShowcase />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
