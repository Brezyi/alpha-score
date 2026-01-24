import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import beforeImage from "@/assets/transformation-before.jpg";
import afterImage from "@/assets/transformation-after.jpg";

const BeforeAfter = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden" id="transformation">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50" />

      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Transformation</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Sieh dein <span className="text-gradient">Potenzial</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Unsere KI zeigt dir, wie du mit den richtigen Verbesserungen aussehen könntest.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Before/After Slider */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            ref={containerRef}
            className="relative aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden cursor-ew-resize select-none glow-box"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            {/* Before Image (Background) */}
            <div className="absolute inset-0">
              <img 
                src={beforeImage} 
                alt="Vorher" 
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Score Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
                <span className="text-muted-foreground text-sm font-bold">Score: 5.2</span>
              </div>
            </div>

            {/* After Image (Overlay with clip) */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img 
                src={afterImage} 
                alt="Nachher" 
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Score Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-primary/80 backdrop-blur-sm">
                <span className="text-primary-foreground text-sm font-bold">Score: 7.4</span>
              </div>
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <div className="flex gap-0.5">
                  <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-600" />
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-600" />
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
              Vorher
            </div>
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-primary/80 backdrop-blur-sm text-primary-foreground text-sm font-medium">
              Nachher
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Score Improvement Card */}
            <div className="p-6 rounded-2xl glass-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">+2.2 Punkte</h3>
                  <p className="text-muted-foreground text-sm">Durchschnittliche Verbesserung</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Skincare Routine", value: "+0.8" },
                  { label: "Hairstyle Optimierung", value: "+0.6" },
                  { label: "Fitness & Body", value: "+0.5" },
                  { label: "Style & Grooming", value: "+0.3" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-primary">{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Link to="/register">
                <Button variant="hero" size="lg" className="w-full group">
                  Entdecke dein Potenzial
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Erste Analyse kostenlos • Keine Kreditkarte nötig
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;
