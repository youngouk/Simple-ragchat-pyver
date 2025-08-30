import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig, WebSocketMessage } from '@/types/chat';

interface UseWebSocketResult {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  reconnect: () => void;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (
  config: WidgetConfig,
  options: UseWebSocketOptions = {}
): UseWebSocketResult => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;

  // Get WebSocket URL from config
  const getWebSocketURL = useCallback(() => {
    if (config.websocketUrl) {
      return config.websocketUrl;
    }
    
    // Convert HTTP(S) API URL to WebSocket URL
    const apiUrl = config.apiUrl.replace(/\/$/, '');
    return apiUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
  }, [config.apiUrl, config.websocketUrl]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState('connecting');
      setError(null);

      const wsUrl = getWebSocketURL();
      if (config.debug) {
        console.log('WebSocket connecting to:', wsUrl);
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = (event) => {
        setConnectionState('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        if (config.debug) {
          console.log('WebSocket connected:', event);
        }
        
        options.onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          options.onMessage?.(message);
          
          if (config.debug) {
            console.log('WebSocket message received:', message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        setConnectionState('disconnected');
        wsRef.current = null;
        
        if (config.debug) {
          console.log('WebSocket disconnected:', event);
        }

        options.onDisconnect?.();

        // Attempt to reconnect if not a clean close
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionState('error');
        setError('WebSocket connection error');
        
        console.error('WebSocket error:', event);
        options.onError?.(event);
      };

    } catch (error) {
      setConnectionState('error');
      setError(`Failed to create WebSocket connection: ${error}`);
      console.error('WebSocket connection failed:', error);
    }
  }, [getWebSocketURL, config.debug, options, maxReconnectAttempts]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const attempt = reconnectAttemptsRef.current + 1;
    const delay = Math.min(reconnectInterval * Math.pow(2, attempt), 30000); // Max 30 seconds

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current = attempt;
      connect();
    }, delay);

    if (config.debug) {
      console.log(`WebSocket reconnect scheduled in ${delay}ms (attempt ${attempt})`);
    }
  }, [connect, reconnectInterval, config.debug]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        wsRef.current.send(messageString);
        
        if (config.debug) {
          console.log('WebSocket message sent:', message);
        }
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        setError('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not connected, cannot send message');
      setError('Not connected to WebSocket');
    }
  }, [config.debug]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 100); // Small delay before reconnecting
  }, [disconnect, connect]);

  // Connect on mount and when config changes
  useEffect(() => {
    if (config.websocketUrl || config.apiUrl) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [config.websocketUrl, config.apiUrl]); // Re-connect if URLs change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Handle visibility change (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectionState === 'disconnected') {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionState, reconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (connectionState === 'disconnected' || connectionState === 'error') {
        reconnect();
      }
    };

    const handleOffline = () => {
      setConnectionState('disconnected');
      setError('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionState, reconnect]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    sendMessage,
    lastMessage,
    error,
    reconnect,
  };
};

export default useWebSocket;