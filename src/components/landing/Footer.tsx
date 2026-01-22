import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative py-16 border-t border-border/50">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FaceRank</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link to="#" className="hover:text-primary transition-colors">Datenschutz</Link>
            <Link to="#" className="hover:text-primary transition-colors">Impressum</Link>
            <Link to="#" className="hover:text-primary transition-colors">AGB</Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2024 FaceRank. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;