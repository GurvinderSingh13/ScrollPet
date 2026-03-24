import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  userId: string;
  petType: string;
  location: string;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  createdAt: string;
  receiverId?: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

interface UseWebSocketOptions {
  userId: string;
  petType: string;
  breed?: string | null;
  location: string;
  onMessage?: (message: Message) => void;
}

function mapRowToMessage(row: any): Message {
  const userData = row.users;
  return {
    id: row.id,
    userId: row.user_id,
    petType: row.pet_type,
    location: row.location,
    content: row.content,
    messageType: row.message_type,
    mediaUrl: row.media_url,
    mediaDuration: row.media_duration,
    createdAt: row.created_at,
    receiverId: row.receiver_id,
    user: userData
      ? {
          id: userData.id,
          username: userData.username || '',
          displayName: userData.display_name || userData.username || '',
        }
      : {
          id: row.user_id,
          username: 'Unknown',
          displayName: 'Unknown',
        },
  };
}

export function useWebSocket({ userId, petType, breed, location, onMessage }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `chat-${petType}-${breed || 'all'}-${location}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Channel for PUBLIC messages in the current room (filtered by location at DB level)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `location=eq.${location}`,
        },
        async (payload) => {
          const newRow = payload.new as any;

          // Skip DMs in this listener
          if (newRow.receiver_id) return;

          // Strict client-side room filters
          if (newRow.pet_type !== petType) return;
          if (newRow.location !== location) return;
          if (breed && newRow.breed !== breed) return;

          const { data: userData } = await supabase
            .from('users')
            .select('id, username, display_name')
            .eq('id', newRow.user_id)
            .single();

          const msg = mapRowToMessage({ ...newRow, users: userData });
          onMessageRef.current?.(msg);
        }
      )
      // Second listener: DMs targeted at this user (no location filter needed)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;

          const { data: userData } = await supabase
            .from('users')
            .select('id, username, display_name')
            .eq('id', newRow.user_id)
            .single();

          const msg = mapRowToMessage({ ...newRow, users: userData });
          onMessageRef.current?.(msg);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [userId, petType, breed, location]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId) return false;
      try {
        const insertData: any = {
          user_id: userId,
          pet_type: petType,
          location,
          content,
          message_type: 'text',
        };
        if (breed) {
          insertData.breed = breed;
        }

        const { error } = await supabase.from('messages').insert(insertData);
        if (error) {
          console.error('Failed to send message:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        return false;
      }
    },
    [userId, petType, breed, location]
  );

  return {
    isConnected,
    sendMessage,
  };
}
