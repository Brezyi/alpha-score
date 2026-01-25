import { Bell, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { ScannerLogo } from "@/components/ScannerLogo";
import { cn } from "@/lib/utils";

interface MobileAppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const MobileAppHeader = ({
  title,
  showLogo = true,
  showSettings = false,
  showNotifications = false,
  rightAction,
  className,
}: MobileAppHeaderProps) => {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-top",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Logo or Title */}
        <div className="flex items-center gap-3 min-w-0">
          {showLogo ? (
            <ScannerLogo size="xs" labelSize="xs" />
          ) : title ? (
            <h1 className="text-lg font-bold truncate">{title}</h1>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showNotifications && (
            <button className="p-2.5 rounded-full hover:bg-accent/50 active:bg-accent transition-colors relative">
              <Bell className="w-5 h-5 text-foreground" />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
          )}
          {showSettings && (
            <Link 
              to="/plan" 
              className="p-2.5 rounded-full hover:bg-accent/50 active:bg-accent transition-colors"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Link>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
};
