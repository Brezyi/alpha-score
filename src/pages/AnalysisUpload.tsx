import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  X, 
  Camera, 
  User, 
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoGuidelinesModal } from "@/components/PhotoGuidelinesModal";

interface UploadedPhoto {
  file: File;
  preview: string;
  type: "front" | "side" | "body";
}

const photoTypes = [
  { id: "front" as const, label: "Frontal", icon: User, description: "Gesicht von vorne" },
  { id: "side" as const, label: "Seite", icon: User, description: "Profil-Ansicht" },
  { id: "body" as const, label: "Körper", icon: User, description: "Ganzkörper (optional)" },
];

export default function AnalysisUpload() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeType, setActiveType] = useState<"front" | "side" | "body">("front");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [activeType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Ungültiges Format",
        description: "Bitte lade nur Bilder hoch (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    const existingType = photos.find(p => p.type === activeType);
    if (existingType) {
      toast({
        title: "Foto ersetzen",
        description: `Das ${photoTypes.find(t => t.id === activeType)?.label}-Foto wird ersetzt`,
      });
    }

    const file = imageFiles[0];
    const preview = URL.createObjectURL(file);
    
    setPhotos(prev => {
      const filtered = prev.filter(p => p.type !== activeType);
      return [...filtered, { file, preview, type: activeType }];
    });

    // Auto-advance to next type
    const currentIndex = photoTypes.findIndex(t => t.id === activeType);
    if (currentIndex < photoTypes.length - 1) {
      setActiveType(photoTypes[currentIndex + 1].id);
    }
  };

  const removePhoto = (type: "front" | "side" | "body") => {
    setPhotos(prev => {
      const photo = prev.find(p => p.type === type);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter(p => p.type !== type);
    });
  };

  const uploadPhotos = async () => {
    if (!user || photos.length === 0) return;

    const frontPhoto = photos.find(p => p.type === "front");
    if (!frontPhoto) {
      toast({
        title: "Frontalfoto erforderlich",
        description: "Bitte lade mindestens ein Frontalfoto hoch",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${photo.type}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('analysis-photos')
          .upload(fileName, photo.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('analysis-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Create analysis record
      const { data: analysis, error: dbError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          photo_urls: uploadedUrls,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload erfolgreich!",
        description: "Deine Analyse wird jetzt verarbeitet...",
      });

      // Trigger AI analysis (fire and forget - results page will poll/show status)
      supabase.functions.invoke("analyze-photos", {
        body: { analysisId: analysis.id }
      }).catch(err => {
        console.error("Analysis trigger error:", err);
      });

      // Navigate to results page
      navigate(`/analysis/${analysis.id}`);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Bitte versuche es erneut",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getPhotoForType = (type: "front" | "side" | "body") => {
    return photos.find(p => p.type === type);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <h1 className="text-lg font-bold">KI-Analyse</h1>
          <PhotoGuidelinesModal 
            trigger={
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            }
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
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
                  {hasPhoto ? <Check className="w-5 h-5" /> : index + 1}
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
        </div>

        {/* Photo type selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {photoTypes.map((type) => {
            const photo = getPhotoForType(type.id);
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all text-left",
                  activeType === type.id
                    ? "border-primary bg-primary/10"
                    : photo
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground"
                )}
              >
                {photo && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  activeType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>

        {/* Upload area */}
        <Card className="border-2 border-dashed border-border bg-card/50 overflow-hidden">
          <CardContent className="p-0">
            {getPhotoForType(activeType) ? (
              <div className="relative aspect-[3/4]">
                <img
                  src={getPhotoForType(activeType)!.preview}
                  alt={`${activeType} Foto`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => removePhoto(activeType)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-medium">
                    {photoTypes.find(t => t.id === activeType)?.label}-Foto
                  </p>
                  <p className="text-white/70 text-sm">
                    Tippe auf X zum Entfernen
                  </p>
                </div>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center aspect-[3/4] cursor-pointer transition-all",
                  isDragging 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-card"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-primary animate-bounce" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-foreground font-medium mb-1">
                  {photoTypes.find(t => t.id === activeType)?.label}-Foto hochladen
                </p>
                <p className="text-muted-foreground text-sm text-center px-8">
                  Drag & Drop oder klicke zum Auswählen
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  JPG, PNG oder WebP • Max. 5MB
                </p>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Photo previews */}
        {photos.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-3">Deine Fotos</p>
            <div className="flex gap-3">
              {photos.map((photo) => (
                <div 
                  key={photo.type}
                  onClick={() => setActiveType(photo.type)}
                  className={cn(
                    "relative w-16 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                    activeType === photo.type ? "border-primary" : "border-transparent"
                  )}
                >
                  <img
                    src={photo.preview}
                    alt={photo.type}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(photo.type);
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Tipps für bessere Ergebnisse</p>
                <PhotoGuidelinesModal 
                  trigger={
                    <button className="text-xs text-primary hover:underline">
                      Alle Richtlinien
                    </button>
                  }
                />
              </div>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Gute Beleuchtung (Tageslicht ist ideal)</li>
                <li>• Neutraler Gesichtsausdruck</li>
                <li>• Haare aus dem Gesicht</li>
                <li>• Keine Filter oder Bearbeitung</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={uploadPhotos}
          disabled={photos.length === 0 || isUploading}
          variant="hero"
          size="xl"
          className="w-full mt-8"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyse starten
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Deine Fotos werden sicher gespeichert und nur für die Analyse verwendet
        </p>
      </main>
    </div>
  );
}
