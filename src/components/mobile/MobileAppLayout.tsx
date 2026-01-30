import { ReactNode, useCallback, useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { MobileAppHeader } from "./MobileAppHeader";
import { PullToRefresh } from "./PullToRefresh";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileAppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showLogo?: boolean;
  showBottomNav?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  showBack?: boolean;
  headerRightAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  transparentHeader?: boolean;
  onRefresh?: () => Promise<void>;
  enablePullToRefresh?: boolean;
}

export const MobileAppLayout = ({
  children,
  title,
  showHeader = true,
  showLogo = true,
  showBottomNav = true,
  showSettings = false,
  showNotifications = false,
  showBack = false,
  headerRightAction,
  className,
  contentClassName,
  transparentHeader = false,
  onRefresh,
  enablePullToRefresh = false,
}: MobileAppLayoutProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const content = (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "min-h-screen",
        showHeader && "pt-[calc(56px+var(--sat,0px))]",
        showBottomNav && "pb-24",
        contentClassName
      )}
    >
      {children}
    </motion.main>
  );

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showHeader && (
        <MobileAppHeader
          title={title}
          showLogo={showLogo}
          showSettings={showSettings}
          showNotifications={showNotifications}
          showBack={showBack}
          rightAction={headerRightAction}
          transparent={transparentHeader}
        />
      )}
      
      {enablePullToRefresh && onRefresh ? (
        <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}

      {showBottomNav && <BottomNavigation />}
    </div>
  );
};
