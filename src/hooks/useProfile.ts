import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: string;
  accent_color: string;
  background_style: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
      } else {
        // Create profile if it doesn't exist (for existing users)
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: user.email?.split("@")[0] || "User",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();

    // Subscribe to realtime changes for immediate updates across components
    if (user) {
      const channel = supabase
        .channel(`profile_changes_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[Profile] Realtime update:", payload);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchProfile, user]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, "display_name" | "avatar_url" | "theme" | "accent_color" | "background_style">>) => {
      if (!user || !profile) return false;

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;

        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        
        toast({
          title: "Gespeichert",
          description: "Deine Einstellungen wurden aktualisiert.",
        });
        
        return true;
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Fehler",
          description: "Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, profile, toast]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return null;

      try {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        
        await updateProfile({ avatar_url: avatarUrl });
        
        return avatarUrl;
      } catch (error) {
        console.error("Error uploading avatar:", error);
        toast({
          title: "Fehler",
          description: "Avatar konnte nicht hochgeladen werden.",
          variant: "destructive",
        });
        return null;
      }
    },
    [user, updateProfile, toast]
  );

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}
