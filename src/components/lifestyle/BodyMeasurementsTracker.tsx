import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBodyMeasurements, MeasurementField } from "@/hooks/useBodyMeasurements";
import { 
  Ruler, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Scale,
  Activity,
  CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const MEASUREMENT_CONFIG: { 
  field: MeasurementField; 
  label: string; 
  unit: string;
  icon: typeof Scale;
}[] = [
  { field: "weight_kg", label: "Gewicht", unit: "kg", icon: Scale },
  { field: "body_fat_percent", label: "Körperfett", unit: "%", icon: Activity },
  { field: "waist_cm", label: "Taille", unit: "cm", icon: CircleDot },
  { field: "hip_cm", label: "Hüfte", unit: "cm", icon: CircleDot },
  { field: "chest_cm", label: "Brust", unit: "cm", icon: CircleDot },
  { field: "arm_cm", label: "Oberarm", unit: "cm", icon: CircleDot },
  { field: "thigh_cm", label: "Oberschenkel", unit: "cm", icon: CircleDot },
];

export function BodyMeasurementsTracker() {
  const {
    measurements,
    loading,
    saveMeasurement,
    getLatest,
    getTrend,
    getChange,
    getWaistHipRatio,
  } = useBodyMeasurements();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedChart, setSelectedChart] = useState<MeasurementField>("weight_kg");

  const latest = getLatest();
  const whr = getWaistHipRatio();

  const handleSave = async () => {
    const data: Record<string, number | null> = {};
    MEASUREMENT_CONFIG.forEach(({ field }) => {
      data[field] = formData[field] ? parseFloat(formData[field]) : null;
    });

    await saveMeasurement(data);
    setFormData({});
    setShowForm(false);
  };

  const chartData = getTrend(selectedChart, 30).map((d) => ({
    ...d,
    dateLabel: format(new Date(d.date), "dd.MM", { locale: de }),
  }));

  const selectedChange = getChange(selectedChart);

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-64" /></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Körpermaße
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Schließen" : "Eintragen"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        {latest && (
          <div className="grid grid-cols-3 gap-3">
            {latest.weight_kg && (
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Scale className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold">{latest.weight_kg} kg</div>
                <div className="text-xs text-muted-foreground">Gewicht</div>
              </div>
            )}
            {latest.body_fat_percent && (
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold">{latest.body_fat_percent}%</div>
                <div className="text-xs text-muted-foreground">KFA</div>
              </div>
            )}
            {whr && (
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <CircleDot className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold">{whr}</div>
                <div className="text-xs text-muted-foreground">WHR</div>
              </div>
            )}
          </div>
        )}

        {/* Chart Selection */}
        <div className="flex flex-wrap gap-1">
          {MEASUREMENT_CONFIG.slice(0, 4).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => setSelectedChart(field)}
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-all",
                selectedChart === field
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {MEASUREMENT_CONFIG.find((c) => c.field === selectedChart)?.label} Verlauf
              </span>
              {selectedChange && (
                <span className={cn(
                  "flex items-center gap-1 text-sm",
                  selectedChange.direction === "down" ? "text-green-500" : 
                  selectedChange.direction === "up" ? "text-red-500" : 
                  "text-muted-foreground"
                )}>
                  {selectedChange.direction === "down" ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : selectedChange.direction === "up" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  {selectedChange.absolute > 0 ? "+" : ""}
                  {selectedChange.absolute.toFixed(1)}
                </span>
              )}
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="dateLabel" 
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
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <Label className="font-medium">Neue Messung</Label>
            
            <div className="grid grid-cols-2 gap-2">
              {MEASUREMENT_CONFIG.map(({ field, label, unit }) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label} ({unit})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={latest?.[field]?.toString() || ""}
                    value={formData[field] || ""}
                    onChange={(e) => 
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleSave}>
              Speichern
            </Button>
          </div>
        )}

        {/* Empty State */}
        {measurements.length === 0 && !showForm && (
          <div className="text-center py-6">
            <Ruler className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Messungen vorhanden
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowForm(true)}
            >
              Erste Messung eintragen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
