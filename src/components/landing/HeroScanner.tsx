import { memo, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import scannerFace from "@/assets/scanner-face.jpg";

// Analysis points positioned on the real face
const analysisPoints = [
  { id: 1, x: 28, y: 22, color: "hsl(var(--primary))", size: 8, delay: 0, label: "Stirn" },
  { id: 2, x: 72, y: 22, color: "hsl(270, 70%, 60%)", size: 7, delay: 0.5, label: "Stirn" },
  { id: 3, x: 32, y: 38, color: "hsl(200, 80%, 55%)", size: 8, delay: 1, label: "Auge" },
  { id: 4, x: 68, y: 38, color: "hsl(var(--primary))", size: 8, delay: 1.5, label: "Auge" },
  { id: 5, x: 50, y: 50, color: "hsl(280, 70%, 55%)", size: 7, delay: 2, label: "Nase" },
  { id: 6, x: 35, y: 58, color: "hsl(var(--primary))", size: 6, delay: 2.5, label: "Wange" },
  { id: 7, x: 65, y: 58, color: "hsl(220, 70%, 60%)", size: 6, delay: 3, label: "Wange" },
  { id: 8, x: 50, y: 72, color: "hsl(var(--primary))", size: 8, delay: 3.5, label: "Kiefer" },
];

const HeroScanner = memo(() => {
  const shouldReduce = useReducedMotion();

  const points = useMemo(() => {
    return analysisPoints.map((point) => (
      <div
        key={point.id}
        className="absolute rounded-full animate-scanner-point"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: point.size,
          height: point.size,
          backgroundColor: point.color,
          boxShadow: `0 0 ${point.size * 3}px ${point.color}`,
          animationDelay: `${point.delay}s`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  }, []);

  const staticPoints = useMemo(() => {
    return analysisPoints.map((point) => (
      <div
        key={point.id}
        className="absolute rounded-full"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: point.size,
          height: point.size,
          backgroundColor: point.color,
          boxShadow: `0 0 ${point.size * 3}px ${point.color}`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Scanner Frame */}
      <div className="absolute inset-0 rounded-2xl border border-primary/30 bg-background/50 overflow-hidden backdrop-blur-sm">
        {/* Corner Brackets */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary rounded-br-lg" />

        {/* Real Face Image */}
        <div className="absolute inset-4 rounded-xl overflow-hidden">
          <img 
            src={scannerFace} 
            alt="Face Analysis" 
            className="w-full h-full object-cover object-top"
          />
          
          {/* Dark overlay for better point visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
          
          {/* Scanning Line */}
          {!shouldReduce && (
            <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-80 shadow-[0_0_20px_hsl(var(--primary))]" />
          )}

          {/* Analysis Points */}
          {shouldReduce ? staticPoints : points}

          {/* Measurement lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
            {/* Eye-to-eye line */}
            <line x1="32" y1="38" x2="68" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.5" strokeDasharray="2 2" />
            {/* Symmetry line */}
            <line x1="50" y1="22" x2="50" y2="72" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.4" strokeDasharray="3 3" />
            {/* Cheek line */}
            <line x1="35" y1="58" x2="65" y2="58" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.4" strokeDasharray="2 2" />
            {/* Forehead */}
            <line x1="28" y1="22" x2="72" y2="22" stroke="hsl(var(--primary))" strokeWidth="0.4" strokeOpacity="0.3" strokeDasharray="2 2" />
          </svg>
        </div>

        {/* Scan status indicator */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-primary ${!shouldReduce ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] text-primary/70 font-mono uppercase tracking-wider">Analyzing</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">8 Points</span>
        </div>

        {/* Top status bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Face Scan</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-1 h-3 rounded-full bg-primary/60 ${!shouldReduce ? 'animate-pulse' : ''}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Outer glow */}
      <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl -z-10" />
    </div>
  );
});

HeroScanner.displayName = "HeroScanner";

export default HeroScanner;
