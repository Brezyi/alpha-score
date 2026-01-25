import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Moon, 
  Sun,
  Clock,
  Target,
  Star,
  Check, 
  Loader2,
  Settings2,
  TrendingUp,
  Bed
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SleepTrackerProps {
  className?: string;
}

interface SleepGoal {
  id: string;
  user_id: string;
  target_hours: number;
  target_bedtime: string | null;
  target_waketime: string | null;
}

interface SleepEntry {
  sleep_hours: number | null;
  sleep_bedtime: string | null;
  sleep_waketime: string | null;
  sleep_quality: number | null;
  entry_date: string;
}

export function SleepTracker({ className }: SleepTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  
  // Sleep entry state
  const [bedtime, setBedtime] = useState("23:00");
  const [waketime, setWaketime] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [todayEntry, setTodayEntry] = useState<SleepEntry | null>(null);
  
  // Sleep goal state
  const [sleepGoal, setSleepGoal] = useState<SleepGoal | null>(null);
  const [targetHours, setTargetHours] = useState(8);
  const [targetBedtime, setTargetBedtime] = useState("23:00");
  const [targetWaketime, setTargetWaketime] = useState("07:00");
  
  // Weekly entries for stats
  const [weeklyEntries, setWeeklyEntries] = useState<SleepEntry[]>([]);

  // Calculate sleep duration from bedtime and waketime
  const calculatedHours = useMemo(() => {
    if (!bedtime || !waketime) return 0;
    
    const [bedH, bedM] = bedtime.split(":").map(Number);
    const [wakeH, wakeM] = waketime.split(":").map(Number);
    
    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;
    
    // If wake time is before bed time, add 24 hours
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60;
    }
    
    const durationMinutes = wakeMinutes - bedMinutes;
    return Math.round((durationMinutes / 60) * 10) / 10;
  }, [bedtime, waketime]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!sleepGoal?.target_hours) return 0;
    return Math.min(100, Math.round((calculatedHours / sleepGoal.target_hours) * 100));
  }, [calculatedHours, sleepGoal?.target_hours]);

  // Weekly average
  const weeklyAverage = useMemo(() => {
    const entriesWithSleep = weeklyEntries.filter(e => e.sleep_hours && e.sleep_hours > 0);
    if (entriesWithSleep.length === 0) return 0;
    const total = entriesWithSleep.reduce((acc, e) => acc + (e.sleep_hours || 0), 0);
    return Math.round((total / entriesWithSleep.length) * 10) / 10;
  }, [weeklyEntries]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch today's entry
      const { data: entryData } = await supabase
        .from("lifestyle_entries")
        .select("sleep_hours, sleep_bedtime, sleep_waketime, sleep_quality, entry_date")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .single();
      
      if (entryData) {
        setTodayEntry(entryData);
        if (entryData.sleep_bedtime) setBedtime(entryData.sleep_bedtime);
        if (entryData.sleep_waketime) setWaketime(entryData.sleep_waketime);
        if (entryData.sleep_quality) setQuality(entryData.sleep_quality);
      }
      
      // Fetch sleep goal
      const { data: goalData } = await supabase
        .from("user_sleep_goals")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (goalData) {
        setSleepGoal(goalData);
        setTargetHours(goalData.target_hours);
        if (goalData.target_bedtime) setTargetBedtime(goalData.target_bedtime);
        if (goalData.target_waketime) setTargetWaketime(goalData.target_waketime);
      }
      
      // Fetch last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekData } = await supabase
        .from("lifestyle_entries")
        .select("sleep_hours, sleep_bedtime, sleep_waketime, sleep_quality, entry_date")
        .eq("user_id", user.id)
        .gte("entry_date", weekAgo.toISOString().split("T")[0])
        .order("entry_date", { ascending: false });
      
      if (weekData) setWeeklyEntries(weekData);
      
      setLoading(false);
    };
    
    fetchData();
  }, [user]);

  const handleSaveSleep = async () => {
    if (!user) return;
    setSaving(true);
    
    const today = new Date().toISOString().split("T")[0];
    
    const { error } = await supabase
      .from("lifestyle_entries")
      .upsert({
        user_id: user.id,
        entry_date: today,
        sleep_hours: calculatedHours,
        sleep_bedtime: bedtime,
        sleep_waketime: waketime,
        sleep_quality: quality
      }, { onConflict: "user_id,entry_date" });
    
    if (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } else {
      toast({ title: "Schlaf gespeichert ✓" });
      setTodayEntry({
        sleep_hours: calculatedHours,
        sleep_bedtime: bedtime,
        sleep_waketime: waketime,
        sleep_quality: quality,
        entry_date: today
      });
    }
    
    setSaving(false);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase
      .from("user_sleep_goals")
      .upsert({
        user_id: user.id,
        target_hours: targetHours,
        target_bedtime: targetBedtime,
        target_waketime: targetWaketime
      }, { onConflict: "user_id" });
    
    if (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } else {
      toast({ title: "Schlafziel gespeichert ✓" });
      setSleepGoal({
        id: sleepGoal?.id || "",
        user_id: user.id,
        target_hours: targetHours,
        target_bedtime: targetBedtime,
        target_waketime: targetWaketime
      });
      setShowGoalSettings(false);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bed className="w-5 h-5 text-indigo-400" />
            Sleep Tracker
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setShowGoalSettings(!showGoalSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Goal Settings Panel */}
        {showGoalSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-muted/50 rounded-lg p-4 space-y-4"
          >
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Schlafziel einstellen
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ziel (Stunden)</Label>
                <Input
                  type="number"
                  value={targetHours}
                  onChange={(e) => setTargetHours(Number(e.target.value))}
                  min={4}
                  max={12}
                  step={0.5}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bettzeit</Label>
                <Input
                  type="time"
                  value={targetBedtime}
                  onChange={(e) => setTargetBedtime(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Aufstehen</Label>
                <Input
                  type="time"
                  value={targetWaketime}
                  onChange={(e) => setTargetWaketime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            
            <Button onClick={handleSaveGoal} size="sm" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ziel speichern
            </Button>
          </motion.div>
        )}

        {/* Main Sleep Input */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                Eingeschlafen
              </Label>
              <Input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Aufgewacht
              </Label>
              <Input
                type="time"
                value={waketime}
                onChange={(e) => setWaketime(e.target.value)}
                className="text-center"
              />
            </div>
          </div>
          
          {/* Calculated Duration */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-muted-foreground">Schlafdauer</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{calculatedHours}h</div>
            
            {sleepGoal && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Ziel: {sleepGoal.target_hours}h</span>
                  <span className={cn(
                    goalProgress >= 100 ? "text-green-500" : goalProgress >= 80 ? "text-amber-500" : "text-red-500"
                  )}>
                    {goalProgress}%
                  </span>
                </div>
                <Progress value={goalProgress} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Schlafqualität
          </Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setQuality(rating)}
                className={cn(
                  "flex-1 py-2 rounded-md transition-all",
                  quality >= rating 
                    ? "bg-amber-500/20 border-amber-500/50 border" 
                    : "bg-muted border border-transparent hover:border-muted-foreground/30"
                )}
              >
                <Star 
                  className={cn(
                    "w-5 h-5 mx-auto",
                    quality >= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                  )} 
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Schlecht</span>
            <span>Perfekt</span>
          </div>
        </div>

        {/* Weekly Stats */}
        {weeklyAverage > 0 && (
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Ø letzte 7 Tage
              </span>
              <span className="font-medium">{weeklyAverage}h</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={handleSaveSleep} 
            className="w-full"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {todayEntry?.sleep_bedtime ? "Aktualisieren" : "Schlaf speichern"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
