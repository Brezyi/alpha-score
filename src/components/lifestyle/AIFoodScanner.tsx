import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNutrition } from "@/hooks/useNutrition";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Sparkles, Plus, ScanLine } from "lucide-react";
import { format } from "date-fns";

export function AIFoodScanner() {
  const { addMeal, selectedDate } = useNutrition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | null>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    
    // Analyze with AI
    setIsAnalyzing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke("ai-food-scanner", {
          body: { image: base64 }
        });

        if (error) throw error;
        
        if (data?.food_name) {
          setResult({
            food_name: data.food_name,
            calories: data.calories || 0,
            protein_g: data.protein_g || 0,
            carbs_g: data.carbs_g || 0,
            fat_g: data.fat_g || 0
          });
        } else {
          toast({
            title: "Keine Mahlzeit erkannt",
            description: "Bitte versuche es mit einem anderen Foto.",
            variant: "destructive"
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error analyzing food:", error);
      toast({
        title: "Fehler bei der Analyse",
        description: "Das Foto konnte nicht analysiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMeal = async () => {
    if (!result) return;

    await addMeal({
      entry_date: format(selectedDate, "yyyy-MM-dd"),
      meal_type: mealType,
      food_name: result.food_name,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      fiber_g: null,
      barcode: null,
      serving_size: null,
      notes: "KI-erkannt"
    });

    setIsOpen(false);
    setPreviewUrl(null);
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Camera className="h-4 w-4" />
          <Sparkles className="h-3 w-3 text-primary" />
          KI Food Scanner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI Food Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Food preview" 
                className="max-h-48 mx-auto rounded-lg object-cover"
              />
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Klicke hier um ein Foto deiner Mahlzeit zu machen
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Analysiere Mahlzeit...</span>
            </div>
          )}

          {/* Result */}
          {result && !isAnalyzing && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{result.food_name}</h4>
                  <span className="text-sm text-primary font-medium">{result.calories} kcal</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 bg-red-500/10 rounded">
                    <p className="text-muted-foreground text-xs">Protein</p>
                    <p className="font-medium">{result.protein_g}g</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded">
                    <p className="text-muted-foreground text-xs">Carbs</p>
                    <p className="font-medium">{result.carbs_g}g</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded">
                    <p className="text-muted-foreground text-xs">Fett</p>
                    <p className="font-medium">{result.fat_g}g</p>
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Mahlzeit hinzufügen als:</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={mealType === type ? "default" : "outline"}
                        onClick={() => setMealType(type)}
                        className="text-xs"
                      >
                        {type === "breakfast" && "Früh"}
                        {type === "lunch" && "Mittag"}
                        {type === "dinner" && "Abend"}
                        {type === "snack" && "Snack"}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={handleAddMeal}>
                  <Plus className="h-4 w-4" />
                  Hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
