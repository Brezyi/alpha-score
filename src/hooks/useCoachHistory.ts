import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function useCoachHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("coach_conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setConversations(data);
    }

    // Load archived separately
    const { data: archivedData } = await supabase
      .from("coach_conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });
    
    if (archivedData) {
      setArchivedConversations(archivedData);
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("coach_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error loading messages:", error);
      return [];
    }
    
    return (data || []).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }));
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("coach_conversations")
      .insert({
        user_id: user.id,
        title: title || "Neues Gespräch"
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
    
    await loadConversations();
    return data.id;
  }, [user, loadConversations]);

  // Save a message to the current conversation
  const saveMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    const { error } = await supabase
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content
      });
    
    if (error) {
      console.error("Error saving message:", error);
      return false;
    }

    // Update conversation timestamp and title if first user message
    if (role === "user") {
      const truncatedTitle = content.length > 50 
        ? content.substring(0, 47) + "..." 
        : content;
      
      // Check if this is the first user message
      const { count } = await supabase
        .from("coach_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .eq("role", "user");
      
      if (count === 1) {
        await supabase
          .from("coach_conversations")
          .update({ title: truncatedTitle, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      } else {
        await supabase
          .from("coach_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
      
      await loadConversations();
    }
    
    return true;
  }, [loadConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("coach_conversations")
      .delete()
      .eq("id", conversationId);
    
    if (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
    
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
    
    await loadConversations();
    return true;
  }, [currentConversationId, loadConversations]);

  // Delete all conversations
  const deleteAllConversations = useCallback(async () => {
    if (!user) return false;

    const { error } = await supabase
      .from("coach_conversations")
      .delete()
      .eq("user_id", user.id);
    
    if (error) {
      console.error("Error deleting all conversations:", error);
      return false;
    }
    
    setCurrentConversationId(null);
    await loadConversations();
    return true;
  }, [user, loadConversations]);

  // Archive a conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("coach_conversations")
      .update({ is_archived: true })
      .eq("id", conversationId);
    
    if (error) {
      console.error("Error archiving conversation:", error);
      return false;
    }
    
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
    
    await loadConversations();
    return true;
  }, [currentConversationId, loadConversations]);

  // Unarchive a conversation
  const unarchiveConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("coach_conversations")
      .update({ is_archived: false })
      .eq("id", conversationId);
    
    if (error) {
      console.error("Error unarchiving conversation:", error);
      return false;
    }
    
    await loadConversations();
    return true;
  }, [loadConversations]);

  // Rename a conversation
  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    const { error } = await supabase
      .from("coach_conversations")
      .update({ title: newTitle })
      .eq("id", conversationId);
    
    if (error) {
      console.error("Error renaming conversation:", error);
      return false;
    }
    
    await loadConversations();
    return true;
  }, [loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  return {
    conversations,
    archivedConversations,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    deleteAllConversations,
    archiveConversation,
    unarchiveConversation,
    renameConversation
  };
}
