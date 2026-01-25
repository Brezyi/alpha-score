import { Link } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { LifestyleTracker } from "@/components/lifestyle/LifestyleTracker";
import { SleepTracker } from "@/components/lifestyle/SleepTracker";
import { SupplementTracker } from "@/components/lifestyle/SupplementTracker";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeeklyChallengeCard } from "@/components/challenges/WeeklyChallengeCard";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, TrendingUp, Pill, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        <div className="flex items-center justify-between mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Crown className="w-4 h-4" />
            Premium
          </div>
        </div>

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Lifestyle & Ziele</h1>
          <p className="text-muted-foreground">Tracke deinen Lifestyle für optimale Ergebnisse</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SleepTracker />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <LifestyleTracker />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GoalCard currentScore={currentScore} />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <WeeklyChallengeCard />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
            <SupplementTracker />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
