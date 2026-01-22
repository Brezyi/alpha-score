import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface LogoUploadProps {
  currentLogoUrl: string;
  onLogoChange: (url: string) => void;
}

export function LogoUpload({ currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wähle ein Bild (PNG, JPG, SVG, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Das Logo darf maximal 2MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `app-logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/branding/")[1];
        if (oldPath) {
          await supabase.storage.from("branding").remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      onLogoChange(urlData.publicUrl);

      toast({
        title: "Logo hochgeladen",
        description: "Das neue Logo wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Das Logo konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange("");
  };

  return (
    <div className="space-y-3">
      <Label>App-Logo</Label>
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="App Logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
                Logo hochladen
              </>
            )}
          </Button>
          {currentLogoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveLogo}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Logo entfernen
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, SVG oder WebP. Max. 2MB. Empfohlen: 512x512px.
      </p>
    </div>
  );
}
