import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ReportReason = "inappropriate" | "harassment" | "spam" | "misinformation" | "other";
export type ReportContentType = "user" | "analysis" | "chat" | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_content_type: ReportContentType;
  reported_content_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  reported_user_id?: string;
  reported_content_type: ReportContentType;
  reported_content_id?: string;
  reason: ReportReason;
  description?: string;
}

export const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data as Report[]) || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createReport = async (reportData: CreateReportData) => {
    if (!user) return null;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: reportData.reported_user_id || null,
          reported_content_type: reportData.reported_content_type,
          reported_content_id: reportData.reported_content_id || null,
          reason: reportData.reason,
          description: reportData.description || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Meldung gesendet",
        description: "Deine Meldung wurde erfolgreich übermittelt.",
      });

      return data as Report;
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast({
        title: "Fehler",
        description: "Die Meldung konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    adminNotes?: string
  ) => {
    if (!user) return;

    try {
      const updateData: Partial<Report> = { 
        status,
        reviewed_by: user.id,
      };
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from("reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Status aktualisiert",
        description: "Der Report-Status wurde geändert.",
      });

      await fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    creating,
    createReport,
    updateReportStatus,
    refetch: fetchReports,
  };
};
