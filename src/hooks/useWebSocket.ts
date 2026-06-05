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
  crosspostRooms?: string[] | null;
  createdAt: string;
  receiverId?: string | null;
  replyToUserId?: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
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
    crosspostRooms: row.crosspost_rooms || row.crosspostRooms || [],
    createdAt: row.created_at,
    receiverId: row.receiver_id,
    replyToUserId: row.reply_to_user_id,
    intentStatus: row.intent_status || null,
    user: userData
      ? {
          id: userData.id,
          username: userData.username || '',
          displayName: userData.display_name || userData.username || '',
          avatarUrl: userData.profile_image_url || null,
        }
      : {
          id: row.user_id,
          username: 'Unknown',
          displayName: 'Unknown',
          avatarUrl: null,
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
    const channelName = `chat-${petType}-${breed || 'all'}-${location}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Layer 1 — server-side filter: Supabase only sends INSERTs for this pet type.
    // DM messages also carry a pet_type so they still arrive; the receiver_id
    // check below handles them. The breed / location guard is layer 2 (client-side).
    let channelBuilder: any = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `pet_type=eq.${petType}`,
        },
        async (payload: any) => {
          const newRow = payload.new;
          const currentRoomId = `${location}::${petType}::${breed || 'all'}`;

          // 1. DMs: only the sender and receiver should process them.
          if (newRow.receiver_id) {
            if (newRow.receiver_id !== userId && newRow.user_id !== userId) return;
          } else {
            // Layer 2 — client-side exact room check.
            // Every sent message stores its own room in crosspost_rooms, so a plain
            // Array.includes() on currentRoomId is sufficient — no fuzzy matching.
            let crosspostRooms: string[] = newRow.crosspost_rooms || [];

            // Supabase Realtime can deliver Postgres arrays as "{val1,val2}" strings.
            if (typeof crosspostRooms === 'string') {
              try {
                const s = crosspostRooms as string;
                if (s.startsWith('{') && s.endsWith('}')) {
                  crosspostRooms = s.slice(1, -1).split(',').map((v: string) => v.replace(/^"|"$/g, ''));
                } else {
                  crosspostRooms = JSON.parse(s);
                }
              } catch {
                crosspostRooms = [];
              }
            }
            if (!Array.isArray(crosspostRooms)) crosspostRooms = [];

            // Strict: the current room must be explicitly listed.
            if (!crosspostRooms.includes(currentRoomId)) return;
          }

          const { data: userData } = await supabase
            .from('users')
            .select('id, username, display_name, profile_image_url')
            .eq('id', newRow.user_id)
            .single();

          const msg = mapRowToMessage({ ...newRow, users: userData });
          onMessageRef.current?.(msg);
        }
      );

    // DM and reply-targeted listeners require an authenticated user.
    // Their Supabase filter expressions need a real userId; skip them for guests.
    if (userId) {
      channelBuilder = channelBuilder
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${userId}`,
          },
          async (payload: any) => {
            const newRow = payload.new as any;

            const { data: userData } = await supabase
              .from('users')
              .select('id, username, display_name, profile_image_url')
              .eq('id', newRow.user_id)
              .single();

            const msg = mapRowToMessage({ ...newRow, users: userData });
            onMessageRef.current?.(msg);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `reply_to_user_id=eq.${userId}`,
          },
          async (payload: any) => {
            const newRow = payload.new as any;

            const { data: userData } = await supabase
              .from('users')
              .select('id, username, display_name, profile_image_url')
              .eq('id', newRow.user_id)
              .single();

            const msg = mapRowToMessage({ ...newRow, users: userData });
            onMessageRef.current?.(msg);
          }
        );
    }

    const channel = channelBuilder.subscribe((status: string) => {
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
