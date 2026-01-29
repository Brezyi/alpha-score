import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProgressPhotos, ProgressPhoto } from "@/hooks/useProgressPhotos";
import { ProgressImage } from "@/components/ProgressImage";
import { 
  Camera, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const PHOTO_TYPES: { value: ProgressPhoto["photo_type"]; label: string }[] = [
  { value: "front", label: "Frontal" },
  { value: "side", label: "Seite" },
  { value: "back", label: "Rücken" },
];

export function ProgressPhotosTracker() {
  const { photos, loading, uploadPhoto, deletePhoto, getPhotosByType } = useProgressPhotos();
  const [selectedType, setSelectedType] = useState<ProgressPhoto["photo_type"]>("front");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadType, setUploadType] = useState<ProgressPhoto["photo_type"]>("front");
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const filteredPhotos = selectedType ? getPhotosByType(selectedType) : photos;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = () => {
    if (isNative) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    if (isNative) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await uploadPhoto(
        selectedFile,
        uploadType,
        weightKg ? parseFloat(weightKg) : undefined,
        notes || undefined
      );
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setWeightKg("");
      setNotes("");
      setShowUploadDialog(false);
      
      if (isNative) {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (isNative) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }
    await deletePhoto(photoId);
    setViewingPhoto(null);
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setWeightKg("");
    setNotes("");
    setUploadType("front");
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Fortschrittsfotos
          </CardTitle>
          <Dialog open={showUploadDialog} onOpenChange={(open) => {
            setShowUploadDialog(open);
            if (!open) resetUploadForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Neues Fortschrittsfoto
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {/* Photo preview or capture buttons */}
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Vorschau"
                      className="w-full aspect-[3/4] object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Camera button - prominent on mobile */}
                    <Button
                      variant="outline"
                      className={cn(
                        "h-32 flex-col gap-3",
                        isNative && "col-span-2 bg-primary/5 border-primary/30"
                      )}
                      onClick={handleCameraCapture}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isNative ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Camera className={cn(
                          "w-6 h-6",
                          isNative ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className="text-sm font-medium">
                        {isNative ? "Foto aufnehmen" : "Kamera"}
                      </span>
                    </Button>
                    
                    {/* Gallery button */}
                    <Button
                      variant="outline"
                      className={cn(
                        "h-32 flex-col gap-3",
                        isNative && "col-span-2"
                      )}
                      onClick={handleGallerySelect}
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">
                        {isNative ? "Aus Galerie wählen" : "Datei auswählen"}
                      </span>
                    </Button>
                  </div>
                )}
                
                {/* Photo type selector */}
                <div className="space-y-2">
                  <Label>Foto-Typ</Label>
                  <Select value={uploadType || "front"} onValueChange={(v) => setUploadType(v as ProgressPhoto["photo_type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value!}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Optional weight */}
                <div className="space-y-2">
                  <Label>Gewicht (optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="z.B. 75.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
                
                {/* Optional notes */}
                <div className="space-y-2">
                  <Label>Notizen (optional)</Label>
                  <Input
                    placeholder="z.B. Nach dem Training"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                {/* Upload button */}
                <Button
                  className="w-full"
                  disabled={!selectedFile || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Foto speichern
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type filter tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-all",
              !selectedType
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            Alle
          </button>
          {PHOTO_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full border transition-all",
                selectedType === type.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredPhotos.slice(0, 9).map((photo) => (
              <button
                key={photo.id}
                onClick={() => setViewingPhoto(photo)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted group"
              >
                <ProgressImage
                  src={photo.photo_url}
                  alt={`${photo.photo_type} Foto`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white font-medium">
                    {format(new Date(photo.taken_at), "dd. MMM", { locale: de })}
                  </p>
                </div>
                {photo.weight_kg && (
                  <div className="absolute top-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
                    {photo.weight_kg}kg
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Noch keine Fortschrittsfotos
            </p>
            <p className="text-xs text-muted-foreground">
              Dokumentiere deinen Fortschritt mit regelmäßigen Fotos
            </p>
          </div>
        )}

        {/* View photo dialog */}
        <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
            {viewingPhoto && (
              <>
                <div className="relative">
                  <ProgressImage
                    src={viewingPhoto.photo_url}
                    alt="Fortschrittsfoto"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white"
                    onClick={() => setViewingPhoto(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{viewingPhoto.photo_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(viewingPhoto.taken_at), "dd. MMMM yyyy", { locale: de })}
                      </p>
                    </div>
                    {viewingPhoto.weight_kg && (
                      <div className="text-right">
                        <p className="font-bold text-lg">{viewingPhoto.weight_kg} kg</p>
                        <p className="text-xs text-muted-foreground">Gewicht</p>
                      </div>
                    )}
                  </div>
                  {viewingPhoto.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {viewingPhoto.notes}
                    </p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDelete(viewingPhoto.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Foto löschen
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
