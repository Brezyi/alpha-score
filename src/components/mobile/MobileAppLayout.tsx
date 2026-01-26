import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { MobileAppHeader } from "./MobileAppHeader";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
}: MobileAppLayoutProps) => {
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

      {showBottomNav && <BottomNavigation />}
    </div>
  );
};
