import { ArrowLeft, Sparkles, Target, Brain, TrendingUp, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "KI-gestützte Analyse",
    description: "Unsere fortschrittliche KI analysiert deine Fotos und bewertet objektiv Gesichtssymmetrie, Jawline, Augen, Hautbild und mehr. Du erhältst einen ehrlichen Looks Score von 1-10.",
    details: [
      "Gesichtssymmetrie-Analyse",
      "Jawline & Kieferpartie-Bewertung",
      "Augen & Augenbrauen-Analyse",
      "Hautbild-Beurteilung",
      "Haar-Styling-Feedback",
      "Körperproportionen (optional)"
    ]
  },
  {
    icon: Target,
    title: "Stärken & Schwächen",
    description: "Erfahre genau, was bereits gut an dir aussieht und wo das größte Verbesserungspotenzial liegt. Keine vagen Aussagen – konkrete, actionable Insights.",
    details: [
      "Detaillierte Stärken-Liste",
      "Ehrliche Schwächen-Analyse",
      "Priorisierte Empfehlungen",
      "Vergleich mit Durchschnitt",
      "Verbesserungspotenzial in %"
    ]
  },
  {
    icon: TrendingUp,
    title: "Personalisierter Looksmax-Plan",
    description: "Basierend auf deiner Analyse erstellen wir einen maßgeschneiderten Plan mit konkreten Schritten zur Optimierung deines Erscheinungsbildes.",
    details: [
      "Skincare-Routine",
      "Haarpflege & Styling",
      "Fitness & Körperhaltung",
      "Ernährungs-Tipps",
      "Style-Empfehlungen",
      "Schritt-für-Schritt Anleitung"
    ]
  },
  {
    icon: Sparkles,
    title: "KI-Coach 24/7",
    description: "Dein persönlicher Looksmaxing-Berater ist immer für dich da. Stelle Fragen, hole dir Tipps und erhalte ehrliches Feedback basierend auf deiner Analyse.",
    details: [
      "Unbegrenzte Chat-Nachrichten",
      "Personalisierte Beratung",
      "Zugriff auf deine Analyse",
      "Produktempfehlungen",
      "Motivations-Support",
      "Ehrliches, direktes Feedback"
    ]
  },
  {
    icon: Crown,
    title: "Progress Tracking",
    description: "Verfolge deine Fortschritte über Zeit. Lade regelmäßig neue Fotos hoch und sieh, wie sich dein Score verbessert.",
    details: [
      "Vorher/Nachher-Vergleiche",
      "Score-Verlauf über Zeit",
      "Meilenstein-Tracking",
      "Fortschritts-Statistiken",
      "Motivations-Badges"
    ]
  }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück zur Startseite</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Features</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Alles was du brauchst für dein <span className="text-gradient">Glow-Up</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            FaceRank kombiniert moderne KI-Technologie mit bewährten Looksmaxing-Strategien, 
            um dir einen klaren Weg zu deinem Glow-Up zu zeigen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
            >
              {/* Icon & Title */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{feature.title}</h2>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                
                {/* Details List */}
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Placeholder */}
              <div className="flex-1 w-full">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-border flex items-center justify-center">
                  <feature.icon className="w-24 h-24 text-primary/30" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/30">
          <h2 className="text-2xl font-bold mb-3">Bereit für dein Glow-Up?</h2>
          <p className="text-muted-foreground mb-6">
            Starte jetzt kostenlos und entdecke dein volles Potenzial.
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg">
              <Sparkles className="w-5 h-5" />
              Jetzt kostenlos starten
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
