import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Hook that detects if reduced motion should be used.
 * Returns true if:
 * - User has prefers-reduced-motion enabled in OS settings
 * - User is on a mobile device (for performance)
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check OS-level preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Return true if user prefers reduced motion OR is on mobile
  return prefersReducedMotion || isMobile;
}

/**
 * Returns animation variants optimized for the current device.
 * On mobile/reduced-motion: simpler, faster animations
 * On desktop: full animations with springs and staggers
 */
export function useOptimizedAnimations() {
  const shouldReduce = useReducedMotion();

  const containerVariants = shouldReduce
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.2 }
        }
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 }
        }
      };

  const itemVariants = shouldReduce
    ? {
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { duration: 0.15 }
        }
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
      };

  const cardVariants = shouldReduce
    ? {
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { duration: 0.15 }
        }
      }
    : {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
      };

  // Hover/tap effects - disabled on mobile for performance
  const hoverScale = shouldReduce ? {} : { scale: 1.05, y: -5 };
  const tapScale = shouldReduce ? {} : { scale: 0.95 };
  const hoverScaleSmall = shouldReduce ? {} : { scale: 1.02 };

  return {
    shouldReduce,
    containerVariants,
    itemVariants,
    cardVariants,
    hoverScale,
    tapScale,
    hoverScaleSmall
  };
}
