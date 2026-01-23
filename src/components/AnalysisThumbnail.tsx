import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image } from "lucide-react";

interface AnalysisThumbnailProps {
  photoUrls: string[] | null;
  className?: string;
}

export function AnalysisThumbnail({ photoUrls, className = "" }: AnalysisThumbnailProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateSignedUrl = async () => {
      if (!photoUrls || photoUrls.length === 0) {
        setLoading(false);
        return;
      }

      // Use the first photo as thumbnail
      const firstPhotoUrl = photoUrls[0];
      
      try {
        // Parse the URL to extract bucket and path
        const urlMatch = firstPhotoUrl.match(/\/storage\/v1\/object\/(?:public|sign)?\/([^/]+)\/(.+)/);
        
        if (urlMatch) {
          const [, bucketId, filePath] = urlMatch;
          
          const { data, error: signError } = await supabase.storage
            .from(bucketId)
            .createSignedUrl(filePath, 3600); // 1 hour expiry
          
          if (signError) {
            console.error("Error signing URL:", signError);
            setError(true);
          } else if (data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        } else {
          // If URL doesn't match expected pattern, try using it directly
          setSignedUrl(firstPhotoUrl);
        }
      } catch (err) {
        console.error("Error generating signed URL:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [photoUrls]);

  if (loading) {
    return (
      <div className={`bg-muted animate-pulse rounded-lg flex items-center justify-center ${className}`}>
        <Image className="w-4 h-4 text-muted-foreground/50" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <Image className="w-4 h-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt="Analyse Vorschau"
      className={`object-cover rounded-lg ${className}`}
      onError={() => setError(true)}
    />
  );
}