import { Home, Camera, TrendingUp, Heart, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { motion } from "framer-motion";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: Camera, label: "Scan", path: "/upload", isMain: true },
  { icon: Users, label: "Freunde", path: "/friends", showBadge: true },
  { icon: User, label: "Plan", path: "/plan" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { total } = useNotificationCounts();

  const handleTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blur background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      {/* Safe area padding */}
      <div className="relative flex items-end justify-around h-20 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Center scan button
          if (item.isMain) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleTap}
                className="relative -mt-6 flex flex-col items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all",
                    isActive 
                      ? "bg-primary shadow-primary/40" 
                      : "bg-gradient-to-br from-primary to-primary/80 shadow-primary/30"
                  )}
                >
                  <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                </motion.div>
                <span className={cn(
                  "text-[10px] font-semibold mt-1.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleTap}
              className="flex flex-col items-center justify-center flex-1 h-full pt-3"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center gap-1 transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-xl transition-all",
                  isActive && "bg-primary/15"
                )}>
                  <Icon 
                    className="w-5 h-5 transition-all" 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  {/* Notification Badge */}
                  {item.showBadge && total > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                      {total > 99 ? "99+" : total}
                    </span>
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
