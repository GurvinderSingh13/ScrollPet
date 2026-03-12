import { useEffect, useRef, useState, useCallback } from 'react';

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

export function useWebSocket({ userId, petType, breed, location, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const roomRef = useRef({ userId, petType, breed, location });

  // Keep refs updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    roomRef.current = { userId, petType, breed, location };
  }, [userId, petType, breed, location]);

  // Main connection effect
  useEffect(() => {
    if (!userId) return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN || 
          wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Join the room
        const room = roomRef.current;
        ws.send(JSON.stringify({
          type: 'join',
          userId: room.userId,
          petType: room.petType,
          breed: room.breed,
          location: room.location,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message' && onMessageRef.current) {
            onMessageRef.current(data.data);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId]);

  // Rejoin when room changes (only if already connected)
  useEffect(() => {
    if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        userId,
        petType,
        breed,
        location,
      }));
    }
  }, [petType, breed, location, userId, isConnected]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
      }));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    sendMessage,
  };
}
