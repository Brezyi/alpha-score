import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  type?: string;
}

const ROUTE_SEO: Record<string, SEOConfig> = {
  "/": {
    title: "GLOWMAXXED AI – KI-gestützte Looksmaxing App",
    description: "Maximiere dein Aussehen mit KI-Analyse. Personalisierte Pläne, Face Fitness, Lifestyle-Tracking und AI Coach.",
    path: "/",
    type: "website",
  },
  "/login": {
    title: "Anmelden – GLOWMAXXED AI",
    description: "Melde dich an und starte deine Looksmaxing-Journey mit KI-gestützter Analyse.",
    path: "/login",
  },
  "/register": {
    title: "Registrieren – GLOWMAXXED AI",
    description: "Erstelle dein kostenloses Konto und erhalte eine KI-Analyse deines Aussehens.",
    path: "/register",
  },
  "/dashboard": {
    title: "Dashboard – GLOWMAXXED AI",
    description: "Dein persönliches Dashboard mit Looks-Score, Fortschritt und täglichen Challenges.",
    path: "/dashboard",
  },
  "/upload": {
    title: "Analyse starten – GLOWMAXXED AI",
    description: "Lade deine Fotos hoch und erhalte eine detaillierte KI-Analyse deines Aussehens.",
    path: "/upload",
  },
  "/plan": {
    title: "Dein Plan – GLOWMAXXED AI",
    description: "Dein personalisierter Looksmaxing-Plan mit konkreten Schritten für sichtbare Verbesserungen.",
    path: "/plan",
  },
  "/progress": {
    title: "Fortschritt – GLOWMAXXED AI",
    description: "Verfolge deinen Fortschritt mit Analysen-Timeline und Vorher-Nachher-Vergleichen.",
    path: "/progress",
  },
  "/lifestyle": {
    title: "Lifestyle Tracker – GLOWMAXXED AI",
    description: "Tracke Schlaf, Ernährung, Wasser und mehr für optimale Ergebnisse.",
    path: "/lifestyle",
  },
  "/coach": {
    title: "AI Coach – GLOWMAXXED AI",
    description: "Dein persönlicher KI-Coach für Looksmaxing-Fragen und Motivation.",
    path: "/coach",
  },
  "/pricing": {
    title: "Preise – GLOWMAXXED AI",
    description: "Wähle den passenden Plan für deine Looksmaxing-Journey. Ab 0€ starten.",
    path: "/pricing",
  },
  "/features": {
    title: "Features – GLOWMAXXED AI",
    description: "Entdecke alle Features: KI-Analyse, personalisierte Pläne, Face Fitness und mehr.",
    path: "/features",
  },
  "/affiliate": {
    title: "Affiliate Programm – GLOWMAXXED AI",
    description: "Verdiene 20% Provision für jedes vermittelte Abo. Jetzt Affiliate werden.",
    path: "/affiliate",
  },
};

const BASE_URL = "https://glowmaxxed.ai";

export function SEOHead() {
  const location = useLocation();
  
  useEffect(() => {
    const seo = ROUTE_SEO[location.pathname];
    if (!seo) return;

    // Update title
    document.title = seo.title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMeta("description", seo.description);
    updateMeta("og:title", seo.title, true);
    updateMeta("og:description", seo.description, true);
    updateMeta("og:url", `${BASE_URL}${seo.path}`, true);
    updateMeta("og:type", seo.type || "website", true);
    updateMeta("twitter:title", seo.title);
    updateMeta("twitter:description", seo.description);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${BASE_URL}${seo.path}`);
  }, [location.pathname]);

  return null;
}
