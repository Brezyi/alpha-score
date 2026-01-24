import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  user_id: string;
  analysis_id: string | null;
  display_name: string;
  age: number | null;
  testimonial_text: string;
  score_before: number | null;
  score_after: number | null;
  star_rating: number | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  deleted_at: string | null;
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      // Use sanitized public view that excludes user_id and analysis_id
      const { data, error } = await supabase
        .from("user_testimonials_public" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setTestimonials((data as Testimonial[]) || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedTestimonials();
  }, [fetchApprovedTestimonials]);

  return { testimonials, loading, refetch: fetchApprovedTestimonials };
}

export function useUserTestimonial(userId: string | undefined) {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserTestimonial = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_testimonials")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      setTestimonial(data as Testimonial | null);
    } catch (error) {
      console.error("Error fetching user testimonial:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserTestimonial();
  }, [fetchUserTestimonial]);

  const submitTestimonial = async (data: {
    display_name: string;
    age?: number;
    testimonial_text: string;
    analysis_id?: string;
    score_before?: number;
    score_after?: number;
    star_rating?: number;
  }) => {
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase.from("user_testimonials").insert({
      user_id: userId,
      display_name: data.display_name,
      age: data.age || null,
      testimonial_text: data.testimonial_text,
      analysis_id: data.analysis_id || null,
      score_before: data.score_before || null,
      score_after: data.score_after || null,
      star_rating: data.star_rating || null,
    });

    if (error) throw error;
    await fetchUserTestimonial();
  };

  const deleteTestimonial = async () => {
    if (!testimonial) return;

    const { error } = await supabase
      .from("user_testimonials")
      .delete()
      .eq("id", testimonial.id);

    if (error) throw error;
    setTestimonial(null);
  };

  return {
    testimonial,
    loading,
    submitTestimonial,
    deleteTestimonial,
    refetch: fetchUserTestimonial,
  };
}

export function useAdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials((data as Testimonial[]) || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTestimonials();
  }, [fetchAllTestimonials]);

  const approveTestimonial = async (id: string, approved: boolean) => {
    if (approved) {
      // Approve: update is_approved to true
      const { error } = await supabase
        .from("user_testimonials")
        .update({ is_approved: true })
        .eq("id", id);

      if (error) throw error;
    } else {
      // Reject: soft delete by setting deleted_at
      const { error } = await supabase
        .from("user_testimonials")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    }
    await fetchAllTestimonials();
  };

  const restoreTestimonial = async (id: string) => {
    const { error } = await supabase
      .from("user_testimonials")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) throw error;
    await fetchAllTestimonials();
  };

  const permanentlyDeleteTestimonial = async (id: string) => {
    const { error } = await supabase
      .from("user_testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchAllTestimonials();
  };

  const featureTestimonial = async (id: string, featured: boolean) => {
    const { error } = await supabase
      .from("user_testimonials")
      .update({ is_featured: featured })
      .eq("id", id);

    if (error) throw error;
    await fetchAllTestimonials();
  };

  const revokeTestimonial = async (id: string) => {
    // Revoke approval: set is_approved to false (moves back to pending)
    const { error } = await supabase
      .from("user_testimonials")
      .update({ is_approved: false, is_featured: false })
      .eq("id", id);

    if (error) throw error;
    await fetchAllTestimonials();
  };

  return {
    testimonials,
    loading,
    approveTestimonial,
    featureTestimonial,
    restoreTestimonial,
    permanentlyDeleteTestimonial,
    revokeTestimonial,
    refetch: fetchAllTestimonials,
  };
}
