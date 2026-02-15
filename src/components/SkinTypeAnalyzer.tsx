import { useState, useRef } from "react";
import { Camera, Loader2, Droplets, Sun, Shield, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkinTypeResult {
  skinType: string;
  skinTypeName: string;
  confidence: number;
  characteristics: string[];
  recommendations: { category: string; product: string; reason: string }[];
  tips: string[];
}

const SKIN_TYPE_ICONS: Record<string, typeof Droplets> = {
  oily: Droplets,
  dry: Sun,
  combination: Sparkles,
  normal: Shield,
  sensitive: Shield,
};

const SKIN_TYPE_COLORS: Record<string, string> = {
  oily: "text-blue-500 bg-blue-500/10",
  dry: "text-amber-500 bg-amber-500/10",
  combination: "text-purple-500 bg-purple-500/10",
  normal: "text-emerald-500 bg-emerald-500/10",
  sensitive: "text-pink-500 bg-pink-500/10",
};

export function SkinTypeAnalyzer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkinTypeResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useProfile();
  const { t } = useLanguage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64
    setLoading(true);
    setResult(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result as string;
          resolve(result.split(",")[1]);
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-skin-type", {
        body: { 
          photoBase64: base64,
          gender: profile?.gender,
          country: profile?.country,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      console.error("Skin analysis error:", err);
      toast.error(err.message || t("skin.error"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const Icon = result ? SKIN_TYPE_ICONS[result.skinType] || Shield : Shield;
  const colorClass = result ? SKIN_TYPE_COLORS[result.skinType] || "text-primary bg-primary/10" : "";

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 w-full"
        onClick={() => { setOpen(true); reset(); }}
      >
        <Sparkles className="w-4 h-4" />
        {t("skin.detect")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("skin.title")}
            </DialogTitle>
            <DialogDescription>
              {t("skin.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            {!result && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center",
                  previewUrl && "p-0 border-0"
                )}
              >
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-2xl" />
                    {loading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">{t("skin.analyzing")}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("skin.upload")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("skin.uploadTip")}
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Skin Type Header */}
                  <div className="text-center p-6 rounded-2xl bg-card border border-border">
                    <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3", colorClass)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">{result.skinTypeName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round(result.confidence * 100)}% {t("skin.confidence")}
                    </p>
                  </div>

                  {/* Characteristics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("skin.characteristics")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.characteristics.map((c, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("skin.recommendations")}</h4>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{rec.category}</span>
                          </div>
                          <p className="text-sm font-medium">{rec.product}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("skin.tips")}</h4>
                    <ul className="space-y-1">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Retry */}
                  <Button variant="outline" className="w-full gap-2" onClick={reset}>
                    <Camera className="w-4 h-4" />
                    {t("skin.retry")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
