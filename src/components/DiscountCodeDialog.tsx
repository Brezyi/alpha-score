import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Tag, Sparkles } from "lucide-react";

interface DiscountCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (discountCode: string) => void;
  planName: string;
  planPrice: string;
  loading?: boolean;
}

export const DiscountCodeDialog = ({
  open,
  onOpenChange,
  onConfirm,
  planName,
  planPrice,
  loading = false,
}: DiscountCodeDialogProps) => {
  const [discountCode, setDiscountCode] = useState("");

  const handleConfirm = () => {
    onConfirm(discountCode.trim());
  };

  const handleSkip = () => {
    onConfirm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {planName} kaufen
          </DialogTitle>
          <DialogDescription>
            Du bist dabei, {planName} für {planPrice} zu kaufen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="discount-code" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Rabattcode (optional)
            </Label>
            <Input
              id="discount-code"
              placeholder="z.B. WELCOME2025"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={20}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Hast du einen Rabattcode? Gib ihn hier ein, um einen Preisnachlass zu erhalten.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Ohne Code fortfahren
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird geladen...
              </>
            ) : (
              <>
                {discountCode ? "Mit Rabatt kaufen" : "Jetzt kaufen"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
