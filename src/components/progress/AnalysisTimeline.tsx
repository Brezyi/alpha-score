import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressImage } from "@/components/ProgressImage";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronLeft,
  ChevronRight,
  Camera,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface Analysis {
  id: string;
  looks_score: number | null;
  potential_score: number | null;
  created_at: string;
  status: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  photo_urls: string[];
  signedPhotoUrls?: (string | null)[];
}

interface AnalysisTimelineProps {
  analyses: Analysis[];
  className?: string;
}

export function AnalysisTimeline({ analyses, className }: AnalysisTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  if (analyses.length === 0) {
    return null;
  }

  const selectedAnalysis = analyses[selectedIndex];
  const previousAnalysis = analyses[selectedIndex + 1];
  
  const scoreDiff = selectedAnalysis?.looks_score !== null && previousAnalysis?.looks_score !== null
    ? selectedAnalysis.looks_score - previousAnalysis.looks_score
    : null;

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < analyses.length - 1;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd. MMMM yyyy", { locale: de });
  };

  const formatShortDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd.MM.yy", { locale: de });
  };

  return (
    <Card className={cn("p-6 glass-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Deine Timeline</h2>
            <p className="text-xs text-muted-foreground">{analyses.length} Analysen</p>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedIndex(prev => prev - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {selectedIndex + 1} / {analyses.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedIndex(prev => prev + 1)}
            disabled={!canGoNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Dots */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
        <div className="flex justify-between relative">
          {analyses.slice(0, 10).map((analysis, index) => {
            const isSelected = index === selectedIndex;
            const score = analysis.looks_score;
            
            return (
              <button
                key={analysis.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative z-10 flex flex-col items-center gap-1 transition-all",
                  isSelected ? "scale-110" : "hover:scale-105"
                )}
              >
                <motion.div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    isSelected 
                      ? "bg-primary border-primary scale-125" 
                      : "bg-background border-muted-foreground/30 hover:border-primary/50"
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {score?.toFixed(1) || "-"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Analysis Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAnalysis.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Photo */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
            {selectedAnalysis.signedPhotoUrls?.[0] ? (
              <ProgressImage
                src={selectedAnalysis.signedPhotoUrls[0]}
                alt="Analyse Foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Score Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-2xl font-bold text-primary">
                  {selectedAnalysis.looks_score?.toFixed(1) || "-"}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              
              {scoreDiff !== null && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold",
                  scoreDiff > 0 && "bg-green-500/20 text-green-500",
                  scoreDiff < 0 && "bg-red-500/20 text-red-500",
                  scoreDiff === 0 && "bg-muted text-muted-foreground"
                )}>
                  {scoreDiff > 0 ? <TrendingUp className="w-4 h-4" /> :
                   scoreDiff < 0 ? <TrendingDown className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                  {scoreDiff > 0 && "+"}{scoreDiff.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Datum</div>
              <div className="font-semibold">{formatDate(selectedAnalysis.created_at)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Score</div>
                <div className="text-xl font-bold">{selectedAnalysis.looks_score?.toFixed(1) || "-"}</div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Potenzial</div>
                <div className="text-xl font-bold text-primary">{selectedAnalysis.potential_score?.toFixed(1) || "-"}</div>
              </div>
            </div>

            {/* Strengths & Weaknesses Preview */}
            {selectedAnalysis.strengths && selectedAnalysis.strengths.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-green-500" />
                  Stärken
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedAnalysis.strengths.slice(0, 3).map((strength, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedAnalysis.weaknesses && selectedAnalysis.weaknesses.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Verbesserungspotenzial</div>
                <div className="flex flex-wrap gap-1">
                  {selectedAnalysis.weaknesses.slice(0, 3).map((weakness, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs">
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link to={`/analysis/${selectedAnalysis.id}`}>
              <Button variant="outline" className="w-full mt-2">
                Vollständige Analyse ansehen
              </Button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Comparison with Previous */}
      {previousAnalysis && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground mb-3">
            Vergleich mit vorheriger Analyse ({formatShortDate(previousAnalysis.created_at)})
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">Vorher</div>
              <div className="font-bold">{previousAnalysis.looks_score?.toFixed(1) || "-"}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-xs text-muted-foreground mb-1">Nachher</div>
              <div className="font-bold text-primary">{selectedAnalysis.looks_score?.toFixed(1) || "-"}</div>
            </div>
            <div className={cn(
              "text-center p-3 rounded-lg",
              scoreDiff && scoreDiff > 0 ? "bg-green-500/10" :
              scoreDiff && scoreDiff < 0 ? "bg-red-500/10" : "bg-muted/20"
            )}>
              <div className="text-xs text-muted-foreground mb-1">Änderung</div>
              <div className={cn(
                "font-bold",
                scoreDiff && scoreDiff > 0 ? "text-green-500" :
                scoreDiff && scoreDiff < 0 ? "text-red-500" : ""
              )}>
                {scoreDiff !== null ? (scoreDiff > 0 ? "+" : "") + scoreDiff.toFixed(1) : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
