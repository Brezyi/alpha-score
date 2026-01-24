import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** Text to display below the spinner */
  text?: string;
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Whether to show in full screen mode */
  fullScreen?: boolean;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingState({
  text,
  size = "md",
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        {/* Spinner */}
        <Loader2
          className={cn(
            "relative text-primary animate-spin",
            sizeClasses[size]
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loading for cards
interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-border animate-pulse", className)}>
      <div className="h-4 w-1/3 bg-muted rounded mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-muted rounded"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Inline loading spinner
interface InlineLoaderProps {
  className?: string;
}

export function InlineLoader({ className }: InlineLoaderProps) {
  return (
    <Loader2 className={cn("w-4 h-4 animate-spin text-muted-foreground", className)} />
  );
}
