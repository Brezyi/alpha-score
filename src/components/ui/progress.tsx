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
    const targetValue = value || 0;

    if (!animated) {
      animatedRef.current = false;
      setDisplayValue(targetValue);
      return;
    }

    // Animate only once (on first mount / first load)
    if (animatedRef.current) {
      setDisplayValue(targetValue);
      return;
    }

    animatedRef.current = true;
    setDisplayValue(0);
    const raf = requestAnimationFrame(() => setDisplayValue(targetValue));
    return () => cancelAnimationFrame(raf);
  }, [value, animated]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-primary", animated && "will-change-transform")}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          transition: animated
            ? `transform ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`
            : undefined,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
