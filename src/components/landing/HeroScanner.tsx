import { memo, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import scannerStatue from "@/assets/scanner-statue.png";

// Facial analysis measurements with Greek ratios
const measurements = [
  { id: "fwhr", label: "FWHR", value: "1.89", x: 8, y: 38 },
  { id: "canthal", label: "Canthal Tilt", value: "+4.2°", x: 75, y: 32 },
  { id: "ipd", label: "IPD Ratio", value: "0.46", x: 75, y: 42 },
  { id: "jaw", label: "Jaw Angle", value: "118°", x: 8, y: 70 },
  { id: "philtrum", label: "Philtrum", value: "1.2cm", x: 75, y: 62 },
  { id: "symmetry", label: "Symmetry", value: "94.2%", x: 8, y: 22 },
];

// Key facial landmark points
const landmarkPoints = [
  // Eyes
  { id: 1, x: 35, y: 36, size: 4 },
  { id: 2, x: 42, y: 35, size: 4 },
  { id: 3, x: 58, y: 35, size: 4 },
  { id: 4, x: 65, y: 36, size: 4 },
  // Eyebrows
  { id: 5, x: 30, y: 30, size: 3 },
  { id: 6, x: 70, y: 30, size: 3 },
  // Nose
  { id: 7, x: 50, y: 45, size: 4 },
  { id: 8, x: 46, y: 52, size: 3 },
  { id: 9, x: 54, y: 52, size: 3 },
  // Lips
  { id: 10, x: 50, y: 62, size: 4 },
  { id: 11, x: 42, y: 60, size: 3 },
  { id: 12, x: 58, y: 60, size: 3 },
  // Jaw
  { id: 13, x: 30, y: 65, size: 3 },
  { id: 14, x: 70, y: 65, size: 3 },
  { id: 15, x: 50, y: 78, size: 4 },
  // Cheekbones
  { id: 16, x: 25, y: 48, size: 3 },
  { id: 17, x: 75, y: 48, size: 3 },
];

const HeroScanner = memo(() => {
  const shouldReduce = useReducedMotion();

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
          boxShadow: `0 0 ${point.size * 2}px hsl(var(--primary))`,
          animationDelay: `${index * 0.15}s`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  }, [shouldReduce]);

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/5]">
      {/* Scanner Frame */}
      <div className="absolute inset-0 rounded-2xl border border-primary/40 bg-background/80 overflow-hidden backdrop-blur-sm">
        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary rounded-tl" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary rounded-tr" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary rounded-bl" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary rounded-br" />

        {/* Real Face Image Container */}
        <div className="absolute inset-3 rounded-xl overflow-hidden">
          <img 
            src={scannerStatue} 
            alt="Face Analysis" 
            className="w-full h-full object-cover object-top grayscale-[30%]"
          />
          
          {/* Overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-background/40" />
          
          {/* Scanning Line */}
          {!shouldReduce && (
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-90 shadow-[0_0_15px_hsl(var(--primary))]" />
          )}

          {/* Landmark Points */}
          {points}

          {/* Greek Ratio Measurement Lines SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            {/* Vertical symmetry axis */}
            <line x1="50" y1="15" x2="50" y2="85" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.6" strokeDasharray="1 1" />
            
            {/* Horizontal thirds - Rule of thirds */}
            <line x1="20" y1="33" x2="80" y2="33" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            <line x1="20" y1="66" x2="80" y2="66" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            
            {/* Eye line - interpupillary distance */}
            <line x1="35" y1="36" x2="65" y2="36" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            <line x1="35" y1="34" x2="35" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            <line x1="65" y1="34" x2="65" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            
            {/* Canthal tilt lines */}
            <line x1="35" y1="36" x2="42" y2="34" stroke="hsl(142, 70%, 50%)" strokeWidth="0.4" strokeOpacity="0.8" />
            <line x1="58" y1="34" x2="65" y2="36" stroke="hsl(142, 70%, 50%)" strokeWidth="0.4" strokeOpacity="0.8" />
            
            {/* FWHR - Face Width to Height Ratio box */}
            <rect x="25" y="30" width="50" height="35" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" fill="none" strokeDasharray="3 2" />
            
            {/* Jaw angle lines */}
            <line x1="30" y1="65" x2="50" y2="78" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" />
            <line x1="70" y1="65" x2="50" y2="78" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" />
            
            {/* Cheekbone width */}
            <line x1="25" y1="48" x2="75" y2="48" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" strokeDasharray="2 1" />
            
            {/* Nose proportion lines */}
            <line x1="46" y1="52" x2="54" y2="52" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" />
            
            {/* Philtrum to chin ratio */}
            <line x1="50" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" />
            <line x1="50" y1="62" x2="50" y2="78" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" />
            
            {/* Golden ratio spiral hint - simplified arc */}
            <path d="M 30 30 Q 70 30, 70 55 Q 70 70, 50 78" stroke="hsl(45, 90%, 55%)" strokeWidth="0.3" strokeOpacity="0.4" fill="none" strokeDasharray="2 2" />
          </svg>

          {/* Measurement Labels */}
          {measurements.map((m) => (
            <div
              key={m.id}
              className="absolute text-[8px] font-mono bg-background/80 px-1.5 py-0.5 rounded border border-primary/30 backdrop-blur-sm"
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                transform: m.x < 50 ? "translateY(-50%)" : "translate(-100%, -50%)",
              }}
            >
              <span className="text-muted-foreground">{m.label}</span>
              <span className="text-primary ml-1 font-semibold">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-green-500 ${!shouldReduce ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] text-primary font-mono uppercase tracking-wider">Analysis Active</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-mono">17 Landmarks</span>
        </div>

        {/* Top status bar */}
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Golden Ratio Scan</span>
          <div className="flex items-center gap-1.5 bg-primary/20 px-2 py-0.5 rounded">
            <span className="text-[10px] text-primary font-mono font-bold">φ 1.618</span>
          </div>
        </div>
      </div>

      {/* Outer glow */}
      <div className="absolute -inset-6 rounded-3xl bg-primary/10 blur-3xl -z-10" />
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
