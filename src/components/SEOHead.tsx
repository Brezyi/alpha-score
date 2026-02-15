import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface SEOConfig {
  titleKey: string;
  descKey: string;
  path: string;
  type?: string;
}

const ROUTE_SEO: Record<string, SEOConfig> = {
  "/": { titleKey: "seo.homeTitle", descKey: "seo.homeDesc", path: "/", type: "website" },
  "/login": { titleKey: "seo.loginTitle", descKey: "seo.loginDesc", path: "/login" },
  "/register": { titleKey: "seo.registerTitle", descKey: "seo.registerDesc", path: "/register" },
  "/dashboard": { titleKey: "seo.dashboardTitle", descKey: "seo.dashboardDesc", path: "/dashboard" },
  "/upload": { titleKey: "seo.uploadTitle", descKey: "seo.uploadDesc", path: "/upload" },
  "/plan": { titleKey: "seo.planTitle", descKey: "seo.planDesc", path: "/plan" },
  "/progress": { titleKey: "seo.progressTitle", descKey: "seo.progressDesc", path: "/progress" },
  "/lifestyle": { titleKey: "seo.lifestyleTitle", descKey: "seo.lifestyleDesc", path: "/lifestyle" },
  "/coach": { titleKey: "seo.coachTitle", descKey: "seo.coachDesc", path: "/coach" },
  "/pricing": { titleKey: "seo.pricingTitle", descKey: "seo.pricingDesc", path: "/pricing" },
  "/features": { titleKey: "seo.featuresTitle", descKey: "seo.featuresDesc", path: "/features" },
  "/affiliate": { titleKey: "seo.affiliateTitle", descKey: "seo.affiliateDesc", path: "/affiliate" },
};

const BASE_URL = "https://glowmaxxed.ai";

export function SEOHead() {
  const location = useLocation();
  const { t } = useLanguage();
  
  useEffect(() => {
    const seo = ROUTE_SEO[location.pathname];
    if (!seo) return;

    const title = t(seo.titleKey);
    const description = t(seo.descKey);

    document.title = title;

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

    updateMeta("description", description);
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:url", `${BASE_URL}${seo.path}`, true);
    updateMeta("og:type", seo.type || "website", true);
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${BASE_URL}${seo.path}`);
  }, [location.pathname, t]);

  return null;
}