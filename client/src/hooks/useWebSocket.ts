import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id: string;
  userId: string;
  petType: string;
  location: string;
  content: string;
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
  location: string;
  onMessage?: (message: Message) => void;
}

export function useWebSocket({ userId, petType, location, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join the room
      ws.send(JSON.stringify({
        type: 'join',
        userId,
        petType,
        location,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && onMessage) {
          onMessage(data.data);
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
  }, [userId, petType, location, onMessage]);

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

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Rejoin when room changes
  useEffect(() => {
    if (isConnected && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        userId,
        petType,
        location,
      }));
    }
  }, [petType, location, userId, isConnected]);

  return {
    isConnected,
    sendMessage,
    disconnect,
  };
}
