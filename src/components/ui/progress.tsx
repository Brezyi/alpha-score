import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  animated?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  glowOnComplete?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, animated = false, animationDuration = 2200, animationDelay = 300, glowOnComplete = false, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    const targetValue = value || 0;

    if (!animated) {
      hasAnimatedRef.current = false;
      setDisplayValue(targetValue);
      setIsComplete(true);
      return;
    }

    // Only animate once on initial mount
    if (hasAnimatedRef.current) {
      setDisplayValue(targetValue);
      return;
    }

    hasAnimatedRef.current = true;
    setIsComplete(false);
    
    // Start at 0, then after delay trigger the CSS transition
    setDisplayValue(0);
    const timeoutId = setTimeout(() => {
      setDisplayValue(targetValue);
    }, animationDelay);

    // Trigger glow after animation completes
    const glowTimeoutId = setTimeout(() => {
      setIsComplete(true);
    }, animationDelay + animationDuration);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(glowTimeoutId);
    };
  }, [value, animated, animationDelay, animationDuration]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary will-change-transform rounded-full",
          glowOnComplete && isComplete && "animate-progress-glow"
        )}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          transition: animated
            ? `transform ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : undefined,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
