import { useRef, useEffect, useState } from "react";
import { 
  Camera, 
  Brain, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Shield,
  Sparkles,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Camera,
    title: "Foto-Analyse",
    description: "Lade 1-3 Fotos hoch und erhalte eine präzise Bewertung deines Aussehens.",
  },
  {
    icon: Brain,
    title: "KI-Bewertung",
    description: "Unsere KI analysiert Gesichtssymmetrie, Jawline, Augen, Haut und mehr.",
  },
  {
    icon: Target,
    title: "Looks Score",
    description: "Erhalte einen objektiven Score von 1-10 mit detaillierter Aufschlüsselung.",
  },
  {
    icon: Sparkles,
    title: "Personalisierter Plan",
    description: "Individuelle Empfehlungen für Skincare, Haare, Fitness und Style.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Verfolge deine Entwicklung mit Vorher/Nachher-Vergleichen und Statistiken.",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen persönlichen Looksmaxing-Berater – 24/7.",
  },
];

const Features = () => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-24 overflow-hidden" id="features" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div 
          className={cn(
            "text-center max-w-2xl mx-auto mb-16 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 transition-all duration-500",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
            style={{ transitionDelay: "100ms" }}
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Alles was du brauchst für <span className="text-gradient">dein Glow-Up</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Moderne Tools, die dir helfen, das Beste aus deinem Aussehen herauszuholen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={cn(
                "group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-500 hover:-translate-y-2",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: isVisible ? `${200 + index * 100}ms` : "0ms" }}
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Static border glow */}
              <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div 
          className={cn(
            "flex items-center justify-center gap-2 mt-16 text-muted-foreground transition-all duration-700",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDelay: "900ms" }}
        >
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm">Deine Daten sind sicher und verschlüsselt</span>
        </div>
      </div>
    </section>
  );
};

export default Features;
