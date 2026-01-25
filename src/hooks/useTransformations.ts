import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TransformationSubmission {
  id: string;
  user_id: string;
  before_analysis_id: string | null;
  after_analysis_id: string | null;
  score_before: number | null;
  score_after: number | null;
  description: string | null;
  is_approved: boolean;
  is_featured: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
}

export interface ApprovedTransformation extends TransformationSubmission {
  before_photos?: string[];
  after_photos?: string[];
  display_name?: string;
}

export function useTransformations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mySubmissions, setMySubmissions] = useState<TransformationSubmission[]>([]);
  const [approvedTransformations, setApprovedTransformations] = useState<ApprovedTransformation[]>([]);
  const [featuredTransformations, setFeaturedTransformations] = useState<ApprovedTransformation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMySubmissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transformation_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setMySubmissions(data || []);
    } catch (error) {
      console.error("Error fetching my submissions:", error);
    }
  }, [user]);

  const fetchApprovedTransformations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("transformation_submissions")
        .select(`
          *,
          before_analysis:analyses!transformation_submissions_before_analysis_id_fkey(photo_urls),
          after_analysis:analyses!transformation_submissions_after_analysis_id_fkey(photo_urls),
          profile:profiles!transformation_submissions_user_id_fkey(display_name)
        `)
        .eq("is_approved", true)
        .order("score_after", { ascending: false })
        .limit(20);

      if (error) throw error;

      const transformations = (data || []).map((t: any) => ({
        ...t,
        before_photos: t.before_analysis?.photo_urls || [],
        after_photos: t.after_analysis?.photo_urls || [],
        display_name: t.profile?.display_name || "Anonym"
      }));

      setApprovedTransformations(transformations);
      setFeaturedTransformations(transformations.filter((t: ApprovedTransformation) => t.is_featured));
    } catch (error) {
      console.error("Error fetching approved transformations:", error);
    }
  }, []);

  const submitTransformation = async (
    beforeAnalysisId: string,
    afterAnalysisId: string,
    scoreBefore: number,
    scoreAfter: number,
    description?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("transformation_submissions")
        .insert({
          user_id: user.id,
          before_analysis_id: beforeAnalysisId,
          after_analysis_id: afterAnalysisId,
          score_before: scoreBefore,
          score_after: scoreAfter,
          description
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMySubmissions();
      toast({
        title: "Transformation eingereicht! 📸",
        description: "Deine Transformation wird überprüft und dann in der Galerie angezeigt."
      });
      return data;
    } catch (error) {
      console.error("Error submitting transformation:", error);
      toast({
        title: "Fehler",
        description: "Transformation konnte nicht eingereicht werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("transformation_submissions")
        .delete()
        .eq("id", submissionId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchMySubmissions();
      toast({
        title: "Gelöscht",
        description: "Deine Einreichung wurde entfernt."
      });
      return true;
    } catch (error) {
      console.error("Error deleting submission:", error);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchMySubmissions(),
        fetchApprovedTransformations()
      ]);
      setLoading(false);
    };

    init();
  }, [fetchMySubmissions, fetchApprovedTransformations]);

  return {
    mySubmissions,
    approvedTransformations,
    featuredTransformations,
    loading,
    submitTransformation,
    deleteSubmission,
    refetch: async () => {
      await Promise.all([
        fetchMySubmissions(),
        fetchApprovedTransformations()
      ]);
    }
  };
}
