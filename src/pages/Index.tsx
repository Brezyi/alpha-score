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

// Check native platform immediately at module level (before React renders)
const IS_NATIVE_PLATFORM = Capacitor.isNativePlatform();
const NATIVE_PLATFORM = Capacitor.getPlatform();

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // On native platforms, skip landing page and go directly to app
    if (IS_NATIVE_PLATFORM && !loading && !hasRedirected) {
      setHasRedirected(true);
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [loading, user, navigate, hasRedirected]);

  // On native platforms, show loading immediately and wait for redirect
  if (IS_NATIVE_PLATFORM) {
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
