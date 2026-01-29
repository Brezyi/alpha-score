import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWaterTracker } from "@/hooks/useWaterTracker";
import { Droplets, Plus, Minus, Settings, Bell, GlassWater, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [150, 250, 330, 500];

export function WaterTrackerAdvanced() {
  const { 
    todayTotal, 
    todayTotalLiters, 
    reminder,
    loading, 
    addWater, 
    removeLastLog,
    updateReminder 
  } = useWaterTracker();
  const [customAmount, setCustomAmount] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dailyGoal = reminder?.daily_goal_liters || 2.5;
  const progress = Math.min(100, (todayTotalLiters / dailyGoal) * 100);
  const remaining = Math.max(0, dailyGoal - todayTotalLiters);

  const handleAddCustom = () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      addWater(amount);
      setCustomAmount("");
    }
  };

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-48" /></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-400" />
            Wasser Tracker
          </CardTitle>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Wasser Einstellungen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tägliches Ziel (Liter)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="6"
                    value={reminder?.daily_goal_liters || 2.5}
                    onChange={(e) => updateReminder({ daily_goal_liters: parseFloat(e.target.value) })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Erinnerungen</Label>
                    <p className="text-xs text-muted-foreground">Push-Benachrichtigungen</p>
                  </div>
                  <Switch
                    checked={reminder?.is_enabled ?? true}
                    onCheckedChange={(checked) => updateReminder({ is_enabled: checked })}
                  />
                </div>

                {reminder?.is_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Intervall (Stunden)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={reminder?.reminder_interval_hours || 2}
                        onChange={(e) => updateReminder({ reminder_interval_hours: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Startzeit</Label>
                        <Input
                          type="time"
                          value={reminder?.start_time || "08:00"}
                          onChange={(e) => updateReminder({ start_time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Endzeit</Label>
                        <Input
                          type="time"
                          value={reminder?.end_time || "22:00"}
                          onChange={(e) => updateReminder({ end_time: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Circle */}
        <div className="relative flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} 283`}
                className="text-cyan-400 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <GlassWater className="h-6 w-6 text-cyan-400 mb-1" />
              <span className="text-2xl font-bold">{todayTotalLiters.toFixed(1)}L</span>
              <span className="text-xs text-muted-foreground">von {dailyGoal}L</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center text-sm">
          {progress >= 100 ? (
            <p className="text-green-500 font-medium">🎉 Ziel erreicht!</p>
          ) : (
            <p className="text-muted-foreground">Noch {remaining.toFixed(1)}L übrig</p>
          )}
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => addWater(amount)}
              className="flex flex-col h-auto py-2"
            >
              <Plus className="h-3 w-3 mb-0.5" />
              <span className="text-xs">{amount}ml</span>
            </Button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="ml eingeben..."
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddCustom} disabled={!customAmount}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={removeLastLog}>
            <Undo2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
