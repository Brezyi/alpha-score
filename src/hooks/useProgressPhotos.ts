import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_type: "front" | "side" | "back" | null;
  weight_kg: number | null;
  notes: string | null;
  taken_at: string;
  created_at: string;
}

export function useProgressPhotos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching progress photos:", error);
    }
  }, [user]);

  const uploadPhoto = useCallback(async (
    file: File,
    photoType: ProgressPhoto["photo_type"],
    weightKg?: number,
    notes?: string,
    takenAt?: Date
  ) => {
    if (!user) return null;

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from("progress_photos")
        .insert({
          user_id: user.id,
          photo_url: urlData.publicUrl,
          photo_type: photoType,
          weight_kg: weightKg,
          notes: notes,
          taken_at: takenAt ? takenAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPhotos();
      toast({
        title: "Foto hochgeladen ✓"
      });
      return data;
    } catch (error) {
      console.error("Error uploading progress photo:", error);
      toast({
        title: "Fehler",
        description: "Foto konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, fetchPhotos, toast]);

  const deletePhoto = useCallback(async (photoId: string) => {
    if (!user) return false;

    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return false;

      // Delete from storage
      const urlParts = photo.photo_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      await supabase.storage
        .from("progress-photos")
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("progress_photos")
        .delete()
        .eq("id", photoId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchPhotos();
      toast({
        title: "Foto gelöscht"
      });
      return true;
    } catch (error) {
      console.error("Error deleting progress photo:", error);
      return false;
    }
  }, [user, photos, fetchPhotos, toast]);

  const getPhotosByType = useCallback((type: ProgressPhoto["photo_type"]) => {
    return photos.filter(p => p.photo_type === type);
  }, [photos]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchPhotos();
      setLoading(false);
    };

    init();
  }, [user, fetchPhotos]);

  return {
    photos,
    loading,
    uploadPhoto,
    deletePhoto,
    getPhotosByType,
    refetch: fetchPhotos
  };
}
