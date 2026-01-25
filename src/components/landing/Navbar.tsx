import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ScannerLogo } from "@/components/ScannerLogo";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-background/95 dark:bg-background/80 border-b border-border">
        <div className="container px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo with Scanner Effect */}
            <Link to="/">
              <ScannerLogo size="xs" labelSize="xs" className="sm:hidden" />
              <ScannerLogo size="md" labelSize="md" className="hidden sm:flex" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                So funktioniert's
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
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

            {/* Mobile Menu Toggle - larger touch target */}
            <button 
              className="md:hidden p-3 -mr-2 text-foreground active:bg-accent/50 rounded-lg transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden backdrop-blur-xl bg-background border-b border-border shadow-lg">
          <div className="container px-4 sm:px-6 py-4">
            <nav className="flex flex-col gap-1">
              <a 
                href="#features" 
                className="text-foreground hover:text-primary hover:bg-accent/50 transition-colors py-3 px-3 -mx-3 rounded-lg font-medium text-base"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-foreground hover:text-primary hover:bg-accent/50 transition-colors py-3 px-3 -mx-3 rounded-lg font-medium text-base"
                onClick={() => setIsOpen(false)}
              >
                So funktioniert's
              </a>
              <a 
                href="#pricing" 
                className="text-foreground hover:text-primary hover:bg-accent/50 transition-colors py-3 px-3 -mx-3 rounded-lg font-medium text-base"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full text-foreground border-border hover:bg-accent min-h-[48px]">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full min-h-[48px]">
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