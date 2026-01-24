import { memo, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Analysis points that move around the face
const analysisPoints = [
  { id: 1, x: 30, y: 25, color: "hsl(var(--primary))", size: 6, delay: 0 },
  { id: 2, x: 70, y: 28, color: "hsl(270, 70%, 60%)", size: 5, delay: 0.5 },
  { id: 3, x: 45, y: 45, color: "hsl(200, 80%, 55%)", size: 4, delay: 1 },
  { id: 4, x: 55, y: 42, color: "hsl(var(--primary))", size: 5, delay: 1.5 },
  { id: 5, x: 50, y: 65, color: "hsl(280, 70%, 55%)", size: 6, delay: 2 },
  { id: 6, x: 35, y: 55, color: "hsl(var(--primary))", size: 4, delay: 2.5 },
  { id: 7, x: 65, y: 58, color: "hsl(220, 70%, 60%)", size: 5, delay: 3 },
  { id: 8, x: 50, y: 30, color: "hsl(var(--primary))", size: 4, delay: 3.5 },
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
          boxShadow: `0 0 ${point.size * 2}px ${point.color}`,
          animationDelay: `${point.delay}s`,
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
          boxShadow: `0 0 ${point.size * 2}px ${point.color}`,
        }}
      />
    ));
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Scanner Frame */}
      <div className="absolute inset-0 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary/60 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary/60 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary/60 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary/60 rounded-br-lg" />

        {/* Scanning Line */}
        {!shouldReduce && (
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line-slow opacity-60" />
        )}

        {/* Face Placeholder - Abstract geometric representation */}
        <div className="absolute inset-8 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Head shape */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-full rounded-[50%_50%_45%_45%] border-2 border-primary/20 bg-gradient-to-b from-primary/10 via-transparent to-primary/5" />
            </div>
            
            {/* Eye level line */}
            <div className="absolute top-[35%] left-[15%] right-[15%] h-[1px] bg-primary/10" />
            
            {/* Nose line */}
            <div className="absolute top-[35%] bottom-[35%] left-1/2 -translate-x-1/2 w-[1px] bg-primary/10" />
            
            {/* Jaw line hint */}
            <div className="absolute bottom-[25%] left-[20%] right-[20%] h-[1px] bg-primary/10 rounded-full" />

            {/* Analysis Points */}
            {shouldReduce ? staticPoints : points}

            {/* Measurement lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
              {/* Connecting lines between points */}
              <line x1="30" y1="25" x2="70" y2="28" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.3" strokeDasharray="2 2" />
              <line x1="45" y1="45" x2="55" y2="42" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.3" strokeDasharray="2 2" />
              <line x1="35" y1="55" x2="65" y2="58" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.3" strokeDasharray="2 2" />
              <line x1="50" y1="30" x2="50" y2="65" stroke="hsl(var(--primary))" strokeWidth="0.3" strokeOpacity="0.2" strokeDasharray="3 3" />
            </svg>
          </div>
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
