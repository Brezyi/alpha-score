import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import HeroScanner from "./HeroScanner";

const Hero = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();

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

  // Parallax scroll effect - disabled on mobile for performance
  useEffect(() => {
    if (shouldReduce) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY < window.innerHeight * 1.5) {
            setScrollY(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldReduce]);

  // Memoize particles to prevent re-renders
  const particles = useMemo(() => {
    if (shouldReduce) return null;
    return [...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-float will-change-transform"
        style={{ 
          left: `${10 + (i * 12)}%`, 
          top: `${20 + ((i * 17) % 50)}%`,
          width: `${4 + (i % 3) * 2}px`,
          height: `${4 + (i % 3) * 2}px`,
          backgroundColor: `hsl(var(--primary) / ${0.15 + (i % 3) * 0.1})`,
          animationDuration: `${5 + (i % 3) * 2}s`,
          animationDelay: `${i * 0.4}s`,
        }}
      />
    ));
  }, [shouldReduce]);

  // Memoize pulsing rings
  const pulsingRings = useMemo(() => {
    if (shouldReduce) return null;
    return [...Array(3)].map((_, i) => (
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
    ));
  }, [shouldReduce]);

  const parallaxY = shouldReduce ? 0 : scrollY;

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Static gradient background for mobile, animated for desktop */}
      <div 
        className={cn(
          "absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-primary/5 rounded-full blur-3xl",
          !shouldReduce && "animate-pulse-slow"
        )}
        style={shouldReduce ? {} : { transform: `translate(-50%, ${parallaxY * 0.15}px)` }}
      />
      
      {!shouldReduce && (
        <>
          <div 
            className="absolute top-1/3 right-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/8 rounded-full blur-3xl animate-float"
            style={{ transform: `translateY(${parallaxY * 0.1}px)`, animationDelay: "1s" }}
          />
          <div 
            className="absolute bottom-1/4 left-1/4 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-primary/6 rounded-full blur-3xl animate-float"
            style={{ transform: `translateY(${parallaxY * 0.08}px)`, animationDelay: "2s" }}
          />
        </>
      )}
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-50" />
      
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Floating Particles - desktop only */}
      {particles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          {particles}
        </div>
      )}

      {/* Pulsing Rings - desktop only */}
      {pulsingRings && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
          {pulsingRings}
        </div>
      )}
      
      {/* Grid Pattern - Dark Mode */}
      <div className="absolute inset-0 dark:block hidden bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      {/* Grid Pattern - Light Mode */}
      <div className="absolute inset-0 dark:hidden block bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="container relative z-10 px-4 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div 
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 transition-all",
                shouldReduce ? "opacity-100" : "duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={shouldReduce ? {} : { transitionDelay: "100ms" }}
            >
              <Zap className={cn("w-4 h-4 text-primary", !shouldReduce && "animate-pulse")} />
              <span className="text-sm text-muted-foreground">KI-gestützte Looksmaxing Analyse</span>
            </div>

            {/* Main Headline with staggered animation */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span 
                className={cn(
                  "text-gradient glow-text inline-block",
                  shouldReduce ? "opacity-100" : "transition-all duration-600",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={shouldReduce ? {} : { transitionDelay: "200ms" }}
              >
                Maximiere
              </span>
              <br />
              <span 
                className={cn(
                  "text-foreground inline-block",
                  shouldReduce ? "opacity-100" : "transition-all duration-600",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={shouldReduce ? {} : { transitionDelay: "350ms" }}
              >
                dein Aussehen.
              </span>
            </h1>

            {/* Subheadline */}
            <p 
              className={cn(
                "text-xl md:text-2xl text-muted-foreground max-w-2xl lg:max-w-none mb-4",
                shouldReduce ? "opacity-100" : "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={shouldReduce ? {} : { transitionDelay: "500ms" }}
            >
              Systematisch. Messbar. KI-gestützt.
            </p>

            <p 
              className={cn(
                "text-lg text-muted-foreground/80 max-w-xl lg:max-w-none mb-10",
                shouldReduce ? "opacity-100" : "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={shouldReduce ? {} : { transitionDelay: "600ms" }}
            >
              Deine KI für objektive Analyse und einen personalisierten Plan zur Optimierung deines Aussehens.
            </p>

            {/* CTA Buttons */}
            <div 
              className={cn(
                "flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-12 lg:mb-0",
                shouldReduce ? "opacity-100" : "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={shouldReduce ? {} : { transitionDelay: "700ms" }}
            >
              <Link to="/register">
                <Button variant="hero" size="xl" className="group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Kostenlos starten
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  {!shouldReduce && (
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  )}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="xl">
                  Anmelden
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Scanner visualization */}
          <div 
            className={cn(
              "hidden lg:block",
              shouldReduce ? "opacity-100" : "transition-all duration-700",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            )}
            style={shouldReduce ? {} : { transitionDelay: "400ms" }}
          >
            <HeroScanner />
          </div>
        </div>
      </div>

      {/* Scroll Indicator - CSS animation */}
      <div 
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2",
          shouldReduce ? "opacity-100" : "animate-bounce transition-opacity duration-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={shouldReduce ? {} : { transitionDelay: "900ms" }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className={cn("w-1.5 h-1.5 rounded-full bg-primary", !shouldReduce && "animate-pulse")} />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
