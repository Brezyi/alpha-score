import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  friend_id: string;
  friend_name: string | null;
  friend_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function useFriendMessages(friendId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    // Group by friend
    const conversationMap = new Map<string, {
      messages: Message[];
      unread: number;
    }>();

    data?.forEach(msg => {
      const friendId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const existing = conversationMap.get(friendId) || { messages: [], unread: 0 };
      existing.messages.push(msg);
      if (!msg.is_read && msg.receiver_id === user.id) {
        existing.unread++;
      }
      conversationMap.set(friendId, existing);
    });

    // Get friend profiles
    const friendIds = Array.from(conversationMap.keys());
    if (friendIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", friendIds);

    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const convList: Conversation[] = Array.from(conversationMap.entries()).map(([fId, data]) => {
      const lastMsg = data.messages[0];
      const profile = profilesMap.get(fId);
      return {
        friend_id: fId,
        friend_name: profile?.display_name || null,
        friend_avatar: profile?.avatar_url || null,
        last_message: lastMsg.content,
        last_message_time: lastMsg.created_at,
        unread_count: data.unread,
      };
    });

    // Sort by last message time
    convList.sort((a, b) => 
      new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    );

    setConversations(convList);
  }, [user]);

  // Fetch messages with specific friend
  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;

    const { data, error } = await supabase
      .from("friend_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);

    // Mark received messages as read
    const unreadIds = data?.filter(m => !m.is_read && m.receiver_id === user.id).map(m => m.id) || [];
    if (unreadIds.length > 0) {
      await supabase
        .from("friend_messages")
        .update({ is_read: true })
        .in("id", unreadIds);
    }
  }, [user, friendId]);

  // Send message
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!user || !friendId || !content.trim()) return false;

    setSending(true);
    const { error } = await supabase
      .from("friend_messages")
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: content.trim(),
      });

    setSending(false);

    if (error) {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return false;
    }

    await fetchMessages();
    return true;
  };

  // Get total unread count
  const getTotalUnreadCount = useCallback((): number => {
    return conversations.reduce((sum, c) => sum + c.unread_count, 0);
  }, [conversations]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("friend_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Message relevant to current user (sent to or from me)
          if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
            // If viewing this specific conversation, add message directly
            if (friendId && (newMsg.sender_id === friendId || newMsg.receiver_id === friendId)) {
              setMessages(prev => {
                // Prevent duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              // Mark as read if I'm the receiver
              if (newMsg.receiver_id === user.id) {
                supabase
                  .from("friend_messages")
                  .update({ is_read: true })
                  .eq("id", newMsg.id);
              }
            }
            // Always refresh conversations list
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchConversations(),
        friendId ? fetchMessages() : Promise.resolve(),
      ]);
      setLoading(false);
    };

    init();
  }, [user, friendId, fetchConversations, fetchMessages]);

  return {
    messages,
    conversations,
    loading,
    sending,
    sendMessage,
    getTotalUnreadCount,
    refetch: () => Promise.all([fetchConversations(), fetchMessages()]),
  };
}
