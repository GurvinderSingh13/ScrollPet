import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUnreadMessages(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error('Unread count fetch error:', error);
      } else if (count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnread();

    const channel = supabase
      .channel(`unread_messages_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime message received:', payload);
          if (payload.new && payload.new.is_read === false) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          // Whenever a message we received is updated (e.g. marked as read), refetch the exact count
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}
