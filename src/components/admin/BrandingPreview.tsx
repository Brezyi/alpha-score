import { Zap, X, Minus, Square, Globe } from "lucide-react";

interface BrandingPreviewProps {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
}

export function BrandingPreview({ appName, logoUrl, faviconUrl }: BrandingPreviewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Live-Vorschau</p>
      
      {/* Mock Browser Window */}
      <div className="rounded-lg border border-border overflow-hidden bg-background shadow-lg">
        {/* Browser Title Bar */}
        <div className="bg-muted/50 border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            {/* Browser Tab */}
            <div className="ml-2 flex items-center gap-2 bg-background rounded-t-md px-3 py-1.5 border border-b-0 border-border max-w-[200px]">
              {/* Favicon */}
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {faviconUrl ? (
                  <img 
                    src={faviconUrl} 
                    alt="Favicon" 
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <Globe className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              {/* Tab Title */}
              <span className="text-xs truncate text-foreground">
                {appName || "App Name"}
              </span>
              <X className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </div>
          </div>
        </div>
        
        {/* Address Bar */}
        <div className="bg-muted/30 border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background rounded-md px-3 py-1.5 text-xs text-muted-foreground border border-border">
              https://deine-app.lovable.app
            </div>
          </div>
        </div>
        
        {/* Mock Page Content - Navbar */}
        <div className="bg-background p-4">
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Mock Navbar */}
            <div className="bg-background/80 backdrop-blur border-b border-border/50 px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-8 h-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <span className="font-bold text-sm">{appName || "App Name"}</span>
                </div>
                
                {/* Mock Nav Items */}
                <div className="flex items-center gap-4">
                  <div className="h-2 w-12 bg-muted rounded" />
                  <div className="h-2 w-16 bg-muted rounded" />
                  <div className="h-6 w-20 bg-primary/20 rounded" />
                </div>
              </div>
            </div>
            
            {/* Mock Content */}
            <div className="p-6 space-y-3">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-2 w-64 bg-muted/60 rounded" />
              <div className="h-2 w-56 bg-muted/60 rounded" />
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        So wird dein Branding in der App angezeigt
      </p>
    </div>
  );
}
