import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { MobileAppHeader } from "./MobileAppHeader";
import { cn } from "@/lib/utils";

interface MobileAppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showLogo?: boolean;
  showBottomNav?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  headerRightAction?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const MobileAppLayout = ({
  children,
  title,
  showHeader = true,
  showLogo = true,
  showBottomNav = true,
  showSettings = false,
  showNotifications = false,
  headerRightAction,
  className,
  contentClassName,
}: MobileAppLayoutProps) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showHeader && (
        <MobileAppHeader
          title={title}
          showLogo={showLogo}
          showSettings={showSettings}
          showNotifications={showNotifications}
          rightAction={headerRightAction}
        />
      )}
      
      <main className={cn(
        "min-h-screen",
        showHeader && "pt-14",
        showBottomNav && "pb-20",
        contentClassName
      )}>
        {children}
      </main>

      {showBottomNav && <BottomNavigation />}
    </div>
  );
};
