import { ArrowLeft, Sparkles, Target, Brain, TrendingUp, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Features() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t("features.aiAnalysisTitle"),
      description: t("features.aiAnalysisDesc"),
      details: [
        t("features.aiAnalysis.1"),
        t("features.aiAnalysis.2"),
        t("features.aiAnalysis.3"),
        t("features.aiAnalysis.4"),
        t("features.aiAnalysis.5"),
        t("features.aiAnalysis.6"),
      ]
    },
    {
      icon: Target,
      title: t("features.strengthsTitle"),
      description: t("features.strengthsDesc"),
      details: [
        t("features.strengths.1"),
        t("features.strengths.2"),
        t("features.strengths.3"),
        t("features.strengths.4"),
        t("features.strengths.5"),
      ]
    },
    {
      icon: TrendingUp,
      title: t("features.planTitle"),
      description: t("features.planDesc"),
      details: [
        t("features.plan.1"),
        t("features.plan.2"),
        t("features.plan.3"),
        t("features.plan.4"),
        t("features.plan.5"),
        t("features.plan.6"),
      ]
    },
    {
      icon: Sparkles,
      title: t("features.coachTitle"),
      description: t("features.coachDesc"),
      details: [
        t("features.coach.1"),
        t("features.coach.2"),
        t("features.coach.3"),
        t("features.coach.4"),
        t("features.coach.5"),
        t("features.coach.6"),
      ]
    },
    {
      icon: Crown,
      title: t("features.progressTitle"),
      description: t("features.progressDesc"),
      details: [
        t("features.tracking.1"),
        t("features.tracking.2"),
        t("features.tracking.3"),
        t("features.tracking.4"),
        t("features.tracking.5"),
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t("features.backToHome")}</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t("features.badge")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("features.heroTitle1")} <span className="text-gradient">{t("features.heroTitle2")}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.heroSubtitle")}
          </p>
        </div>

        <div className="space-y-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
            >
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{feature.title}</h2>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-border flex items-center justify-center">
                  <feature.icon className="w-24 h-24 text-primary/30" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/30">
          <h2 className="text-2xl font-bold mb-3">{t("features.readyForGlowUp")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("features.startFreeDiscover")}
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg">
              <Sparkles className="w-5 h-5" />
              {t("features.startFree")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}