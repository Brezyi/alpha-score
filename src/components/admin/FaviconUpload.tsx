import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Globe } from "lucide-react";

interface FaviconUploadProps {
  currentFaviconUrl: string;
  onFaviconChange: (url: string) => void;
}

export function FaviconUpload({ currentFaviconUrl, onFaviconChange }: FaviconUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/x-icon", "image/ico", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wähle ein Favicon (PNG, ICO, SVG, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 500KB for favicons)
    if (file.size > 500 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Das Favicon darf maximal 500KB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;

      // Delete old favicon if exists
      if (currentFaviconUrl) {
        const oldPath = currentFaviconUrl.split("/branding/")[1];
        if (oldPath) {
          await supabase.storage.from("branding").remove([oldPath]);
        }
      }

      // Upload new favicon
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      onFaviconChange(urlData.publicUrl);

      toast({
        title: "Favicon hochgeladen",
        description: "Das neue Favicon wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error("Favicon upload error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Das Favicon konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFavicon = () => {
    onFaviconChange("");
  };

  return (
    <div className="space-y-3">
      <Label>Favicon</Label>
      <div className="flex items-center gap-4">
        {/* Favicon Preview */}
        <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
          {currentFaviconUrl ? (
            <img
              src={currentFaviconUrl}
              alt="Favicon"
              className="w-8 h-8 object-contain"
            />
          ) : (
            <Globe className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ico,.png,.svg,.webp,image/png,image/x-icon,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Favicon hochladen
              </>
            )}
          </Button>
          {currentFaviconUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFavicon}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Favicon entfernen
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        PNG, ICO, SVG oder WebP. Max. 500KB. Empfohlen: 32x32px oder 64x64px.
      </p>
    </div>
  );
}
