import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Camera, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Crown,
  User
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  premium?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: Camera, label: "Scan", href: "/upload" },
  { icon: Target, label: "Plan", href: "/plan", premium: true },
  { icon: TrendingUp, label: "Progress", href: "/progress", premium: true },
  { icon: MessageSquare, label: "Coach", href: "/coach", premium: true },
];

export function MobileNavigation() {
  const location = useLocation();
  const { isPremium } = useSubscription();

  // Don't show on auth pages or landing
  const hiddenPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-border" />
      
      {/* Safe area padding for notched devices */}
      <div className="relative flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isLocked = item.premium && !isPremium;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={isLocked ? "/pricing" : item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground",
                isLocked && "opacity-60"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
              
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
                {isLocked && (
                  <Crown className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-amber-500" />
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-opacity",
                isActive ? "opacity-100" : "opacity-80"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
