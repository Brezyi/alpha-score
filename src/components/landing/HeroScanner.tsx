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

// Measurement label component
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
  const animatedValue = useAnimatedCounter(finalValue, 1800, delay, decimals);
  
  return (
    <div
      className="absolute text-[8px] font-mono bg-background/95 px-2 py-1 rounded-md border border-primary/50 backdrop-blur-md shadow-lg"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: x < 50 ? "translateY(-50%)" : "translate(-100%, -50%)",
      }}
    >
      <div className="text-muted-foreground text-[7px] uppercase tracking-wider">{label}</div>
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
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Scanner Frame */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/20" />
          
          {/* Scanning Line */}
          {!shouldReduce && (
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-90 shadow-[0_0_15px_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.5)]" />
          )}

          {/* Landmark Points */}
          {points}

          {/* Measurement Lines SVG - precisely aligned */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            {/* Vertical symmetry axis */}
            <line x1="50" y1="5" x2="50" y2="60" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" strokeDasharray="1.5 2" />
            
            {/* Horizontal thirds */}
            <line x1="25" y1="25" x2="75" y2="25" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.3" strokeDasharray="2 2" />
            <line x1="25" y1="40" x2="75" y2="40" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.3" strokeDasharray="2 2" />
            
            {/* Eye line - connecting eye points */}
            <line x1="34" y1="26" x2="66" y2="26" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.6" />
            {/* Eye line end markers */}
            <line x1="34" y1="24" x2="34" y2="28" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.6" />
            <line x1="66" y1="24" x2="66" y2="28" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.6" />
            
            {/* Canthal tilt lines - from outer to inner eye corners */}
            <line x1="34" y1="26" x2="42" y2="25" stroke="hsl(142, 76%, 46%)" strokeWidth="0.5" strokeOpacity="0.9" />
            <line x1="58" y1="25" x2="66" y2="26" stroke="hsl(142, 76%, 46%)" strokeWidth="0.5" strokeOpacity="0.9" />
            
            {/* FWHR box - face width to height ratio */}
            <rect x="28" y="20" width="44" height="28" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.4" fill="none" strokeDasharray="3 2" rx="1" />
            
            {/* Nose bridge to tip */}
            <line x1="50" y1="30" x2="50" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.5" />
            
            {/* Nostril width */}
            <line x1="45" y1="40" x2="55" y2="40" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.5" />
            
            {/* Jaw V-lines - gonion to chin */}
            <line x1="28" y1="48" x2="50" y2="58" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.6" />
            <line x1="72" y1="48" x2="50" y2="58" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.6" />
            
            {/* Gonion angle arcs */}
            <path d="M 32 48 Q 28 52, 35 55" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.4" fill="none" />
            <path d="M 68 48 Q 72 52, 65 55" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.4" fill="none" />
            
            {/* Golden ratio spiral */}
            <path d="M 28 15 Q 72 15, 72 40 Q 72 52, 50 58" stroke="hsl(45, 100%, 50%)" strokeWidth="0.35" strokeOpacity="0.4" fill="none" strokeDasharray="2 2" />
            
            {/* Philtrum to chin */}
            <line x1="50" y1="40" x2="50" y2="58" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.35" strokeDasharray="1 1.5" />
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
              delay={index * 250}
            />
          ))}
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
          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Golden Ratio</span>
          <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded border border-primary/30">
            <span className="text-[10px] text-primary font-mono font-bold">φ 1.618</span>
          </div>
        </div>
      </div>

      {/* Outer glow effect */}
      <div className="absolute -inset-6 rounded-3xl bg-primary/8 blur-3xl -z-10" />
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
