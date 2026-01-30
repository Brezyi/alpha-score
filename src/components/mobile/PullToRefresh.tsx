import { ReactNode, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className,
  threshold = 80,
  disabled = false
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const spinnerOpacity = useTransform(y, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const spinnerScale = useTransform(y, [0, threshold], [0.5, 1]);
  const spinnerRotate = useTransform(y, [0, threshold], [0, 180]);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        // Haptics not available
      }
    }
  }, []);

  const handleDragStart = () => {
    if (disabled || isRefreshing) return;
    setIsPulling(true);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pulling down when at top of scroll
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 5) {
      y.set(0);
      return;
    }
    
    // Resistance effect - gets harder to pull further
    const resistance = 0.4;
    const pullDistance = Math.max(0, info.offset.y * resistance);
    y.set(Math.min(pullDistance, threshold * 1.5));
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled || isRefreshing) {
      y.set(0);
      setIsPulling(false);
      return;
    }

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    if (y.get() >= threshold && scrollTop <= 5) {
      // Trigger refresh
      setIsRefreshing(true);
      y.set(threshold * 0.6); // Keep spinner visible during refresh
      
      await triggerHaptic();
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
    
    setIsPulling(false);
  };

  return (
    <div className={cn("relative overflow-visible", className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ 
          top: -40,
          opacity: spinnerOpacity,
          scale: spinnerScale,
          y
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full bg-background border-2 border-primary/30 shadow-lg flex items-center justify-center",
            isRefreshing && "border-primary"
          )}
          style={{ rotate: isRefreshing ? 0 : spinnerRotate }}
        >
          <Loader2 
            className={cn(
              "w-5 h-5 text-primary",
              isRefreshing && "animate-spin"
            )} 
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={disabled || isRefreshing ? false : "y"}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isPulling || isRefreshing ? y : 0 }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
