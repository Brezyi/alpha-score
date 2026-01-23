import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTestimonial } from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquarePlus, Trash2, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Analysis {
  id: string;
  looks_score: number | null;
  created_at: string;
}

export function TestimonialSubmitDialog() {
  const { user } = useAuth();
  const { testimonial, submitTestimonial, deleteTestimonial, loading } = useUserTestimonial(user?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [formData, setFormData] = useState({
    display_name: "",
    age: "",
    testimonial_text: "",
    analysis_id: "",
  });

  const fetchAnalyses = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("analyses")
      .select("id, looks_score, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);
    
    setAnalyses((data as Analysis[]) || []);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchAnalyses();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name || !formData.testimonial_text) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Validate age is at least 18
    if (formData.age && parseInt(formData.age) < 18) {
      toast({
        title: "Fehler",
        description: "Du musst mindestens 18 Jahre alt sein, um eine Bewertung abzugeben.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get score data from selected analysis
      let scoreBefore: number | undefined;
      let scoreAfter: number | undefined;

      if (formData.analysis_id) {
        const selectedAnalysis = analyses.find(a => a.id === formData.analysis_id);
        if (selectedAnalysis?.looks_score) {
          scoreAfter = selectedAnalysis.looks_score;
          
          // Try to find an earlier analysis for comparison
          const earlierAnalyses = analyses.filter(
            a => new Date(a.created_at) < new Date(selectedAnalysis.created_at) && a.looks_score
          );
          if (earlierAnalyses.length > 0) {
            scoreBefore = earlierAnalyses[earlierAnalyses.length - 1].looks_score ?? undefined;
          }
        }
      }

      await submitTestimonial({
        display_name: formData.display_name,
        age: formData.age ? parseInt(formData.age) : undefined,
        testimonial_text: formData.testimonial_text,
        analysis_id: formData.analysis_id || undefined,
        score_before: scoreBefore,
        score_after: scoreAfter,
      });

      toast({
        title: "Bewertung eingereicht!",
        description: "Deine Bewertung wird nach Prüfung veröffentlicht.",
      });
      setOpen(false);
      setFormData({ display_name: "", age: "", testimonial_text: "", analysis_id: "" });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht eingereicht werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTestimonial();
      toast({
        title: "Gelöscht",
        description: "Deine Bewertung wurde entfernt.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  if (loading) return null;

  // User already has a testimonial
  if (testimonial) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquarePlus className="w-4 h-4" />
            Meine Bewertung
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deine Bewertung</DialogTitle>
            <DialogDescription>
              {testimonial.is_approved ? (
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-4 h-4" /> Veröffentlicht
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> Wartet auf Freigabe
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">"{testimonial.testimonial_text}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {testimonial.display_name}
                {testimonial.age && `, ${testimonial.age} Jahre`}
              </p>
            </div>
            <Button variant="destructive" onClick={handleDelete} className="w-full gap-2">
              <Trash2 className="w-4 h-4" />
              Bewertung löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // User doesn't have a testimonial yet
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Bewertung abgeben
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teile deine Erfahrung</DialogTitle>
          <DialogDescription>
            Erzähle anderen, wie dir die App geholfen hat. Deine Bewertung wird nach
            Prüfung auf unserer Startseite veröffentlicht.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <p className="text-foreground">
            <strong>Hinweis:</strong> Mit dem Einreichen stimmst du zu, dass dein Anzeigename, 
            Alter und deine Bewertung öffentlich auf unserer Startseite angezeigt werden können.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Anzeigename *</Label>
              <Input
                id="display_name"
                placeholder="z.B. Max M."
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Alter *</Label>
              <Input
                id="age"
                type="number"
                placeholder="z.B. 24"
                min={18}
                max={99}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Mindestalter: 18 Jahre</p>
            </div>
          </div>

          {analyses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="analysis">Analyse verknüpfen (optional)</Label>
              <select
                id="analysis"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.analysis_id}
                onChange={(e) => setFormData({ ...formData, analysis_id: e.target.value })}
              >
                <option value="">Keine Analyse verknüpfen</option>
                {analyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    Score: {analysis.looks_score?.toFixed(1) || "N/A"} -{" "}
                    {new Date(analysis.created_at).toLocaleDateString("de-DE")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="testimonial_text">Deine Erfahrung *</Label>
            <Textarea
              id="testimonial_text"
              placeholder="Was hat dir die App gebracht? Welche Verbesserungen hast du bemerkt?"
              rows={4}
              value={formData.testimonial_text}
              onChange={(e) => setFormData({ ...formData, testimonial_text: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Wird eingereicht..." : "Bewertung einreichen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
