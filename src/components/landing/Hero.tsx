import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      // Only update if we're in the hero section area for performance
      if (window.scrollY < window.innerHeight * 1.5) {
        setScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Gradient Orbs */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow will-change-transform"
        style={{ transform: `translate(-50%, ${scrollY * 0.15}px)` }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl animate-float will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.1}px)`, animationDelay: "1s" }}
      />
      <div 
        className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-primary/6 rounded-full blur-3xl animate-float will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.08}px)`, animationDelay: "2s" }}
      />
      
      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-50 will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      />
      
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float will-change-transform"
            style={{ 
              left: `${8 + (i * 8)}%`, 
              top: `${15 + ((i * 17) % 60)}%`,
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              backgroundColor: `hsl(var(--primary) / ${0.15 + (i % 4) * 0.08})`,
              animationDuration: `${4 + (i % 3) * 2}s`,
              animationDelay: `${i * 0.3}s`,
              transform: `translateY(${scrollY * (0.03 + i * 0.015)}px)`
            }}
          />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer"
            style={{
              top: `${25 + i * 25}%`,
              left: 0,
              right: 0,
              animationDuration: `${3 + i}s`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Pulsing Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 animate-pulse-ring"
            style={{
              width: `${300 + i * 200}px`,
              height: `${300 + i * 200}px`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: "4s"
            }}
          />
        ))}
      </div>
      
      {/* Grid Pattern - Dark Mode */}
      <div 
        className="absolute inset-0 dark:block hidden bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      />
      {/* Grid Pattern - Light Mode */}
      <div 
        className="absolute inset-0 dark:hidden block bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      />

      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: "100ms" }}
          >
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">KI-gestützte Looksmaxing Analyse</span>
          </div>

          {/* Main Headline with staggered animation */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
            <span 
              className={cn(
                "text-gradient glow-text inline-block transition-all duration-600",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "200ms" }}
            >
              Maximiere
            </span>
            <br />
            <span 
              className={cn(
                "text-foreground inline-block transition-all duration-600",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: "350ms" }}
            >
              dein Aussehen.
            </span>
          </h1>

          {/* Subheadline */}
          <p 
            className={cn(
              "text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: "500ms" }}
          >
            Systematisch. Messbar. Wissenschaftlich.
          </p>

          <p 
            className={cn(
              "text-lg text-muted-foreground/80 max-w-xl mx-auto mb-10 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: "600ms" }}
          >
            Deine KI für objektive Analyse und einen personalisierten Plan zur Optimierung deines Aussehens.
          </p>

          {/* CTA Buttons */}
          <div 
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: "700ms" }}
          >
            <Link to="/register">
              <Button variant="hero" size="xl" className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Kostenlos starten
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="glass" size="xl">
                Anmelden
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Scroll Indicator - CSS animation */}
      <div 
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce transition-opacity duration-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ transitionDelay: "900ms" }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
