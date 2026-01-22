import { Upload, Cpu, FileText, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Fotos hochladen",
    description: "Lade 1-3 klare Fotos hoch – Frontal, Seite und optional Körper.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "KI-Analyse",
    description: "Unsere KI analysiert über 20 Gesichts- und Körpermerkmale.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Ergebnisse erhalten",
    description: "Du erhältst deinen Looks Score, Stärken und Schwächen.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Plan umsetzen",
    description: "Folge deinem personalisierten Looksmax-Plan und tracke den Fortschritt.",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-24 overflow-hidden" id="how-it-works">
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            So <span className="text-gradient">funktioniert's</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            In 4 einfachen Schritten zu deinem optimierten Aussehen.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Step Number & Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center glow-box">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 text-center md:text-left ${index % 2 !== 0 ? "md:text-right" : ""}`}>
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto md:mx-0">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;