import { Bell, Settings, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ScannerLogo } from "@/components/ScannerLogo";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface MobileAppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export const MobileAppHeader = ({
  title,
  showLogo = true,
  showSettings = false,
  showNotifications = false,
  showBack = false,
  rightAction,
  className,
  transparent = false,
}: MobileAppHeaderProps) => {
  const navigate = useNavigate();

  const handleTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      !transparent && "bg-background/80 backdrop-blur-xl border-b border-border/30",
      className
    )}>
      {/* Safe area padding */}
      <div className="pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Back button or Logo */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  handleTap();
                  navigate(-1);
                }}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl active:bg-accent/50 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            ) : showLogo ? (
              <ScannerLogo size="xs" labelSize="xs" />
            ) : null}
            
            {title && !showLogo && (
              <h1 className="text-lg font-bold truncate">{title}</h1>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {showNotifications && (
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleTap}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl active:bg-accent/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {/* Notification dot */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
              </motion.button>
            )}
            {showSettings && (
              <Link 
                to="/plan" 
                onClick={handleTap}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl active:bg-accent/50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-foreground" />
                </motion.div>
              </Link>
            )}
            {rightAction}
          </div>
        </div>
      </div>
    </header>
  );
};
