import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Bereit dein Aussehen zu 
            <span className="text-gradient"> transformieren</span>?
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Schließe dich tausenden Männern an, die bereits ihr volles Potenzial entfaltet haben.
          </p>

          {/* CTA Button */}
          <Link to="/register">
            <Button variant="hero" size="xl" className="group">
              Jetzt kostenlos starten
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Trust Text */}
          <p className="text-sm text-muted-foreground mt-6">
            Keine Kreditkarte erforderlich · Sofortiger Zugang
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;