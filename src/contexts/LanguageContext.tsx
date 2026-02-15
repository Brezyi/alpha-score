import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "de" | "en";

type Translations = Record<string, Record<Language, string>>;

// Core UI translations
const translations: Translations = {
  // Navigation
  "nav.home": { de: "Home", en: "Home" },
  "nav.progress": { de: "Fortschritt", en: "Progress" },
  "nav.scan": { de: "Scan", en: "Scan" },
  "nav.friends": { de: "Freunde", en: "Friends" },
  "nav.plan": { de: "Plan", en: "Plan" },
  "nav.lifestyle": { de: "Lifestyle", en: "Lifestyle" },
  "nav.support": { de: "Support", en: "Support" },
  
  // Dashboard
  "dashboard.greeting.morning": { de: "Guten Morgen", en: "Good Morning" },
  "dashboard.greeting.afternoon": { de: "Guten Tag", en: "Good Afternoon" },
  "dashboard.greeting.evening": { de: "Guten Abend", en: "Good Evening" },
  "dashboard.greeting.night": { de: "Gute Nacht", en: "Good Night" },
  "dashboard.score": { de: "Dein Looks Score", en: "Your Looks Score" },
  "dashboard.potential": { de: "Dein Potenzial", en: "Your Potential" },
  "dashboard.streak": { de: "Streak", en: "Streak" },
  "dashboard.level": { de: "Level", en: "Level" },
  "dashboard.scans": { de: "Scans", en: "Scans" },
  "dashboard.quickAccess": { de: "Schnellzugriff", en: "Quick Access" },
  "dashboard.recentAnalyses": { de: "Letzte Analysen", en: "Recent Analyses" },
  "dashboard.all": { de: "Alle", en: "All" },
  "dashboard.startJourney": { de: "Starte deine Reise", en: "Start Your Journey" },
  "dashboard.uploadPhotos": { de: "Lade Fotos hoch und erhalte deine persönliche KI-Analyse", en: "Upload photos and get your personal AI analysis" },
  "dashboard.firstAnalysis": { de: "Erste Analyse starten", en: "Start First Analysis" },
  "dashboard.sinceLastAnalysis": { de: "seit letzter Analyse", en: "since last analysis" },
  "dashboard.progress": { de: "Fortschritt", en: "Progress" },
  "dashboard.reachable": { de: "erreichbar", en: "reachable" },
  "dashboard.personalBest": { de: "Bestwert", en: "Personal Best" },
  "dashboard.yourProgress": { de: "Dein Fortschritt", en: "Your Progress" },
  "dashboard.pointsReachable": { de: "Punkte", en: "Points" },
  "dashboard.outOf": { de: "von", en: "of" },
  "dashboard.share": { de: "Teilen", en: "Share" },
  "dashboard.nextSteps": { de: "Nächste Schritte", en: "Next Steps" },
  "dashboard.revenueAndSubs": { de: "Umsatz & Abos", en: "Revenue & Subs" },
  "dashboard.revenueDesc": { de: "Revenue & Affiliate-Übersicht", en: "Revenue & Affiliate Overview" },
  "dashboard.analyses": { de: "Analysen", en: "Analyses" },
  "dashboard.ranking": { de: "Ranking", en: "Ranking" },
  "dashboard.activeToday": { de: "Heute aktiv werden!", en: "Get active today!" },
  "dashboard.onFire": { de: "🔥 On Fire!", en: "🔥 On Fire!" },
  "dashboard.resultLocked": { de: "Ergebnis gesperrt", en: "Result locked" },
  "dashboard.unlock": { de: "Freischalten", en: "Unlock" },
  "dashboard.progressToPotential": { de: "Fortschritt zu deinem Potenzial", en: "Progress to your potential" },
  "dashboard.pointsPossible": { de: "möglich", en: "possible" },
  "dashboard.viewPlan": { de: "Plan ansehen", en: "View Plan" },
  "dashboard.scoreChart": { de: "Score-Entwicklung", en: "Score Progression" },
  "dashboard.chartLocked": { de: "Chart gesperrt", en: "Chart locked" },
  "dashboard.potential_label": { de: "Potenzial", en: "Potential" },
  "dashboard.premiumFeature": { de: "Premium Feature", en: "Premium Feature" },
  "dashboard.unlockAll": { de: "Schalte alle Features frei", en: "Unlock all features" },
  "dashboard.unlockAllDesc": { de: "Erhalte detaillierte Analysen, deinen personalisierten Plan und Zugang zum AI Coach.", en: "Get detailed analyses, your personalized plan, and access to the AI Coach." },
  "dashboard.goPremium": { de: "Premium werden", en: "Go Premium" },
  "dashboard.noAnalyses": { de: "Noch keine Analysen", en: "No analyses yet" },
  "dashboard.noAnalysesDesc": { de: "Lade ein Foto hoch und erhalte in wenigen Sekunden deinen Looks Score.", en: "Upload a photo and get your Looks Score in seconds." },
  "dashboard.startNewAnalysis": { de: "Neue Analyse starten", en: "Start New Analysis" },
  "dashboard.trackProgress": { de: "Tracke deinen Fortschritt mit regelmäßigen Analysen.", en: "Track your progress with regular analyses." },
  "dashboard.analyzePhoto": { de: "Foto analysieren", en: "Analyze Photo" },
  "dashboard.analysisComplete": { de: "Analyse abgeschlossen", en: "Analysis complete" },
  "dashboard.analyzing": { de: "Wird analysiert...", en: "Analyzing..." },
  "dashboard.validationFailed": { de: "Validierung fehlgeschlagen", en: "Validation failed" },
  "dashboard.failed": { de: "Fehlgeschlagen", en: "Failed" },
  "dashboard.pending": { de: "Ausstehend", en: "Pending" },
  "dashboard.top": { de: "Top", en: "Top" },
  "dashboard.average": { de: "Durchschnitt", en: "Average" },
  "dashboard.potential_badge": { de: "Potenzial", en: "Potential" },
  "dashboard.inProgress": { de: "In Bearbeitung", en: "In Progress" },
  "dashboard.more": { de: "mehr", en: "more" },
  "dashboard.showAll": { de: "anzeigen", en: "show" },
  "dashboard.analysesLocked": { de: "Analysen gesperrt", en: "Analyses locked" },
  "dashboard.noOpenTasks": { de: "Keine offenen Tasks", en: "No open tasks" },
  "dashboard.createPlan": { de: "Plan erstellen", en: "Create Plan" },
  "dashboard.unlockPremium": { de: "Premium freischalten", en: "Unlock Premium" },
  "dashboard.recommendedProducts": { de: "Empfohlene Produkte für dich", en: "Recommended Products for You" },
  
  // Delete Dialog
  "dialog.cancelAnalysis": { de: "Analyse abbrechen?", en: "Cancel analysis?" },
  "dialog.removeAnalysis": { de: "Analyse entfernen?", en: "Remove analysis?" },
  "dialog.cancelAnalysisDesc": { de: "Diese laufende Analyse wird abgebrochen und gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.", en: "This running analysis will be cancelled and deleted. This action cannot be undone." },
  "dialog.removeAnalysisDesc": { de: "Diese fehlgeschlagene Analyse wird aus deiner Historie entfernt. Diese Aktion kann nicht rückgängig gemacht werden.", en: "This failed analysis will be removed from your history. This action cannot be undone." },
  "dialog.cancelBtn": { de: "Abbrechen", en: "Cancel" },
  "dialog.cancelAnalysisBtn": { de: "Analyse abbrechen", en: "Cancel Analysis" },
  "dialog.removeAnalysisBtn": { de: "Analyse entfernen", en: "Remove Analysis" },
  "dialog.analysisCancelled": { de: "Analyse abgebrochen", en: "Analysis cancelled" },
  "dialog.analysisRemoved": { de: "Analyse entfernt", en: "Analysis removed" },
  "dialog.analysisDeleted": { de: "Die Analyse wurde erfolgreich gelöscht.", en: "The analysis was successfully deleted." },
  "dialog.error": { de: "Fehler", en: "Error" },
  "dialog.deleteError": { de: "Die Analyse konnte nicht gelöscht werden.", en: "The analysis could not be deleted." },
  
  // Quick Actions
  "quick.newAnalysis": { de: "Neue Analyse", en: "New Analysis" },
  "quick.newAnalysisDesc": { de: "Lade Fotos hoch für deine KI-Bewertung", en: "Upload photos for your AI rating" },
  "quick.myPlan": { de: "Mein Plan", en: "My Plan" },
  "quick.myPlanDesc": { de: "Dein personalisierter Looksmax-Plan", en: "Your personalized looksmax plan" },
  "quick.lifestyle": { de: "Lifestyle", en: "Lifestyle" },
  "quick.lifestyleDesc": { de: "Tracke Schlaf, Wasser & Supplements", en: "Track sleep, water & supplements" },
  "quick.friends": { de: "Freunde", en: "Friends" },
  "quick.friendsDesc": { de: "Verbinde dich mit anderen", en: "Connect with others" },
  "quick.progress": { de: "Fortschritt", en: "Progress" },
  "quick.progressDesc": { de: "Verfolge deine Entwicklung", en: "Track your development" },
  "quick.affiliate": { de: "Affiliate", en: "Affiliate" },
  "quick.affiliateDesc": { de: "Verdiene 20% pro Abo", en: "Earn 20% per subscription" },
  "quick.skinType": { de: "Hauttyp erkennen", en: "Detect Skin Type" },
  "quick.skinTypeDesc": { de: "KI-gestützte Hautanalyse", en: "AI-powered skin analysis" },
  
  // Subscription
  "sub.premiumUntil": { de: "Premium bis", en: "Premium until" },
  
  // Analysis
  "analysis.new": { de: "Neue Analyse", en: "New Analysis" },
  "analysis.description": { de: "Lade Fotos hoch für deine KI-Bewertung", en: "Upload photos for your AI rating" },
  
  // Common
  "common.loading": { de: "Wird geladen...", en: "Loading..." },
  "common.save": { de: "Speichern", en: "Save" },
  "common.cancel": { de: "Abbrechen", en: "Cancel" },
  "common.close": { de: "Schließen", en: "Close" },
  "common.delete": { de: "Löschen", en: "Delete" },
  "common.edit": { de: "Bearbeiten", en: "Edit" },
  "common.share": { de: "Teilen", en: "Share" },
  "common.premium": { de: "Premium", en: "Premium" },
  "common.free": { de: "Kostenlos", en: "Free" },
  
  // Profile
  "profile.edit": { de: "Profil bearbeiten", en: "Edit Profile" },
  "profile.settings": { de: "Design anpassen", en: "Customize Design" },
  "profile.security": { de: "Sicherheit", en: "Security" },
  "profile.logout": { de: "Ausloggen", en: "Log Out" },
  
  // Notifications
  "notifications.title": { de: "Benachrichtigungen", en: "Notifications" },
  "notifications.empty": { de: "Keine neuen Benachrichtigungen", en: "No new notifications" },
  "notifications.unreadMessages": { de: "Ungelesene Nachrichten", en: "Unread Messages" },
  "notifications.friendRequests": { de: "Freundschaftsanfragen", en: "Friend Requests" },
  "notifications.partnerRequests": { de: "Partner-Anfragen", en: "Partner Requests" },

  // Motivation
  "motivation.readyForProgress": { de: "Bereit für einen weiteren Tag voller Fortschritt? 💪", en: "Ready for another day of progress? 💪" },
  
  // Language
  "language.de": { de: "Deutsch", en: "German" },
  "language.en": { de: "Englisch", en: "English" },

  // Skin Type Analyzer
  "skin.detect": { de: "Hauttyp erkennen", en: "Detect Skin Type" },
  "skin.title": { de: "AI Hauttyp-Erkennung", en: "AI Skin Type Detection" },
  "skin.description": { de: "Lade ein Nahaufnahme-Foto deines Gesichts hoch für eine KI-gestützte Hauttyp-Analyse.", en: "Upload a close-up photo of your face for an AI-powered skin type analysis." },
  "skin.upload": { de: "Tippe hier, um ein Foto hochzuladen", en: "Tap here to upload a photo" },
  "skin.uploadTip": { de: "Am besten: Nahaufnahme, gutes Licht, kein Make-up", en: "Best: close-up, good lighting, no makeup" },
  "skin.analyzing": { de: "Hauttyp wird analysiert...", en: "Analyzing skin type..." },
  "skin.confidence": { de: "Sicherheit", en: "Confidence" },
  "skin.characteristics": { de: "Merkmale", en: "Characteristics" },
  "skin.recommendations": { de: "Empfohlene Produkte", en: "Recommended Products" },
  "skin.tips": { de: "Tipps", en: "Tips" },
  "skin.retry": { de: "Neue Analyse", en: "New Analysis" },
  "skin.error": { de: "Analyse fehlgeschlagen", en: "Analysis failed" },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem("app-language") as Language) || "de";
    } catch {
      return "de";
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app-language", lang);
    } catch {}
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.de || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
