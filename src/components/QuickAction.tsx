import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: ReactNode;
  title: string;
  description?: string;
  href: string;
  locked?: boolean;
  badge?: string;
  color?: string;
  className?: string;
}

export function QuickAction({
  icon,
  title,
  description,
  href,
  locked = false,
  badge,
  color = "bg-primary/10 text-primary",
  className,
}: QuickActionProps) {
  const content = (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-4 rounded-xl bg-card border border-border",
        "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
        "active:scale-[0.98] touch-manipulation",
        locked && "opacity-60",
        className
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
        color
      )}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {description}
          </p>
        )}
      </div>

      {/* Arrow or Lock */}
      <div className="flex-shrink-0 text-muted-foreground">
        {locked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent" />
      </div>
    </div>
  );

  if (locked) {
    return <Link to="/pricing">{content}</Link>;
  }

  return <Link to={href}>{content}</Link>;
}
