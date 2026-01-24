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

  useEffect(() => {
    if (shouldReduce) return;
    const interval = setInterval(() => {
      setScanCycle(c => c + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [shouldReduce]);

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
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        {/* Left measurements */}
        <div className="hidden sm:flex flex-col gap-3 w-24">
          {measurements.filter(m => m.x < 50).map((m, index) => (
            <div
              key={`${m.id}-${scanCycle}`}
              className="text-right font-mono bg-background/95 px-3 py-2 rounded-lg border border-primary/40 backdrop-blur-sm"
            >
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{m.label}</div>
              <div className="text-primary font-bold tabular-nums text-sm">
                {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 250} />{m.suffix}
              </div>
            </div>
          ))}
        </div>

        {/* Scanner Frame */}
        <div className="relative flex-1 aspect-[3/4] max-w-sm mx-auto">
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/60 bg-background/95 overflow-hidden backdrop-blur-sm shadow-2xl shadow-primary/10">
            {/* Corner Brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary rounded-tl" />
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary rounded-tr" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary rounded-bl" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary rounded-br" />

            {/* Face Image Container */}
            <div className="absolute inset-3 rounded-xl overflow-hidden">
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
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-green-500 ${!shouldReduce ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] text-primary/80 font-mono uppercase tracking-wider">Scanning</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">15 Landmarks</span>
            </div>

            {/* Top status bar */}
            <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">AI Analysis</span>
              <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded border border-primary/30">
                <span className="text-[10px] text-primary font-mono font-bold">φ 1.618</span>
              </div>
            </div>
          </div>

          {/* Outer glow effect */}
          <div className="absolute -inset-6 rounded-3xl bg-primary/8 blur-3xl -z-10" />
        </div>

        {/* Right measurements */}
        <div className="hidden sm:flex flex-col gap-3 w-24">
          {measurements.filter(m => m.x >= 50).map((m, index) => (
            <div
              key={`${m.id}-${scanCycle}`}
              className="text-left font-mono bg-background/95 px-3 py-2 rounded-lg border border-primary/40 backdrop-blur-sm"
            >
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{m.label}</div>
              <div className="text-primary font-bold tabular-nums text-sm">
                {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 250} />{m.suffix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile measurements - below image */}
      <div className="flex sm:hidden flex-wrap justify-center gap-2 mt-4">
        {measurements.map((m, index) => (
          <div
            key={`${m.id}-mobile-${scanCycle}`}
            className="font-mono bg-background/95 px-3 py-2 rounded-lg border border-primary/40 backdrop-blur-sm"
          >
            <div className="text-muted-foreground text-[9px] uppercase tracking-wider">{m.label}</div>
            <div className="text-primary font-bold tabular-nums text-xs">
              {m.prefix || ""}<AnimatedValue finalValue={m.finalValue} decimals={m.decimals} delay={index * 150} />{m.suffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
