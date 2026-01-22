import { 
  Camera, 
  Brain, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Shield,
  Sparkles,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Foto-Analyse",
    description: "Lade 1-3 Fotos hoch und erhalte eine präzise Bewertung deines Aussehens.",
  },
  {
    icon: Brain,
    title: "KI-Bewertung",
    description: "Unsere KI analysiert Gesichtssymmetrie, Jawline, Augen, Haut und mehr.",
  },
  {
    icon: Target,
    title: "Looks Score",
    description: "Erhalte einen objektiven Score von 1-10 mit detaillierter Aufschlüsselung.",
  },
  {
    icon: Sparkles,
    title: "Personalisierter Plan",
    description: "Individuelle Empfehlungen für Skincare, Haare, Fitness und Style.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Verfolge deine Entwicklung mit Vorher/Nachher-Vergleichen und Statistiken.",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen persönlichen Looksmaxing-Berater – 24/7.",
  },
];

const Features = () => {
  return (
    <section className="relative py-24 overflow-hidden" id="features">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Alles was du brauchst für <span className="text-gradient">maximale Attraktivität</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Wissenschaftlich fundierte Tools, die dir helfen, das Beste aus deinem Aussehen herauszuholen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 mt-16 text-muted-foreground">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm">Deine Daten sind sicher und verschlüsselt</span>
        </div>
      </div>
    </section>
  );
};

export default Features;