import { useState, useEffect } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";

// Import all colored logo variants
import logoGreen from "@/assets/logo-green.png";
import logoCyan from "@/assets/logo-cyan.png";
import logoRed from "@/assets/logo-red.png";
import logoYellow from "@/assets/logo-yellow.png";
import logoPurple from "@/assets/logo-purple.png";
import logoPink from "@/assets/logo-pink.png";

interface ScannerLogoProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  labelSize?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const labelSizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

// Map accent colors to logo variants
const logoMap: Record<string, string> = {
  "#00FF88": logoGreen,
  "#00D4FF": logoCyan,
  "#FF6B6B": logoRed,
  "#FFD93D": logoYellow,
  "#C084FC": logoPurple,
  "#F472B6": logoPink,
};

export function ScannerLogo({ 
  size = "md", 
  showLabel = true, 
  labelSize = "md",
  className = "",
  animated = true 
}: ScannerLogoProps) {
  const { settings } = useGlobalSettings();
  const { accentColor } = useTheme();
  const [scannerActive, setScannerActive] = useState(animated);

  // Get the correct logo based on accent color
  const currentLogo = logoMap[accentColor] || logoGreen;

  // Cycle scanner animation
  useEffect(() => {
    if (!animated) return;
    
    const interval = setInterval(() => {
      setScannerActive(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [animated]);

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        {/* Scanner Container */}
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Base Logo */}
          {settings.app_logo_url ? (
            <img 
              src={settings.app_logo_url} 
              alt={settings.app_name} 
              className={`${sizeClasses[size]} rounded-lg object-contain relative z-10`}
            />
          ) : (
            <img 
              src={currentLogo} 
              alt={settings.app_name} 
              className={`${sizeClasses[size]} rounded-lg object-cover relative z-10`}
            />
          )}
          
          {/* Scanner Line Animation */}
          {animated && (
            <div 
              className={`absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-20 ${scannerActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
            >
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line" />
            </div>
          )}
          
          {/* Corner Brackets */}
          <div className="absolute -inset-1 pointer-events-none z-0">
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary/60 rounded-tl" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary/60 rounded-tr" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary/60 rounded-bl" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary/60 rounded-br" />
          </div>
          
          {/* Pulsing Glow */}
          {animated && (
            <div className={`absolute inset-0 rounded-lg bg-primary/20 blur-md -z-10 ${scannerActive ? 'animate-pulse-slow' : ''}`} />
          )}
        </div>
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${labelSizeClasses[labelSize]} font-bold text-foreground leading-tight group-hover:text-primary transition-colors`}>
            {settings.app_name}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase hidden sm:block">
            AI Analysis
          </span>
        </div>
      )}
    </div>
  );
}

export default ScannerLogo;
