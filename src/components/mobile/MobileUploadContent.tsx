import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  User,
  Sparkles,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface UploadedPhoto {
  file: File;
  preview: string;
  type: "front" | "side" | "body";
}

interface MobileUploadContentProps {
  photos: UploadedPhoto[];
  isUploading: boolean;
  isPremium: boolean;
  onAddPhoto: (file: File, type: "front" | "side" | "body") => void;
  onRemovePhoto: (type: "front" | "side" | "body") => void;
  onUpload: () => void;
}

const photoTypes = [
  { id: "front" as const, label: "Frontal", description: "Von vorne" },
  { id: "side" as const, label: "Seite", description: "Profil" },
  { id: "body" as const, label: "Körper", description: "Optional" },
];

export const MobileUploadContent = ({
  photos,
  isUploading,
  isPremium,
  onAddPhoto,
  onRemovePhoto,
  onUpload
}: MobileUploadContentProps) => {
  const [activeType, setActiveType] = useState<"front" | "side" | "body">("front");

  const getPhotoForType = (type: "front" | "side" | "body") => {
    return photos.find(p => p.type === type);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {}
      onAddPhoto(e.target.files[0], activeType);
      
      // Auto-advance to next type
      const currentIndex = photoTypes.findIndex(t => t.id === activeType);
      if (currentIndex < photoTypes.length - 1) {
        setActiveType(photoTypes[currentIndex + 1].id);
      }
    }
  };

  const handleRemovePhoto = async (type: "front" | "side" | "body") => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    onRemovePhoto(type);
  };

  const canUpload = photos.some(p => p.type === "front");

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Info Banner */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Kostenlose Analyse:</span>{" "}
                Du erhältst deinen Looks Score
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-2"
      >
        {photoTypes.map((type, index) => {
          const hasPhoto = getPhotoForType(type.id);
          return (
            <div key={type.id} className="flex items-center">
              <button
                onClick={() => setActiveType(type.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  hasPhoto 
                    ? "bg-primary text-primary-foreground" 
                    : activeType === type.id
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-card text-muted-foreground border border-border"
                )}
              >
                {hasPhoto ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </button>
              {index < photoTypes.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  hasPhoto ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Photo Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-2"
      >
        {photoTypes.map((type) => {
          const photo = getPhotoForType(type.id);
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all text-center",
                activeType === type.id
                  ? "border-primary bg-primary/10"
                  : photo
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card"
              )}
            >
              {photo && (
                <div className="absolute top-1 right-1">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
              <User className={cn(
                "w-5 h-5 mx-auto mb-1",
                activeType === type.id ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="text-xs font-medium">{type.label}</p>
              <p className="text-[10px] text-muted-foreground">{type.description}</p>
            </button>
          );
        })}
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {getPhotoForType(activeType) ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden"
            >
              <img
                src={getPhotoForType(activeType)!.preview}
                alt={`${activeType} Foto`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => handleRemovePhoto(activeType)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 active:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium">
                  {photoTypes.find(t => t.id === activeType)?.label}-Foto
                </p>
                <p className="text-white/70 text-sm">Tippe auf X zum Entfernen</p>
              </div>
            </motion.div>
          ) : (
            <motion.label
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="block"
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />
              <Card className="aspect-[3/4] border-2 border-dashed border-border bg-card/50 cursor-pointer active:bg-accent/50 transition-colors">
                <CardContent className="h-full flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium text-center mb-1">
                    {photoTypes.find(t => t.id === activeType)?.label}-Foto aufnehmen
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Tippe, um ein Foto aufzunehmen oder auszuwählen
                  </p>
                </CardContent>
              </Card>
            </motion.label>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tipps für beste Ergebnisse:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Gute, natürliche Beleuchtung</li>
                <li>Neutraler Gesichtsausdruck</li>
                <li>Keine Sonnenbrille oder Hüte</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upload Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-4"
      >
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={onUpload}
          disabled={!canUpload || isUploading}
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyse starten
            </>
          )}
        </Button>
        
        {!canUpload && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Mindestens ein Frontalfoto erforderlich
          </p>
        )}
      </motion.div>
    </div>
  );
};
