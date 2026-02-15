import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Moon, Droplets, CheckCircle2, AlertTriangle, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLifestyle } from "@/hooks/useLifestyle";
import { LifestyleTracker } from "@/components/lifestyle/LifestyleTracker";
import { SupplementTracker } from "@/components/lifestyle/SupplementTracker";
import { FastingTimer } from "@/components/lifestyle/FastingTimer";
import { MoodTracker } from "@/components/lifestyle/MoodTracker";
import { WaterTrackerAdvanced } from "@/components/lifestyle/WaterTrackerAdvanced";
import { MotivationCard } from "@/components/lifestyle/MotivationCard";
import { StepsCaloriesTracker } from "@/components/lifestyle/StepsCaloriesTracker";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeeklyChallengeCard } from "@/components/challenges/WeeklyChallengeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";
import { MobileLifestyleContent } from "@/components/mobile/MobileLifestyleContent";

// Health Alert Component
function HealthAlerts() {
  const { todayEntry } = useLifestyle();
  
  const alerts = [];
  
  if (todayEntry?.sleep_hours && todayEntry.sleep_hours < 6) {
    alerts.push({
      type: "sleep",
      icon: Moon,
      message: `Nur ${todayEntry.sleep_hours}h geschlafen – gönn dir mehr Ruhe!`
    });
  }
  
  if (todayEntry?.water_liters && todayEntry.water_liters < 1.5) {
    alerts.push({
      type: "water",
      icon: Droplets,
      message: `Nur ${todayEntry.water_liters}L getrunken – trink mehr Wasser!`
    });
  }

  if (todayEntry && alerts.length === 0 && todayEntry.sleep_hours && todayEntry.water_liters) {
    if (todayEntry.sleep_hours >= 7 && todayEntry.water_liters >= 2) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-success">Alles im grünen Bereich!</p>
                  <p className="text-xs text-muted-foreground">Gut geschlafen und genug getrunken.</p>
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
      className="space-y-3"
    >
      {alerts.map((alert) => (
        <Card key={alert.type} className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <p className="text-sm">{alert.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

export default function Lifestyle() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading, createCheckout } = useSubscription();
  const { todayEntry, updateTodayEntry, loading: lifestyleLoading } = useLifestyle();
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [showSleepTracker, setShowSleepTracker] = useState(false);
  const [showSupplements, setShowSupplements] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();

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

  // Native mobile layout
  if (isNative) {
    return (
      <MobileAppLayout title="Lifestyle" showLogo={false} showBack>
        <MobileLifestyleContent
          todayEntry={todayEntry ? {
            sleep_hours: todayEntry.sleep_hours,
            sleep_quality: null,
            water_liters: todayEntry.water_liters,
            exercise_minutes: todayEntry.exercise_minutes,
            sleep_bedtime: null,
            sleep_waketime: null
          } : null}
          onUpdateSleep={(hours) => updateTodayEntry({ sleep_hours: hours })}
          onUpdateWater={(liters) => updateTodayEntry({ water_liters: liters })}
          onOpenSleepTracker={() => setShowSleepTracker(true)}
          onOpenSupplements={() => setShowSupplements(true)}
        />
      </MobileAppLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tägliches Tracking</h1>
              <p className="text-sm text-muted-foreground mt-1">Deine Gewohnheiten auf einen Blick</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Premium
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-8">
          {/* Weekly Tracker */}
          <motion.div {...fadeUp(0.05)} data-tour="main-tracker">
            <LifestyleTracker onDateChange={setSelectedDate} />
          </motion.div>

          {/* Health Alerts */}
          <HealthAlerts />

          {/* Motivation */}
          <motion.div {...fadeUp(0.1)}>
            <MotivationCard />
          </motion.div>

          {/* Steps & Calories + Mood in a grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp(0.15)}>
              <StepsCaloriesTracker selectedDate={selectedDate} />
            </motion.div>
            <motion.div {...fadeUp(0.2)}>
              <MoodTracker selectedDate={selectedDate} />
            </motion.div>
          </div>

          {/* Water & Fasting */}
          <div className="grid md:grid-cols-2 gap-6 auto-rows-fr">
            <motion.div className="h-full [&>div]:h-full" {...fadeUp(0.25)}>
              <WaterTrackerAdvanced />
            </motion.div>
            <motion.div className="h-full [&>div]:h-full" {...fadeUp(0.3)}>
              <FastingTimer />
            </motion.div>
          </div>

          {/* Supplements */}
          <motion.div {...fadeUp(0.35)}>
            <SupplementTracker selectedDate={selectedDate} />
          </motion.div>

          {/* Goals & Challenges */}
          <div className="grid md:grid-cols-2 gap-6 auto-rows-fr">
            <motion.div className="h-full [&>div]:h-full" {...fadeUp(0.4)}>
              <GoalCard currentScore={currentScore} />
            </motion.div>
            <motion.div className="h-full [&>div]:h-full" {...fadeUp(0.45)}>
              <WeeklyChallengeCard />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
