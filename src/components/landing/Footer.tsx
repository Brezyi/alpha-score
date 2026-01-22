import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

const Footer = () => {
  const { settings } = useGlobalSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 border-t border-border/50">
      <div className="container px-4">
        <div className="flex flex-col gap-8">
          {/* Top Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{settings.app_name}</span>
            </Link>

            {/* Main Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Legal Links */}
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link to="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">
                Datenschutz
              </Link>
              <span className="text-border">•</span>
              <Link to="/impressum" className="text-muted-foreground hover:text-primary transition-colors">
                Impressum
              </Link>
              <span className="text-border">•</span>
              <Link to="/agb" className="text-muted-foreground hover:text-primary transition-colors">
                AGB
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {currentYear} {settings.app_name}. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;