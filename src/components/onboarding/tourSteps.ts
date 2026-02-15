/**
 * Pre-defined tour step definitions for each page.
 * Separated from the UI to keep the overlay component lean.
 */

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

// ── Dashboard ────────────────────────────────────────────
export const dashboardTourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='score-card']",
    title: "Dein Looks Score",
    description: "Hier siehst du deinen aktuellen Score und deine Entwicklung über Zeit. Je höher, desto besser!",
    position: "bottom",
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Schnellzugriff",
    description: "Starte eine neue Analyse, tracke deinen Lifestyle oder chatte mit dem AI Coach.",
    position: "top",
  },
  {
    id: "gamification",
    target: "[data-tour='gamification']",
    title: "Level & XP",
    description: "Sammle Erfahrungspunkte durch Aktivitäten und steige im Level auf!",
    position: "top",
  },
  {
    id: "discover-hint",
    target: "[data-tour='discover-link']",
    title: "Fortschritt entdecken",
    description: "Hier kommst du zur Progress-Seite mit Timeline, Achievements und mehr Details.",
    position: "bottom",
  },
];

// ── Upload ───────────────────────────────────────────────
export const uploadTourSteps: TourStep[] = [
  {
    id: "upload-area",
    target: "[data-tour='upload-area']",
    title: "Fotos hochladen",
    description: "Lade 3 Fotos hoch: frontal, seitlich und ganzkörper für die beste Analyse.",
    position: "bottom",
  },
  {
    id: "guidelines",
    target: "[data-tour='photo-guidelines']",
    title: "Foto-Tipps",
    description: "Befolge diese Tipps für die genaueste Analyse.",
    position: "left",
  },
];

// ── Lifestyle ────────────────────────────────────────────
export const lifestyleTourSteps: TourStep[] = [
  {
    id: "tabs",
    target: "[data-tour='lifestyle-tabs']",
    title: "Lifestyle-Bereiche",
    description: "Wechsle zwischen Ernährung, Schlaf, Wasser, Fasten und mehr.",
    position: "bottom",
  },
  {
    id: "tracker",
    target: "[data-tour='main-tracker']",
    title: "Tägliches Tracking",
    description: "Tracke hier deine täglichen Gewohnheiten für bessere Ergebnisse.",
    position: "top",
  },
];

// ── Progress ─────────────────────────────────────────────
export const progressTourSteps: TourStep[] = [
  {
    id: "timeline",
    target: "[data-tour='timeline']",
    title: "Deine Timeline",
    description: "Sieh alle deine Analysen chronologisch und vergleiche Fortschritte.",
    position: "bottom",
  },
  {
    id: "achievements",
    target: "[data-tour='achievements']",
    title: "Achievements",
    description: "Schalte über 50 Erfolge für verschiedene Meilensteine frei.",
    position: "top",
  },
];

/**
 * Filter step list to only include steps whose target exists in the DOM.
 * Prevents highlights on wrong elements and dead/empty steps.
 */
export function filterAvailableSteps(steps: TourStep[]): TourStep[] {
  return steps.filter((step) => {
    try {
      return !!document.querySelector(step.target);
    } catch {
      return false;
    }
  });
}
