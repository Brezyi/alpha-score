import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, lines = 3, showAvatar = false, showImage = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-5 rounded-2xl glass-card space-y-4 animate-pulse",
          className
        )}
      >
        {showImage && (
          <Skeleton className="h-32 w-full rounded-xl" />
        )}

        <div className="flex items-start gap-3">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          )}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            {Array.from({ length: lines - 1 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-3", i === lines - 2 ? "w-1/2" : "w-full")}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";

export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div 
          key={i} 
          className="p-4 rounded-xl glass-card space-y-2 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="p-5 rounded-2xl glass-card animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <SkeletonStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={4} showImage />
        <SkeletonCard lines={3} showAvatar />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="p-4 rounded-xl glass-card flex items-center gap-3 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
