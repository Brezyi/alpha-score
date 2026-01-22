import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate signed URLs for private storage images
 * Extracts the relative path from full Supabase URLs and creates a signed URL
 */
export function useSignedImageUrl(imageUrl: string | null | undefined, expiresIn = 3600) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract bucket and path from full URL
        // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
        const urlMatch = imageUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
        
        if (!urlMatch) {
          // If not a Supabase storage URL, use as-is (external URL)
          setSignedUrl(imageUrl);
          return;
        }

        const bucketId = urlMatch[1];
        const filePath = urlMatch[2];

        // Generate signed URL for private bucket
        const { data, error: signError } = await supabase.storage
          .from(bucketId)
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          console.error("Error generating signed URL:", signError);
          setError(signError.message);
          // Fallback to original URL
          setSignedUrl(imageUrl);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Failed to generate signed URL:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setSignedUrl(imageUrl);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [imageUrl, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Batch generate signed URLs for multiple images
 */
export async function generateSignedUrls(
  imageUrls: (string | null | undefined)[],
  expiresIn = 3600
): Promise<(string | null)[]> {
  const results = await Promise.all(
    imageUrls.map(async (url) => {
      if (!url) return null;

      try {
        const urlMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
        
        if (!urlMatch) {
          return url; // External URL
        }

        const bucketId = urlMatch[1];
        const filePath = urlMatch[2];

        const { data, error } = await supabase.storage
          .from(bucketId)
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          console.error("Error generating signed URL:", error);
          return url; // Fallback
        }

        return data.signedUrl;
      } catch (err) {
        console.error("Failed to generate signed URL:", err);
        return url;
      }
    })
  );

  return results;
}
