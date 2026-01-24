import { memo, useMemo, useState, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import scannerStatue from "@/assets/scanner-statue.png";

// Key measurements - reduced to most important
const measurements = [
  { id: "fwhr", label: "FWHR", finalValue: 1.92, decimals: 2, suffix: "", x: 3, y: 35 },
  { id: "canthal", label: "Canthal Tilt", finalValue: 5.1, decimals: 1, suffix: "°", prefix: "+", x: 80, y: 30 },
  { id: "jaw", label: "Jaw Angle", finalValue: 125, decimals: 0, suffix: "°", x: 3, y: 55 },
  { id: "symmetry", label: "Symmetry", finalValue: 97.8, decimals: 1, suffix: "%", x: 80, y: 48 },
];

// Reduced key landmark points - only essential
const landmarkPoints = [
  // Eyes corners only
  { id: 1, x: 38, y: 30, size: 4 },
  { id: 2, x: 45, y: 29, size: 4 },
  { id: 3, x: 55, y: 29, size: 4 },
  { id: 4, x: 62, y: 30, size: 4 },
  // Nose tip
  { id: 5, x: 50, y: 42, size: 4 },
  // Jaw points
  { id: 6, x: 32, y: 52, size: 4 },
  { id: 7, x: 68, y: 52, size: 4 },
  { id: 8, x: 50, y: 62, size: 4 },
];

// Animated counter hook
const useAnimatedCounter = (finalValue: number, duration: number = 2000, delay: number = 0, decimals: number = 2) => {
  const [value, setValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now() + delay;
    const endTime = startTime + duration;
    
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

// Single measurement label component
const AnimatedMeasurement = memo(({ 
  label, 
  finalValue, 
  decimals, 
  suffix = "", 
  prefix = "",
  x, 
  y, 
  delay 
}: { 
  label: string;
  finalValue: number;
  decimals: number;
  suffix?: string;
  prefix?: string;
  x: number;
  y: number;
  delay: number;
}) => {
  const animatedValue = useAnimatedCounter(finalValue, 2000, delay, decimals);
  
  return (
    <div
      className="absolute text-[9px] font-mono bg-background/90 px-2 py-1 rounded-md border border-primary/40 backdrop-blur-sm shadow-lg"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: x < 50 ? "translateY(-50%)" : "translate(-100%, -50%)",
      }}
    >
      <div className="text-muted-foreground text-[8px]">{label}</div>
      <div className="text-primary font-bold tabular-nums text-[11px]">
        {prefix}{animatedValue}{suffix}
      </div>
    </div>
  );
});

AnimatedMeasurement.displayName = "AnimatedMeasurement";

const HeroScanner = memo(() => {
  const shouldReduce = useReducedMotion();
  const [scanCycle, setScanCycle] = useState(0);

  // Reset animation cycle every 6 seconds
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
          boxShadow: `0 0 ${point.size * 3}px hsl(var(--primary))`,
          animationDelay: `${index * 0.2}s`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  }, [shouldReduce]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Scanner Frame */}
      <div className="absolute inset-0 rounded-2xl border-2 border-primary/50 bg-background/90 overflow-hidden backdrop-blur-sm shadow-2xl">
        {/* Corner Brackets - larger and more prominent */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary rounded-br-lg" />

        {/* Face Image Container */}
        <div className="absolute inset-4 rounded-xl overflow-hidden">
          <img 
            src={scannerStatue} 
            alt="Face Analysis" 
            className="w-full h-full object-cover object-top"
          />
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/20" />
          
          {/* Scanning Line */}
          {!shouldReduce && (
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-80 shadow-[0_0_20px_hsl(var(--primary)),0_0_40px_hsl(var(--primary)/0.5)]" />
          )}

          {/* Landmark Points */}
          {points}

          {/* Clean Measurement Lines SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            {/* Vertical symmetry axis */}
            <line x1="50" y1="15" x2="50" y2="65" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.4" strokeDasharray="2 3" />
            
            {/* Eye line - interpupillary distance */}
            <line x1="38" y1="29.5" x2="62" y2="29.5" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.6" />
            
            {/* Canthal tilt indicators */}
            <line x1="38" y1="30" x2="45" y2="28" stroke="hsl(142, 70%, 50%)" strokeWidth="0.6" strokeOpacity="0.8" />
            <line x1="55" y1="28" x2="62" y2="30" stroke="hsl(142, 70%, 50%)" strokeWidth="0.6" strokeOpacity="0.8" />
            
            {/* Jaw V-line */}
            <line x1="32" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="68" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.5" />
            
            {/* Golden ratio arc */}
            <path d="M 32 30 Q 68 30, 68 50 Q 68 58, 50 62" stroke="hsl(45, 90%, 55%)" strokeWidth="0.4" strokeOpacity="0.35" fill="none" strokeDasharray="3 3" />
          </svg>

          {/* Animated Measurement Labels */}
          {measurements.map((m, index) => (
            <AnimatedMeasurement
              key={`${m.id}-${scanCycle}`}
              label={m.label}
              finalValue={m.finalValue}
              decimals={m.decimals}
              suffix={m.suffix}
              prefix={m.prefix}
              x={m.x}
              y={m.y}
              delay={index * 300}
            />
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-green-500 ${!shouldReduce ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] text-primary/80 font-mono uppercase tracking-wider">Live Scan</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">8 Points</span>
        </div>

        {/* Top status bar */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Golden Ratio</span>
          <div className="flex items-center gap-1.5 bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
            <span className="text-[11px] text-primary font-mono font-bold">φ 1.618</span>
          </div>
        </div>
      </div>

      {/* Outer glow */}
      <div className="absolute -inset-8 rounded-3xl bg-primary/10 blur-3xl -z-10" />
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
