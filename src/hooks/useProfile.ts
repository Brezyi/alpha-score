import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PROFILE_UPDATED_EVENT = "profile:updated";

type ProfileUpdatedDetail = {
  userId: string;
  updates: Partial<Pick<Profile, "display_name" | "avatar_url" | "theme" | "accent_color" | "background_style" | "gender" | "country">>;
};

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: string;
  accent_color: string;
  background_style: string;
  gender: "male" | "female" | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  display_name_changed_at: string | null;
}

export interface DisplayNameChangeStatus {
  allowed: boolean;
  days_remaining: number;
  next_change_date: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayNameChangeStatus, setDisplayNameChangeStatus] = useState<DisplayNameChangeStatus | null>(null);

  const checkDisplayNameChangeAllowed = useCallback(async () => {
    if (!user) {
      setDisplayNameChangeStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('can_change_display_name', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDisplayNameChangeStatus({
          allowed: data[0].allowed,
          days_remaining: data[0].days_remaining,
          next_change_date: data[0].next_change_date
        });
      }
    } catch (error) {
      console.error("Error checking display name change status:", error);
      setDisplayNameChangeStatus({ allowed: true, days_remaining: 0, next_change_date: null });
    }
  }, [user]);

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
    checkDisplayNameChangeAllowed();
    // In-app sync: keep multiple useProfile() hook instances in sync instantly
    // (e.g. ProfileMenu updates should immediately reflect on Dashboard without a reload)
    const handleLocalProfileUpdate = (event: Event) => {
      if (!user) return;
      const detail = (event as CustomEvent<ProfileUpdatedDetail>).detail;
      if (!detail || detail.userId !== user.id) return;

      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, ...detail.updates };
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener(PROFILE_UPDATED_EVENT, handleLocalProfileUpdate);
    }

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
            const newProfile = payload.new as Profile;
            const oldProfile = payload.old as Profile | null;
            
            // Show toast if display_name changed
            if (oldProfile?.display_name && newProfile.display_name && 
                oldProfile.display_name !== newProfile.display_name) {
              toast({
                title: "Profil aktualisiert",
                description: `Name geändert zu "${newProfile.display_name}"`,
              });
            }
            
            setProfile(newProfile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (typeof window !== "undefined") {
          window.removeEventListener(PROFILE_UPDATED_EVENT, handleLocalProfileUpdate);
        }
      };
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(PROFILE_UPDATED_EVENT, handleLocalProfileUpdate);
      }
    };
  }, [fetchProfile, user, checkDisplayNameChangeAllowed]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, "display_name" | "avatar_url" | "theme" | "accent_color" | "background_style" | "gender" | "country">>) => {
      if (!user || !profile) return false;

      // Check if trying to change display name and if it's allowed
      if (updates.display_name && updates.display_name !== profile.display_name) {
        if (displayNameChangeStatus && !displayNameChangeStatus.allowed) {
          toast({
            title: "Änderung nicht möglich",
            description: `Du kannst deinen Namen erst in ${displayNameChangeStatus.days_remaining} Tagen wieder ändern.`,
            variant: "destructive",
          });
          return false;
        }
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;

        setProfile((prev) => (prev ? { ...prev, ...updates } : null));

        // Broadcast to other hook instances (Dashboard, etc.) for instant UI updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, {
              detail: { userId: user.id, updates },
            })
          );
        }
        
        // Refresh the change status after a display name update
        if (updates.display_name && updates.display_name !== profile.display_name) {
          await checkDisplayNameChangeAllowed();
        }
        
        toast({
          title: "Gespeichert",
          description: "Deine Einstellungen wurden aktualisiert.",
        });
        
        return true;
      } catch (error) {
        console.error("Error updating profile:", error);

        // Friendly conflict message for unique display_name constraint
        const err = error as any;
        const isUniqueViolation =
          err?.code === "23505" ||
          err?.message?.toLowerCase?.().includes("duplicate") ||
          err?.message?.toLowerCase?.().includes("unique");

        toast({
          title: "Fehler",
          description: isUniqueViolation
            ? "Dieser Anzeigename ist bereits vergeben."
            : "Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, profile, toast, displayNameChangeStatus, checkDisplayNameChangeAllowed]
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
    displayNameChangeStatus,
    checkDisplayNameChangeAllowed,
  };
}
