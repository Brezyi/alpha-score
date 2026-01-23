import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

const Navbar = () => {
  const { settings } = useGlobalSettings();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-background/95 dark:bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              {settings.app_logo_url ? (
                <img 
                  src={settings.app_logo_url} 
                  alt={settings.app_name} 
                  className="w-9 h-9 rounded-lg object-contain"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold text-foreground">{settings.app_name}</span>
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
                <Button variant="default" size="sm">
                  Kostenlos starten
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