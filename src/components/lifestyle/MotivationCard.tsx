import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMotivation } from "@/hooks/useMotivation";
import { Sparkles, Heart, Dumbbell, Moon, Droplets, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  nutrition: Heart,
  fitness: Dumbbell,
  sleep: Moon,
  hydration: Droplets,
  mindset: Lightbulb,
  general: Sparkles
};

const CATEGORY_COLORS: Record<string, string> = {
  nutrition: "text-green-400 bg-green-500/10",
  fitness: "text-orange-400 bg-orange-500/10",
  sleep: "text-indigo-400 bg-indigo-500/10",
  hydration: "text-cyan-400 bg-cyan-500/10",
  mindset: "text-pink-400 bg-pink-500/10",
  general: "text-primary bg-primary/10"
};

export function MotivationCard() {
  const { todayTip, loading, logTipViewed } = useMotivation();

  useEffect(() => {
    if (todayTip) {
      logTipViewed(todayTip.id);
    }
  }, [todayTip, logTipViewed]);

  if (loading || !todayTip) {
    return null;
  }

  const Icon = CATEGORY_ICONS[todayTip.category] || Sparkles;
  const colorClass = CATEGORY_COLORS[todayTip.category] || CATEGORY_COLORS.general;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-primary mb-1">Tipp des Tages</p>
            <p className="text-sm leading-relaxed">{todayTip.tip_text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
