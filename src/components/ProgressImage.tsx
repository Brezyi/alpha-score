import { useState, useEffect } from "react";
import { useSignedImageUrl } from "@/hooks/useSignedImageUrl";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ProgressImage({ src, alt, className, fallbackClassName }: ProgressImageProps) {
  const { signedUrl, loading, error } = useSignedImageUrl(src);
  const [imageError, setImageError] = useState(false);

  // Reset error state when URL changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || imageError) {
    return (
      <div className={cn(
        "w-full h-full flex items-center justify-center bg-muted",
        fallbackClassName
      )}>
        <Camera className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        "w-full h-full flex items-center justify-center bg-muted",
        fallbackClassName
      )}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !signedUrl) {
    return (
      <div className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-muted gap-2",
        fallbackClassName
      )}>
        <AlertCircle className="w-6 h-6 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Bild nicht verfügbar</span>
      </div>
    );
  }

  return (
    <img
      src={signedUrl || src}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
