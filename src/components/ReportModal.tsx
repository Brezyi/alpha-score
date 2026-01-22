import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useReports, ReportReason, ReportContentType } from "@/hooks/useReports";
import { Flag, Loader2 } from "lucide-react";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ReportContentType;
  contentId?: string;
  reportedUserId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "inappropriate", label: "Unangemessener Inhalt", description: "Anstößige oder unangemessene Inhalte" },
  { value: "harassment", label: "Belästigung", description: "Belästigendes oder verletzendes Verhalten" },
  { value: "spam", label: "Spam", description: "Unerwünschte Werbung oder Spam" },
  { value: "misinformation", label: "Falsche Informationen", description: "Irreführende oder falsche Angaben" },
  { value: "other", label: "Sonstiges", description: "Anderer Verstoß" },
];

export function ReportModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  reportedUserId,
}: ReportModalProps) {
  const { createReport, creating } = useReports();
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createReport({
      reported_content_type: contentType,
      reported_content_id: contentId,
      reported_user_id: reportedUserId,
      reason,
      description: description.trim() || undefined,
    });

    if (result) {
      setReason("inappropriate");
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Inhalt melden
          </DialogTitle>
          <DialogDescription>
            Wähle einen Grund für deine Meldung. Deine Meldung ist anonym.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Grund der Meldung</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <div
                  key={r.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <Label htmlFor={r.value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{r.label}</span>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Zusätzliche Details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Beschreibe das Problem genauer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={creating} className="flex-1">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Senden...
                </>
              ) : (
                "Melden"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
