import { Link } from "react-router-dom";
import { ArrowLeft, Crown, AlertTriangle, Droplets, Moon, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLifestyle } from "@/hooks/useLifestyle";
import { LifestyleTracker } from "@/components/lifestyle/LifestyleTracker";
import { SleepTracker } from "@/components/lifestyle/SleepTracker";
import { SupplementTracker } from "@/components/lifestyle/SupplementTracker";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeeklyChallengeCard } from "@/components/challenges/WeeklyChallengeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Health Alert Component
function HealthAlerts() {
  const { todayEntry } = useLifestyle();
  
  const alerts = [];
  
  // Check sleep (less than 6 hours is warning)
  if (todayEntry?.sleep_hours && todayEntry.sleep_hours < 6) {
    alerts.push({
      type: "sleep",
      icon: Moon,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/20",
      message: `Nur ${todayEntry.sleep_hours}h geschlafen – gönn dir mehr Ruhe!`
    });
  }
  
  // Check water (less than 1.5L is warning)
  if (todayEntry?.water_liters && todayEntry.water_liters < 1.5) {
    alerts.push({
      type: "water",
      icon: Droplets,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
      message: `Nur ${todayEntry.water_liters}L getrunken – trink mehr Wasser!`
    });
  }

  // Show positive message if everything is good
  if (todayEntry && alerts.length === 0 && todayEntry.sleep_hours && todayEntry.water_liters) {
    if (todayEntry.sleep_hours >= 7 && todayEntry.water_liters >= 2) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-400">Alles im grünen Bereich!</p>
                  <p className="text-xs text-muted-foreground">Du hast gut geschlafen und genug getrunken.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
  }

  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 space-y-3"
    >
      {alerts.map((alert) => (
        <Card key={alert.type} className={cn("border", alert.bgColor)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", alert.bgColor)}>
                <alert.icon className={cn("w-5 h-5", alert.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Achtung</span>
                </div>
                <p className="text-sm">{alert.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

export default function Lifestyle() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading, createCheckout } = useSubscription();
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchLatestScore = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("analyses")
        .select("looks_score")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.looks_score) setCurrentScore(data.looks_score);
    };
    fetchLatestScore();
  }, [user]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <motion.div className="text-center py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Premium Feature</h1>
            <p className="text-muted-foreground mb-8">Lifestyle Tracking, Supplements & Ziele nur für Premium.</p>
            <Button variant="hero" size="lg" onClick={() => createCheckout("premium")}>
              <Crown className="w-5 h-5 mr-2" />
              Premium werden
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Crown className="w-4 h-4" />
            Premium
          </div>
        </div>

        <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Lifestyle Tracker</h1>
          <p className="text-sm text-muted-foreground">Tracke Schlaf, Wasser & Supplements</p>
        </motion.div>

        {/* Health Alerts */}
        <HealthAlerts />

        {/* Main Grid - Simplified Layout */}
        <div className="grid gap-6">
          {/* Row 1: Sleep & Lifestyle side by side on desktop */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SleepTracker />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <LifestyleTracker />
            </motion.div>
          </div>
          
          {/* Row 2: Supplements full width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SupplementTracker />
          </motion.div>

          {/* Row 3: Goals & Challenges */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <GoalCard currentScore={currentScore} />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <WeeklyChallengeCard />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
