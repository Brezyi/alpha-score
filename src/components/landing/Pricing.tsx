import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Lock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "für immer",
    description: "Starte kostenlos und entdecke dein Potenzial.",
    features: [
      "Basisprofil erstellen",
      "1 Foto-Analyse (Teaser)",
      "Looks Score (ohne Details)",
      "Community-Zugang",
    ],
    limitations: [
      "Keine detaillierte Analyse",
      "Kein personalisierter Plan",
      "Kein AI Coach",
    ],
    cta: "Kostenlos starten",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Premium",
    price: "9,99€",
    period: "/ Monat",
    description: "Voller Zugang zu allen Premium-Features.",
    features: [
      "Unbegrenzte Foto-Analysen",
      "Detaillierter Looks Score",
      "Personalisierter Looksmax-Plan",
      "AI Coach 24/7",
      "Progress Tracking",
      "Vorher/Nachher-Vergleiche",
      "Prioritäts-Support",
    ],
    limitations: [],
    cta: "Premium werden",
    variant: "premium" as const,
    popular: true,
    icon: Crown,
  },
  {
    name: "Lifetime",
    price: "49,99€",
    period: "einmalig",
    description: "Einmal zahlen, für immer nutzen.",
    features: [
      "Unbegrenzte Foto-Analysen",
      "Detaillierter Looks Score",
      "Personalisierter Looksmax-Plan",
      "AI Coach 24/7",
      "Progress Tracking",
      "Vorher/Nachher-Vergleiche",
      "Prioritäts-Support",
      "Keine Abo-Bindung",
    ],
    limitations: [],
    cta: "Jetzt freischalten",
    variant: "outline" as const,
    popular: false,
    icon: Zap,
  },
];

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { createCheckout, isPremium, subscriptionType } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePurchase = async (planName: string) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Bitte melde dich an, um Premium zu kaufen.",
        });
        navigate("/login");
        return;
      }

      setLoading(planName);
      
      if (planName === "Premium") {
        await createCheckout("premium");
      } else if (planName === "Lifetime") {
        await createCheckout("lifetime");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Zahlung konnte nicht gestartet werden",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden" id="pricing">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Investiere in <span className="text-gradient">dich selbst</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Wähle den Plan, der zu dir passt. Jederzeit kündbar.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular 
                  ? "glass-card border-primary/50 glow-box scale-105" 
                  : "glass-card hover:border-primary/30"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    Beliebteste Wahl
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                {plan.icon && (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-gradient">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Lock className="w-3 h-3" />
                    </div>
                    <span className="text-sm line-through">{limitation}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.name === "Free" ? (
                <Link to="/register" className="block">
                  <Button 
                    variant={plan.variant} 
                    size="lg" 
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant={plan.variant} 
                  size="lg" 
                  className="w-full"
                  onClick={() => handlePurchase(plan.name)}
                  disabled={loading !== null || (isPremium && (subscriptionType === "lifetime" || (subscriptionType === "premium" && plan.name === "Premium")))}
                >
                  {loading === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird geladen...
                    </>
                  ) : isPremium && (subscriptionType === "lifetime" || (subscriptionType === "premium" && plan.name === "Premium")) ? (
                    "Bereits aktiviert ✓"
                  ) : (
                    plan.cta
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-12 text-muted-foreground text-sm">
          <p>🔒 14 Tage Geld-zurück-Garantie · Keine versteckten Kosten</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;