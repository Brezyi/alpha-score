import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { checkSubscription, subscriptionType } = useSubscription();

  useEffect(() => {
    // Refresh subscription status
    checkSubscription();
  }, [checkSubscription]);

  const isLifetime = subscriptionType === "lifetime";
  const planLabel = isLifetime ? "Lifetime" : "Premium";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-card to-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLifetime ? (
              <Sparkles className="w-6 h-6 text-primary" />
            ) : (
              <Crown className="w-6 h-6 text-primary" />
            )}
            <span className="text-sm font-medium text-primary">{planLabel} aktiviert</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Willkommen bei {planLabel}!</h1>
          <p className="text-muted-foreground mb-8">
            Dein Upgrade war erfolgreich. Du hast jetzt {isLifetime ? "unbegrenzten" : ""} Zugang zu allen Premium-Features.
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              "Vollständige KI-Analyse",
              "Personalisierter Looksmax-Plan",
              "AI Coach ohne Limits",
              "Progress Tracking",
              ...(isLifetime ? ["Lebenslanger Zugang"] : []),
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={() => navigate("/upload")}
            >
              <Sparkles className="w-5 h-5" />
              Erste Analyse starten
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Zum Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
