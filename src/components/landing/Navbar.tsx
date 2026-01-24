import { Button } from "@/components/ui/button";
import { Zap, Menu, X, ScanFace } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

const Navbar = () => {
  const { settings } = useGlobalSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  // Cycle scanner animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScannerActive(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-background/95 dark:bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Scanner Effect */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Scanner Container */}
                <div className="relative w-10 h-10">
                  {/* Base Logo */}
                  {settings.app_logo_url ? (
                    <img 
                      src={settings.app_logo_url} 
                      alt={settings.app_name} 
                      className="w-10 h-10 rounded-lg object-contain relative z-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center relative z-10 shadow-lg shadow-primary/20">
                      <ScanFace className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Scanner Line Animation */}
                  <div 
                    className={`absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-20 ${scannerActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                  >
                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scanner-line" />
                  </div>
                  
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
                  <div className={`absolute inset-0 rounded-lg bg-primary/20 blur-md -z-10 ${scannerActive ? 'animate-pulse-slow' : ''}`} />
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                  {settings.app_name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase hidden sm:block">
                  AI Analysis
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors font-medium">
                So funktioniert's
              </a>
              <a href="#pricing" className="text-sm text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pricing
              </a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                  Anmelden
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm" className="relative overflow-hidden group">
                  <span className="relative z-10">Kostenlos starten</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden backdrop-blur-xl bg-background border-b border-border shadow-lg">
          <div className="container px-4 py-4">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-gray-700 dark:text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-gray-700 dark:text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                So funktioniert's
              </a>
              <a 
                href="#pricing" 
                className="text-gray-700 dark:text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full text-foreground border-border hover:bg-accent">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    Kostenlos starten
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;