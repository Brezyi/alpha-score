import { Home, Camera, TrendingUp, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Camera, label: "Scan", path: "/upload" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: MessageSquare, label: "Coach", path: "/coach" },
  { icon: User, label: "Profil", path: "/plan" },
];

export const BottomNavigation = () => {
  const location = useLocation();

  const handleTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleTap}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all",
                isActive && "bg-primary/15"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "scale-110"
                )} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
