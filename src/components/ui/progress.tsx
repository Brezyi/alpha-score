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
  const animatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!animated) {
      setDisplayValue(value || 0);
      return;
    }

    if (animatedRef.current) {
      setDisplayValue(value || 0);
      return;
    }
    
    animatedRef.current = true;
    const targetValue = value || 0;
    
    let frame = 0;
    const totalFrames = 30;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayValue(eased * targetValue);
      
      if (frame < totalFrames) {
        setTimeout(animate, 40);
      } else {
        setDisplayValue(targetValue);
      }
    };
    
    setTimeout(animate, 100);
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
          transform: `translateX(-${100 - displayValue}%)`
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
