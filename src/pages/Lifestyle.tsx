import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, AlertTriangle, Droplets, Moon, CheckCircle2, Calculator, Camera, GlassWater, CalendarDays, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLifestyle } from "@/hooks/useLifestyle";
import { LifestyleTracker } from "@/components/lifestyle/LifestyleTracker";
import { SupplementTracker } from "@/components/lifestyle/SupplementTracker";
import { FastingTimer } from "@/components/lifestyle/FastingTimer";
import { NutritionTracker } from "@/components/lifestyle/NutritionTracker";
import { BodyMeasurementsTracker } from "@/components/lifestyle/BodyMeasurementsTracker";
import { AdvancedStatistics } from "@/components/lifestyle/AdvancedStatistics";
import { MoodTracker } from "@/components/lifestyle/MoodTracker";
import { ActivityTracker } from "@/components/lifestyle/ActivityTracker";
import { RecipeDatabase } from "@/components/lifestyle/RecipeDatabase";
import { GroceryListTracker } from "@/components/lifestyle/GroceryListTracker";
import { AIFoodScanner } from "@/components/lifestyle/AIFoodScanner";
import { WaterTrackerAdvanced } from "@/components/lifestyle/WaterTrackerAdvanced";
import { MealPlanner } from "@/components/lifestyle/MealPlanner";
import { CalorieCalculator } from "@/components/lifestyle/CalorieCalculator";
import { MotivationCard } from "@/components/lifestyle/MotivationCard";
import { FoodSearch } from "@/components/lifestyle/FoodSearch";
import { HealthConnectCard } from "@/components/lifestyle/HealthConnectCard";
import { ProgressPhotosTracker } from "@/components/lifestyle/ProgressPhotosTracker";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeeklyChallengeCard } from "@/components/challenges/WeeklyChallengeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, UtensilsCrossed, Timer, Ruler, BarChart3, Smile, Footprints, ChefHat, ShoppingCart } from "lucide-react";
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
      <div className="container max-w-5xl mx-auto px-4 py-8">
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
          <p className="text-sm text-muted-foreground">Tracke Schlaf, Ernährung, Körpermaße & mehr</p>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="daily" className="flex flex-col gap-1 py-2">
              <Moon className="h-4 w-4" />
              <span className="text-xs">Tägliches</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col gap-1 py-2">
              <Footprints className="h-4 w-4" />
              <span className="text-xs">Aktivität</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex flex-col gap-1 py-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-xs">Ernährung</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex flex-col gap-1 py-2">
              <ChefHat className="h-4 w-4" />
              <span className="text-xs">Rezepte</span>
            </TabsTrigger>
            <TabsTrigger value="grocery" className="flex flex-col gap-1 py-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs">Einkauf</span>
            </TabsTrigger>
            <TabsTrigger value="body" className="flex flex-col gap-1 py-2">
              <Ruler className="h-4 w-4" />
              <span className="text-xs">Körper</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex flex-col gap-1 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Statistik</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Tracking Tab */}
          <TabsContent value="daily" className="space-y-6">
            {/* Motivation Tip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <MotivationCard />
            </motion.div>

            {/* Weekly Tracker */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <LifestyleTracker onDateChange={setSelectedDate} />
            </motion.div>

            {/* Health Alerts */}
            <HealthAlerts />

            {/* Water & Fasting Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <WaterTrackerAdvanced />
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <FastingTimer />
              </motion.div>
            </div>

            {/* Supplements & Health Connect */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SupplementTracker selectedDate={selectedDate} />
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <HealthConnectCard />
              </motion.div>
            </div>

            {/* Goals & Challenges */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <GoalCard currentScore={currentScore} />
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <WeeklyChallengeCard />
              </motion.div>
            </div>
          </TabsContent>


          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ActivityTracker />
            </motion.div>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-6">
            {/* AI Scanner & Food Search */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <AIFoodScanner />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                  <CardContent className="p-4">
                    <FoodSearch mealType="lunch" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <NutritionTracker />
            </motion.div>

            {/* Meal Planner & Calorie Calculator */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <MealPlanner />
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <CalorieCalculator />
              </motion.div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <FastingTimer />
            </motion.div>
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <RecipeDatabase />
            </motion.div>
          </TabsContent>

          {/* Grocery List Tab */}
          <TabsContent value="grocery" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GroceryListTracker />
            </motion.div>
          </TabsContent>

          {/* Body Measurements Tab */}
          <TabsContent value="body" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <BodyMeasurementsTracker />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ProgressPhotosTracker />
            </motion.div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AdvancedStatistics />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
