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
    const channelName = `chat-${petType}-${breed || 'all'}-${location}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to ALL public message changes - we filter client-side 
    // because Supabase Realtime doesn't support array 'contains' filters easily.
    // Public room INSERTs are streamed to everyone (including guests).
    // The DM and reply-targeted listeners further down are added only for
    // authenticated users, since their filters require a real userId.
    let channelBuilder: any = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // REMOVED DB-level filter to capture crossposts from other rooms
        },
        async (payload: any) => {
          const newRow = payload.new;
          const currentRoomId = `${location}::${petType}::${breed || 'all'}`;

          // 1. DMs handling
          if (newRow.receiver_id) {
             if (newRow.receiver_id !== userId && newRow.user_id !== userId) return;
          } else {
            // 2. Strict Target Matching for non-DMs
            let crosspostRooms = newRow.crosspost_rooms || newRow.crosspostRooms || [];
            
            // Handle Supabase Realtime stringified Postgres arrays
            if (typeof crosspostRooms === 'string') {
               try {
                 if (crosspostRooms.startsWith('{') && crosspostRooms.endsWith('}')) {
                   crosspostRooms = crosspostRooms.slice(1, -1).split(',').map((s: string) => s.replace(/^"|"$/g, ''));
                 } else {
                   crosspostRooms = JSON.parse(crosspostRooms);
                 }
               } catch (e) {
                 crosspostRooms = [];
               }
            }
            if (!Array.isArray(crosspostRooms)) {
               crosspostRooms = [];
            }
            
            let isTargeted = false;
            const currentBreed = breed || 'all';

            if (crosspostRooms.includes(currentRoomId)) {
                isTargeted = true;
            } else {
                for (const target of crosspostRooms) {
                    if (typeof target !== 'string') continue;
                    const parts = target.split('::');
                    if (parts.length !== 3) continue;
                    
                    const tLoc = parts[0];
                    const tPet = parts[1];
                    const tBreed = parts[2];

                    let petMatch = false;
                    if (tPet === 'all' || petType === 'all' || tPet === petType) petMatch = true;
                    if (!petMatch) continue;

                    let breedMatch = false;
                    if (tBreed === 'all' || currentBreed === 'all' || tBreed === currentBreed) breedMatch = true;
                    if (!breedMatch) continue;

                    let locMatch = false;
                    if (tLoc === location) {
                        locMatch = true;
                    } else if (location === 'global' || tLoc === 'global') {
                        locMatch = true;
                    } else {
                        const tLocParts = tLoc.split(':');
                        const rLocParts = location.split(':');

                        if (tLocParts[0] === 'country' && rLocParts[1] === tLocParts[1]) {
                            locMatch = true;
                        } else if (tLocParts[0] === 'state' && rLocParts[1] === tLocParts[1] && rLocParts[2] === tLocParts[2]) {
                            locMatch = true;
                        } else if (rLocParts[0] === 'country' && tLocParts[1] === rLocParts[1]) {
                            locMatch = true;
                        } else if (rLocParts[0] === 'state' && tLocParts[1] === rLocParts[1] && tLocParts[2] === rLocParts[2]) {
                            locMatch = true;
                        }
                    }

                    if (locMatch) {
                        isTargeted = true;
                        break;
                    }
                }
            }
            
            if (!isTargeted) return;
          }

          const { data: userData } = await supabase
            .from('users')
            .select('id, username, display_name')
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
              .select('id, username, display_name')
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
              .select('id, username, display_name')
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
