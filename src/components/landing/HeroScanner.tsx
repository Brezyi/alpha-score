import { memo, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import scannerStatue from "@/assets/scanner-statue.png";

// Facial analysis measurements with Greek ratios - adjusted for statue
const measurements = [
  { id: "fwhr", label: "FWHR", value: "1.92", x: 5, y: 32 },
  { id: "canthal", label: "Canthal Tilt", value: "+5.1°", x: 78, y: 28 },
  { id: "ipd", label: "IPD Ratio", value: "0.44", x: 78, y: 38 },
  { id: "jaw", label: "Jaw Angle", value: "125°", x: 5, y: 58 },
  { id: "gonion", label: "Gonion", value: "Perfect", x: 78, y: 52 },
  { id: "symmetry", label: "Symmetry", value: "97.8%", x: 5, y: 18 },
];

// Key facial landmark points - adjusted for the statue's features
const landmarkPoints = [
  // Eyes - hunter eyes position
  { id: 1, x: 38, y: 30, size: 5 },  // Left eye inner
  { id: 2, x: 44, y: 29, size: 5 },  // Left eye outer
  { id: 3, x: 56, y: 29, size: 5 },  // Right eye inner
  { id: 4, x: 62, y: 30, size: 5 },  // Right eye outer
  // Eyebrows - strong brow ridge
  { id: 5, x: 35, y: 25, size: 4 },
  { id: 6, x: 65, y: 25, size: 4 },
  { id: 7, x: 50, y: 24, size: 3 },  // Glabella
  // Nose bridge and tip
  { id: 8, x: 50, y: 35, size: 4 },  // Nose bridge
  { id: 9, x: 50, y: 42, size: 5 },  // Nose tip
  { id: 10, x: 46, y: 44, size: 3 }, // Left nostril
  { id: 11, x: 54, y: 44, size: 3 }, // Right nostril
  // Lips
  { id: 12, x: 50, y: 52, size: 4 }, // Upper lip center
  { id: 13, x: 44, y: 53, size: 3 }, // Left lip corner
  { id: 14, x: 56, y: 53, size: 3 }, // Right lip corner
  // Jaw - sharp jawline
  { id: 15, x: 32, y: 52, size: 4 }, // Left gonion
  { id: 16, x: 68, y: 52, size: 4 }, // Right gonion
  { id: 17, x: 50, y: 62, size: 5 }, // Chin
  // Cheekbones - high and defined
  { id: 18, x: 28, y: 38, size: 4 },
  { id: 19, x: 72, y: 38, size: 4 },
  // Forehead
  { id: 20, x: 50, y: 12, size: 4 },
  { id: 21, x: 35, y: 14, size: 3 },
  { id: 22, x: 65, y: 14, size: 3 },
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
          animationDelay: `${index * 0.12}s`,
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
            className="w-full h-full object-cover object-top"
          />
          
          {/* Overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
          
          {/* Scanning Line */}
          {!shouldReduce && (
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-90 shadow-[0_0_15px_hsl(var(--primary))]" />
          )}

          {/* Landmark Points */}
          {points}

          {/* Greek Ratio Measurement Lines SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            {/* Vertical symmetry axis */}
            <line x1="50" y1="8" x2="50" y2="68" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.6" strokeDasharray="1 1" />
            
            {/* Horizontal facial thirds */}
            <line x1="25" y1="25" x2="75" y2="25" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            <line x1="25" y1="42" x2="75" y2="42" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            <line x1="25" y1="52" x2="75" y2="52" stroke="hsl(var(--primary))" strokeWidth="0.25" strokeOpacity="0.4" strokeDasharray="2 2" />
            
            {/* Eye line - interpupillary distance */}
            <line x1="41" y1="29.5" x2="59" y2="29.5" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.8" />
            <line x1="41" y1="27" x2="41" y2="32" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            <line x1="59" y1="27" x2="59" y2="32" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            
            {/* Canthal tilt lines - positive tilt (hunter eyes) */}
            <line x1="38" y1="30" x2="44" y2="28" stroke="hsl(142, 70%, 50%)" strokeWidth="0.5" strokeOpacity="0.9" />
            <line x1="56" y1="28" x2="62" y2="30" stroke="hsl(142, 70%, 50%)" strokeWidth="0.5" strokeOpacity="0.9" />
            
            {/* FWHR - Face Width to Height Ratio box */}
            <rect x="28" y="25" width="44" height="27" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" fill="none" strokeDasharray="3 2" />
            
            {/* Jaw angle lines - sharp angular jaw */}
            <line x1="32" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            <line x1="68" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.7" />
            
            {/* Gonion markers */}
            <circle cx="32" cy="52" r="1.5" stroke="hsl(var(--primary))" strokeWidth="0.3" fill="none" strokeOpacity="0.6" />
            <circle cx="68" cy="52" r="1.5" stroke="hsl(var(--primary))" strokeWidth="0.3" fill="none" strokeOpacity="0.6" />
            
            {/* Cheekbone width line */}
            <line x1="28" y1="38" x2="72" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.5" strokeDasharray="2 1" />
            
            {/* Nose proportion - bridge to tip */}
            <line x1="50" y1="35" x2="50" y2="44" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" />
            <line x1="46" y1="44" x2="54" y2="44" stroke="hsl(var(--primary))" strokeWidth="0.35" strokeOpacity="0.6" />
            
            {/* Philtrum ratio */}
            <line x1="50" y1="44" x2="50" y2="52" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" />
            
            {/* Lower third - lip to chin */}
            <line x1="50" y1="52" x2="50" y2="62" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" />
            
            {/* Golden ratio spiral - adjusted to face */}
            <path d="M 35 14 Q 65 14, 72 38 Q 72 52, 50 62" stroke="hsl(45, 90%, 55%)" strokeWidth="0.35" strokeOpacity="0.5" fill="none" strokeDasharray="2 2" />
            
            {/* Brow ridge line */}
            <path d="M 35 25 Q 50 22, 65 25" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.5" fill="none" />
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
