import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLifestyle } from "@/hooks/useLifestyle";
import { useBodyMeasurements } from "@/hooks/useBodyMeasurements";
import { BarChart3, TrendingUp, Moon, Droplets, Activity, Scale } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

interface WeeklyStats {
  avgSleep: number;
  avgWater: number;
  avgExercise: number;
  sleepGoalDays: number;
  waterGoalDays: number;
  exerciseGoalDays: number;
}

export function AdvancedStatistics() {
  const { entries } = useLifestyle();
  const { measurements, getTrend } = useBodyMeasurements();

  // Calculate weekly statistics
  const weeklyStats = useMemo((): WeeklyStats => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const weekEntries = entries.filter((e) => {
      const date = new Date(e.entry_date);
      return date >= weekStart && date <= weekEnd;
    });

    if (weekEntries.length === 0) {
      return {
        avgSleep: 0,
        avgWater: 0,
        avgExercise: 0,
        sleepGoalDays: 0,
        waterGoalDays: 0,
        exerciseGoalDays: 0,
      };
    }

    const sleepSum = weekEntries.reduce((acc, e) => acc + (e.sleep_hours || 0), 0);
    const waterSum = weekEntries.reduce((acc, e) => acc + (e.water_liters || 0), 0);
    const exerciseSum = weekEntries.reduce((acc, e) => acc + (e.exercise_minutes || 0), 0);

    return {
      avgSleep: sleepSum / weekEntries.length,
      avgWater: waterSum / weekEntries.length,
      avgExercise: exerciseSum / weekEntries.length,
      sleepGoalDays: weekEntries.filter((e) => (e.sleep_hours || 0) >= 7).length,
      waterGoalDays: weekEntries.filter((e) => (e.water_liters || 0) >= 2).length,
      exerciseGoalDays: weekEntries.filter((e) => (e.exercise_minutes || 0) >= 30).length,
    };
  }, [entries]);

  // Prepare chart data for last 7 days
  const weeklyChartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entries.find((e) => e.entry_date === dateStr);

      return {
        date: format(day, "EEE", { locale: de }),
        fullDate: format(day, "dd.MM"),
        sleep: entry?.sleep_hours || 0,
        water: entry?.water_liters || 0,
        exercise: entry?.exercise_minutes || 0,
      };
    });
  }, [entries]);

  // Weight trend data
  const weightData = useMemo(() => {
    return getTrend("weight_kg", 30).map((d) => ({
      date: format(new Date(d.date), "dd.MM"),
      weight: d.value,
    }));
  }, [getTrend]);

  return (
    <div className="space-y-4">
      {/* Weekly Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Wochenstatistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                <Moon className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold">{weeklyStats.avgSleep.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground">Ø Schlaf</div>
              <div className="text-xs text-green-500 mt-1">
                {weeklyStats.sleepGoalDays}/7 Tage ≥7h
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
                <Droplets className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold">{weeklyStats.avgWater.toFixed(1)}L</div>
              <div className="text-xs text-muted-foreground">Ø Wasser</div>
              <div className="text-xs text-green-500 mt-1">
                {weeklyStats.waterGoalDays}/7 Tage ≥2L
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{Math.round(weeklyStats.avgExercise)}m</div>
              <div className="text-xs text-muted-foreground">Ø Aktivität</div>
              <div className="text-xs text-green-500 mt-1">
                {weeklyStats.exerciseGoalDays}/7 Tage ≥30m
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Wochenverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      sleep: "Schlaf (h)",
                      water: "Wasser (L)",
                      exercise: "Aktivität (min)"
                    };
                    return [value, labels[name as string] || name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "11px" }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      sleep: "Schlaf",
                      water: "Wasser",
                      exercise: "Aktivität"
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="sleep" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exercise" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weight Trend */}
      {weightData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Gewichtsverlauf (30 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                    formatter={(value) => [`${value} kg`, "Gewicht"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#weightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
