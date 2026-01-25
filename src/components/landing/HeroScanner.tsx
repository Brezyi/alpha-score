import { memo, useMemo, useState, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import scannerStatue from "@/assets/scanner-statue.png";

// Key measurements - positioned for the statue
const measurements = [
  { id: "fwhr", label: "FWHR", finalValue: 1.92, decimals: 2, suffix: "", x: 2, y: 28 },
  { id: "canthal", label: "Canthal Tilt", finalValue: 5.1, decimals: 1, suffix: "°", prefix: "+", x: 82, y: 24 },
  { id: "ipd", label: "IPD", finalValue: 46.2, decimals: 1, suffix: "mm", x: 82, y: 35 },
  { id: "jaw", label: "Gonial Angle", finalValue: 125, decimals: 0, suffix: "°", x: 2, y: 52 },
  { id: "symmetry", label: "Symmetry", finalValue: 97.8, decimals: 1, suffix: "%", x: 82, y: 52 },
];

// Landmark points precisely on the statue's features
const landmarkPoints = [
  // Forehead
  { id: 1, x: 50, y: 8, size: 3 },
  // Eyebrows
  { id: 2, x: 36, y: 20, size: 3 },
  { id: 3, x: 64, y: 20, size: 3 },
  // Eyes - inner corners
  { id: 4, x: 42, y: 25, size: 4 },
  { id: 5, x: 58, y: 25, size: 4 },
  // Eyes - outer corners  
  { id: 6, x: 34, y: 26, size: 4 },
  { id: 7, x: 66, y: 26, size: 4 },
  // Nose bridge
  { id: 8, x: 50, y: 30, size: 3 },
  // Nose tip
  { id: 9, x: 50, y: 38, size: 4 },
  // Nostrils
  { id: 10, x: 45, y: 40, size: 3 },
  { id: 11, x: 55, y: 40, size: 3 },
  // Lips
  { id: 12, x: 50, y: 47, size: 4 },
  // Jaw - gonion points
  { id: 13, x: 28, y: 48, size: 4 },
  { id: 14, x: 72, y: 48, size: 4 },
  // Chin
  { id: 15, x: 50, y: 58, size: 4 },
];

// Animated counter hook
const useAnimatedCounter = (finalValue: number, duration: number = 2000, delay: number = 0, decimals: number = 2) => {
  const [value, setValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now() + delay;
    
    const animate = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(animate);
        return;
      }
      
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * finalValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [finalValue, duration, delay]);
  
  return value.toFixed(decimals);
};

// Simple animated value display
const AnimatedValue = memo(({ 
  finalValue, 
  decimals, 
  delay 
}: { 
  finalValue: number;
  decimals: number;
  delay: number;
}) => {
  const animatedValue = useAnimatedCounter(finalValue, 1800, delay, decimals);
  return <>{animatedValue}</>;
});

AnimatedValue.displayName = "AnimatedValue";

const HeroScanner = memo(() => {
  const shouldReduce = useReducedMotion();
  const [scanCycle, setScanCycle] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [scoreValue, setScoreValue] = useState(0);

  // No repeating cycle - animations run once and stay

  // Show score immediately and animate it
  useEffect(() => {
    setShowScore(true);
    
    // Animate score value
    const finalScore = 9.4;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScoreValue(eased * finalScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const points = useMemo(() => {
    return landmarkPoints.map((point, index) => (
      <div
        key={point.id}
        className={`absolute rounded-full bg-primary ${!shouldReduce ? 'animate-scanner-point' : ''}`}
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: point.size,
          height: point.size,
          boxShadow: `0 0 ${point.size * 2}px hsl(var(--primary)), 0 0 ${point.size * 4}px hsl(var(--primary) / 0.5)`,
          animationDelay: `${index * 0.15}s`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  }, [shouldReduce]);

  return (
    <div className="relative w-full max-w-lg lg:max-w-2xl mx-auto px-2 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Left measurements - hidden on mobile */}
        <div className="hidden md:flex flex-col gap-2 lg:gap-3 w-20 lg:w-24">
          {measurements.filter(m => m.x < 50).map((m, index) => (
            <div
              key={`${m.id}-${scanCycle}`}
              className="text-right font-mono bg-background/95 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-primary/40 backdrop-blur-sm"
            >
              <div className="text-muted-foreground text-[9px] lg:text-[10px] uppercase tracking-wider">{m.label}</div>
              <div className="text-primary font-bold tabular-nums text-xs lg:text-sm">
                {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 250} />{m.suffix}
              </div>
            </div>
          ))}
        </div>

        {/* Scanner Frame */}
        <div className="relative flex-1 aspect-[3/4] max-w-[280px] sm:max-w-sm mx-auto">
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-primary/60 bg-background/95 overflow-hidden backdrop-blur-sm shadow-2xl shadow-primary/10">
            {/* Corner Brackets */}
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-primary rounded-tl" />
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-primary rounded-tr" />
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-primary rounded-bl" />
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-b-2 border-primary rounded-br" />

            {/* Face Image Container */}
            <div className="absolute inset-2 sm:inset-3 rounded-lg sm:rounded-xl overflow-hidden">
              <img 
                src={scannerStatue} 
                alt="Face Analysis" 
                className="w-full h-full object-cover object-top"
              />
              
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/10" />
              
              {/* Scanning Line */}
              {!shouldReduce && (
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-90 shadow-[0_0_15px_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.5)]" />
              )}
            </div>

            {/* Bottom status bar */}
            <div className="absolute bottom-1.5 sm:bottom-2 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary ${!shouldReduce ? 'animate-pulse' : ''}`} />
                <span className="text-[8px] sm:text-[9px] text-primary/80 font-mono uppercase tracking-wider">Scanning</span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono">15 Landmarks</span>
            </div>

            {/* Top status bar */}
            <div className="absolute top-1.5 sm:top-2 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between">
              <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono uppercase tracking-wider">AI Analysis</span>
              <div className="flex items-center gap-1 bg-primary/20 px-1.5 sm:px-2 py-0.5 rounded border border-primary/30">
                <span className="text-[9px] sm:text-[10px] text-primary font-mono font-bold">φ 1.618</span>
              </div>
            </div>
          </div>

          {/* Outer glow effect - smaller on mobile */}
          <div className="absolute -inset-4 sm:-inset-6 rounded-2xl sm:rounded-3xl bg-primary/8 blur-2xl sm:blur-3xl -z-10" />
        </div>

        {/* Right measurements - hidden on mobile */}
        <div className="hidden md:flex flex-col gap-2 lg:gap-3 w-20 lg:w-24">
          {measurements.filter(m => m.x >= 50).map((m, index) => (
            <div
              key={`${m.id}-${scanCycle}`}
              className="text-left font-mono bg-background/95 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-primary/40 backdrop-blur-sm"
            >
              <div className="text-muted-foreground text-[9px] lg:text-[10px] uppercase tracking-wider">{m.label}</div>
              <div className="text-primary font-bold tabular-nums text-xs lg:text-sm">
                {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 250} />{m.suffix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile measurements - below image - compact grid */}
      <div className="grid grid-cols-3 md:hidden gap-1.5 sm:gap-2 mt-4">
        {measurements.slice(0, 3).map((m, index) => (
          <div
            key={`${m.id}-mobile-${scanCycle}`}
            className="font-mono bg-background/95 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-primary/40 backdrop-blur-sm text-center"
          >
            <div className="text-muted-foreground text-[8px] sm:text-[9px] uppercase tracking-wider truncate">{m.label}</div>
            <div className="text-primary font-bold tabular-nums text-[11px] sm:text-xs">
              {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 150} />{m.suffix}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:hidden gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 max-w-[200px] sm:max-w-[240px] mx-auto">
        {measurements.slice(3).map((m, index) => (
          <div
            key={`${m.id}-mobile2-${scanCycle}`}
            className="font-mono bg-background/95 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-primary/40 backdrop-blur-sm text-center"
          >
            <div className="text-muted-foreground text-[8px] sm:text-[9px] uppercase tracking-wider truncate">{m.label}</div>
            <div className="text-primary font-bold tabular-nums text-[11px] sm:text-xs">
              {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={(index + 3) * 150} />{m.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Final Score - Below Scanner */}
      {showScore && (
        <div className="flex justify-center mt-4 sm:mt-6 animate-fade-in">
          <div className="relative">
            {/* Glow rings - smaller on mobile */}
            <div className="absolute inset-0 -m-4 sm:-m-6 rounded-full bg-primary/20 blur-xl sm:blur-2xl animate-pulse" />
            <div className="absolute inset-0 -m-2 sm:-m-3 rounded-full bg-primary/30 blur-lg sm:blur-xl" />
            
            {/* Score container */}
            <div className="relative bg-background/95 backdrop-blur-md px-5 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--primary)/0.2)] sm:shadow-[0_0_30px_hsl(var(--primary)/0.4),0_0_60px_hsl(var(--primary)/0.2)]">
              <div className="text-[10px] sm:text-[11px] text-muted-foreground font-mono uppercase tracking-widest text-center mb-0.5 sm:mb-1">
                Looks Score
              </div>
              <div className="flex items-baseline justify-center gap-0.5 sm:gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-primary tabular-nums drop-shadow-[0_0_10px_hsl(var(--primary))]">
                  {scoreValue.toFixed(1)}
                </span>
                <span className="text-lg sm:text-xl text-muted-foreground font-medium">/10</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                <span className="text-[9px] sm:text-[10px] text-primary font-mono uppercase tracking-wide">Scan Complete</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
