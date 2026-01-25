import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Moon, 
  Sun,
  Clock,
  Target,
  Star,
  Check, 
  Loader2,
  Settings2,
  Bed,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface SleepTrackerProps {
  className?: string;
}

interface SleepGoal {
  id: string;
  user_id: string;
  target_hours: number;
  target_bedtime: string | null;
  target_waketime: string | null;
  reminder_enabled?: boolean;
  reminder_minutes_before?: number;
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
  const { isSubscribed, isSupported, subscribe } = usePushNotifications();
  
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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);

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
        if (goalData.reminder_enabled !== undefined) setReminderEnabled(goalData.reminder_enabled);
        if (goalData.reminder_minutes_before) setReminderMinutes(goalData.reminder_minutes_before);
      }
      
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
    
    // If enabling reminders and not subscribed to push, subscribe first
    if (reminderEnabled && !isSubscribed && isSupported) {
      const subscribed = await subscribe();
      if (!subscribed) {
        toast({ 
          title: "Benachrichtigungen erforderlich", 
          description: "Bitte erlaube Benachrichtigungen für Schlaf-Erinnerungen.",
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }
    }
    
    const { error } = await supabase
      .from("user_sleep_goals")
      .upsert({
        user_id: user.id,
        target_hours: targetHours,
        target_bedtime: targetBedtime,
        target_waketime: targetWaketime,
        reminder_enabled: reminderEnabled,
        reminder_minutes_before: reminderMinutes
      }, { onConflict: "user_id" });
    
    if (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } else {
      toast({ 
        title: "Schlafziel gespeichert ✓"
      });
      setSleepGoal({
        id: sleepGoal?.id || "",
        user_id: user.id,
        target_hours: targetHours,
        target_bedtime: targetBedtime,
        target_waketime: targetWaketime,
        reminder_enabled: reminderEnabled,
        reminder_minutes_before: reminderMinutes
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
            Schlaf
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={() => setShowGoalSettings(!showGoalSettings)}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Ziel
            {showGoalSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Settings Panel */}
        <AnimatePresence>
          {showGoalSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-muted/50 rounded-lg p-4 space-y-4 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4 text-primary" />
                  Schlafziel
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Stunden</Label>
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
                  <div className="space-y-1">
                    <Label className="text-xs">Bettzeit</Label>
                    <Input
                      type="time"
                      value={targetBedtime}
                      onChange={(e) => setTargetBedtime(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Aufstehen</Label>
                    <Input
                      type="time"
                      value={targetWaketime}
                      onChange={(e) => setTargetWaketime(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                
                {/* Reminder Settings */}
                {isSupported && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label className="text-sm flex items-center gap-2">
                      {reminderEnabled ? (
                        <Bell className="w-4 h-4 text-primary" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      Erinnerung
                    </Label>
                    <Switch
                      checked={reminderEnabled}
                      onCheckedChange={setReminderEnabled}
                    />
                  </div>
                )}
                
                <Button onClick={handleSaveGoal} size="sm" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Speichern
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Sleep Input */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Eingeschlafen
            </Label>
            <Input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="text-center"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
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
            <span className="text-xs text-muted-foreground">Schlafdauer</span>
          </div>
          <div className="text-3xl font-bold">{calculatedHours}h</div>
          
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
              <Progress value={goalProgress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Sleep Quality - Simplified */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Qualität
          </Label>
          <div className="flex gap-1.5">
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
                    "w-4 h-4 mx-auto",
                    quality >= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                  )} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
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
          {todayEntry?.sleep_bedtime ? "Aktualisieren" : "Speichern"}
        </Button>
      </CardContent>
    </Card>
  );
}
