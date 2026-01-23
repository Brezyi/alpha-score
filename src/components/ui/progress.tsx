import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  animated?: boolean;
  animationDuration?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, animated = false, animationDuration = 1200, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(animated ? 0 : (value || 0));
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!animated) {
      setDisplayValue(value || 0);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(value || 0);
      return;
    }
    
    hasAnimatedRef.current = true;
    const targetValue = value || 0;
    
    // Simple stepped animation - fewer updates = smoother performance
    const steps = 20;
    const stepDuration = animationDuration / steps;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * targetValue);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayValue(targetValue);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [value, animated, animationDuration]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary"
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          transition: animated ? 'none' : 'transform 150ms ease'
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
