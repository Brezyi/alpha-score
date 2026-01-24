import { useState } from "react";
import { X, Globe, Sun, Moon, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandingPreviewProps {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  accentColor: string;
}

export function BrandingPreview({ appName, logoUrl, faviconUrl, accentColor }: BrandingPreviewProps) {
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");

  const isDark = previewTheme === "dark";

  // Theme-specific colors
  const themeColors = {
    dark: {
      bg: "bg-[#0B0B0B]",
      bgSecondary: "bg-[#1a1a1a]",
      bgMuted: "bg-[#2a2a2a]",
      border: "border-[#333]",
      text: "text-white",
      textMuted: "text-gray-400",
      tabBg: "bg-[#1a1a1a]",
    },
    light: {
      bg: "bg-white",
      bgSecondary: "bg-gray-50",
      bgMuted: "bg-gray-100",
      border: "border-gray-200",
      text: "text-gray-900",
      textMuted: "text-gray-500",
      tabBg: "bg-white",
    },
  };

  const colors = themeColors[previewTheme];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Live-Vorschau</p>
        
        {/* Theme Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreviewTheme("light")}
            className={`h-7 px-2 gap-1.5 ${!isDark ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="text-xs">Hell</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreviewTheme("dark")}
            className={`h-7 px-2 gap-1.5 ${isDark ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-xs">Dunkel</span>
          </Button>
        </div>
      </div>
      
      {/* Mock Browser Window */}
      <div className={`rounded-lg border overflow-hidden shadow-lg ${colors.border}`}>
        {/* Browser Title Bar */}
        <div className={`${colors.bgMuted} border-b ${colors.border} px-3 py-2`}>
          <div className="flex items-center gap-2">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            {/* Browser Tab */}
            <div className={`ml-2 flex items-center gap-2 ${colors.tabBg} rounded-t-md px-3 py-1.5 border border-b-0 ${colors.border} max-w-[200px]`}>
              {/* Favicon */}
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {faviconUrl ? (
                  <img 
                    src={faviconUrl} 
                    alt="Favicon" 
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <Globe className={`w-3 h-3 ${colors.textMuted}`} />
                )}
              </div>
              {/* Tab Title */}
              <span className={`text-xs truncate ${colors.text}`}>
                {appName || "App Name"}
              </span>
              <X className={`w-3 h-3 ${colors.textMuted} flex-shrink-0`} />
            </div>
          </div>
        </div>
        
        {/* Address Bar */}
        <div className={`${colors.bgSecondary} border-b ${colors.border} px-3 py-2`}>
          <div className="flex items-center gap-2">
            <div className={`flex-1 ${colors.bg} rounded-md px-3 py-1.5 text-xs ${colors.textMuted} border ${colors.border}`}>
              https://deine-app.lovable.app
            </div>
          </div>
        </div>
        
        {/* Mock Page Content - Navbar */}
        <div className={`${colors.bg} p-4`}>
          <div className={`border ${colors.border} rounded-lg overflow-hidden`}>
            {/* Mock Navbar */}
            <div className={`${colors.bg} backdrop-blur border-b ${colors.border} px-4 py-3`}>
              <div className="flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <div className="relative">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-8 h-8 rounded-lg object-contain relative z-10"
                      />
                      {/* Corner Brackets */}
                      <div className="absolute -inset-0.5 pointer-events-none z-0">
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t rounded-tl" style={{ borderColor: accentColor || "#00FF88" }} />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t rounded-tr" style={{ borderColor: accentColor || "#00FF88" }} />
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b rounded-bl" style={{ borderColor: accentColor || "#00FF88" }} />
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b rounded-br" style={{ borderColor: accentColor || "#00FF88" }} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center relative z-10"
                        style={{ backgroundColor: accentColor || "#00FF88" }}
                      >
                        <ScanFace className="w-4 h-4 text-black" />
                      </div>
                      {/* Corner Brackets */}
                      <div className="absolute -inset-0.5 pointer-events-none z-0">
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t rounded-tl" style={{ borderColor: accentColor || "#00FF88", opacity: 0.6 }} />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t rounded-tr" style={{ borderColor: accentColor || "#00FF88", opacity: 0.6 }} />
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b rounded-bl" style={{ borderColor: accentColor || "#00FF88", opacity: 0.6 }} />
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b rounded-br" style={{ borderColor: accentColor || "#00FF88", opacity: 0.6 }} />
                      </div>
                    </div>
                  )}
                  <span className={`font-bold text-sm ${colors.text}`}>{appName || "App Name"}</span>
                </div>
                
                {/* Mock Nav Items */}
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-12 ${colors.bgMuted} rounded`} />
                  <div className={`h-2 w-16 ${colors.bgMuted} rounded`} />
                  <div 
                    className="h-6 w-20 rounded opacity-20"
                    style={{ backgroundColor: accentColor || "#00FF88" }}
                  />
                </div>
              </div>
            </div>
            
            {/* Mock Content */}
            <div className={`${colors.bg} p-6 space-y-3`}>
              <div className={`h-3 w-48 ${colors.bgMuted} rounded`} />
              <div className={`h-2 w-64 ${colors.bgSecondary} rounded`} />
              <div className={`h-2 w-56 ${colors.bgSecondary} rounded`} />
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        So wird dein Branding im {isDark ? "Dark" : "Light"} Mode angezeigt
      </p>
    </div>
  );
}
