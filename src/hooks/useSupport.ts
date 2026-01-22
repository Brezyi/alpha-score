import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type TicketCategory = "technical" | "payment" | "account" | "other";
export type TicketStatus = "open" | "in_progress" | "closed";

export interface SupportTicket {
  id: string;
  user_id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  attachment_urls: string[];
  status: TicketStatus;
  admin_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  category: TicketCategory;
  subject: string;
  description: string;
  attachments?: File[];
}

export const useSupport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data as SupportTicket[]) || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTicket = async (ticketData: CreateTicketData) => {
    if (!user) return null;

    setCreating(true);
    try {
      let attachmentUrls: string[] = [];

      // Upload attachments if provided
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        for (const file of ticketData.attachments) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("support-attachments")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("support-attachments")
            .getPublicUrl(fileName);

          attachmentUrls.push(urlData.publicUrl);
        }
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          category: ticketData.category,
          subject: ticketData.subject,
          description: ticketData.description,
          attachment_urls: attachmentUrls,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ticket erstellt",
        description: "Deine Support-Anfrage wurde erfolgreich gesendet.",
      });

      await fetchTickets();
      return data as SupportTicket;
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: TicketStatus,
    adminNotes?: string
  ) => {
    try {
      const updateData: Partial<SupportTicket> = { status };
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status aktualisiert",
        description: "Der Ticket-Status wurde geändert.",
      });

      await fetchTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    creating,
    createTicket,
    updateTicketStatus,
    refetch: fetchTickets,
  };
};
