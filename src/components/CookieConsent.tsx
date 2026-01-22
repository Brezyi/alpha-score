import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X, Cookie, Settings, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ConsentSettings = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "cookie_consent";
const CONSENT_SETTINGS_KEY = "cookie_consent_settings";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consentSettings: ConsentSettings) => {
    localStorage.setItem(CONSENT_KEY, "true");
    localStorage.setItem(CONSENT_SETTINGS_KEY, JSON.stringify(consentSettings));
    setIsVisible(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setSettings(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptSelected = () => {
    saveConsent(settings);
  };

  const rejectOptional = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setSettings(onlyNecessary);
    saveConsent(onlyNecessary);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Cookie-Einstellungen</h3>
                <p className="text-sm text-muted-foreground">
                  Wir verwenden Cookies, um deine Erfahrung zu verbessern. Einige sind notwendig, 
                  andere helfen uns, die App zu optimieren.{" "}
                  <Link to="/datenschutz" className="text-primary hover:underline">
                    Mehr erfahren
                  </Link>
                </p>
              </div>
            </div>

            {/* Detailed Settings */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3 overflow-hidden"
                >
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Notwendige Cookies</p>
                      <p className="text-xs text-muted-foreground">
                        Erforderlich für Login, Sicherheit und Grundfunktionen.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Immer aktiv</span>
                      <div className="w-10 h-6 bg-primary rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-primary-foreground rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Analyse-Cookies</p>
                      <p className="text-xs text-muted-foreground">
                        Helfen uns zu verstehen, wie die App genutzt wird.
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                      className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        settings.analytics ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-colors ${
                        settings.analytics ? "bg-primary-foreground" : "bg-background"
                      }`} />
                    </button>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Marketing-Cookies</p>
                      <p className="text-xs text-muted-foreground">
                        Für personalisierte Werbung und Remarketing.
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, marketing: !s.marketing }))}
                      className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        settings.marketing ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-colors ${
                        settings.marketing ? "bg-primary-foreground" : "bg-background"
                      }`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="p-4 md:px-6 md:pb-6 border-t border-border bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1 sm:flex-none"
              >
                <Settings className="w-4 h-4" />
                {showDetails ? "Weniger anzeigen" : "Anpassen"}
              </Button>
              
              <div className="flex gap-3 flex-1 sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rejectOptional}
                  className="flex-1 sm:flex-none"
                >
                  Nur notwendige
                </Button>
                
                {showDetails ? (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={acceptSelected}
                    className="flex-1 sm:flex-none"
                  >
                    <Check className="w-4 h-4" />
                    Auswahl speichern
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={acceptAll}
                    className="flex-1 sm:flex-none"
                  >
                    <Check className="w-4 h-4" />
                    Alle akzeptieren
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to check consent status
export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentSettings | null>(null);

  useEffect(() => {
    const settings = localStorage.getItem(CONSENT_SETTINGS_KEY);
    if (settings) {
      setConsent(JSON.parse(settings));
    }
  }, []);

  return consent;
};

export default CookieConsent;
