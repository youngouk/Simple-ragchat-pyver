import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChatMessage, 
  ChatSession, 
  WidgetConfig, 
  ChatAPIRequest, 
  ChatAPIResponse,
  WebSocketMessage 
} from '@/types/chat';
import { chatAPI } from '@/services/chatAPI';
import { useLocalStorage } from './useLocalStorage';
import { useWebSocket } from './useWebSocket';
import { useMessageStreaming } from './useMessageStreaming';
import { InputValidator } from '@/utils/validator';
import { configService } from '@/services/configService';

interface UseChatResult {
  session: ChatSession | null;
  messages: ChatMessage[];
  streamingMessages: Map<string, ChatMessage>;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  retryConnection: () => void;
  submitFeedback: (messageId: string, feedback: 'positive' | 'negative', comment?: string) => Promise<void>;
}

export const useChat = (config: WidgetConfig): UseChatResult => {
  // Initialize configuration service
  useEffect(() => {
    configService.initialize(config);
  }, [config]);

  // State
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persistent storage
  const [storedSession, setStoredSession] = useLocalStorage<ChatSession | null>('fcw-chat-session', null);
  const [storedMessages, setStoredMessages] = useLocalStorage<ChatMessage[]>('fcw-chat-messages', []);

  // Message streaming hook
  const {
    streamingMessages,
    startStreaming,
    appendToStream,
    completeStream,
    cancelStream,
    isStreaming
  } = useMessageStreaming(config, {
    onStreamStart: (messageId) => {
      if (config.debug) {
        console.log('Stream started for message:', messageId);
      }
    },
    onStreamChunk: (messageId, chunk, fullContent) => {
      if (config.debug) {
        console.log('Stream chunk received:', { messageId, chunkLength: chunk.length });
      }
    },
    onStreamComplete: (messageId, fullContent) => {
      // Move completed streaming message to regular messages
      const streamingMessage = streamingMessages.get(messageId);
      if (streamingMessage) {
        const completedMessage: ChatMessage = {
          ...streamingMessage,
          content: fullContent,
          isStreaming: false
        };
        
        setMessages(prev => {
          // Replace any existing message with same ID or append if new
          const existingIndex = prev.findIndex(msg => msg.id === messageId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = completedMessage;
            return updated;
          } else {
            return [...prev, completedMessage];
          }
        });
      }
      
      if (config.debug) {
        console.log('Stream completed for message:', messageId);
      }
    },
    onStreamError: (messageId, error) => {
      console.error('Stream error for message:', messageId, error);
      setError(`Streaming error: ${error}`);
    }
  });

  // WebSocket connection for real-time features
  const {
    isConnected: wsConnected,
    connectionState: wsConnectionState,
    sendMessage: sendWSMessage,
    lastMessage: lastWSMessage,
    reconnect: reconnectWS
  } = useWebSocket(config, {
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      if (config.debug) {
        console.log('WebSocket connected - real-time features enabled');
      }
    },
    onDisconnect: () => {
      setIsTyping(false);
      if (config.debug) {
        console.log('WebSocket disconnected - falling back to HTTP API');
      }
    },
    onError: (error) => {
      console.warn('WebSocket error:', error);
    }
  });

  // Handle WebSocket messages
  function handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'typing':
        setIsTyping(true);
        // Clear typing indicator after a timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
        break;

      case 'message':
        if (message.content) {
          const botMessage = createBotMessage(message.content);
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }
        break;

      case 'stream_start':
        if (message.messageId) {
          startStreaming(message.messageId, message.content || '');
          setIsTyping(false);
        }
        break;

      case 'stream_chunk':
        if (message.messageId && message.content) {
          appendToStream(message.messageId, message.content);
        }
        break;

      case 'stream_end':
        if (message.messageId) {
          completeStream(message.messageId);
        }
        break;

      case 'stream_error':
        if (message.messageId) {
          cancelStream(message.messageId, message.content || 'Stream error');
        }
        break;

      case 'error':
        setError(message.content || 'WebSocket error occurred');
        setIsTyping(false);
        break;

      case 'connect':
        setConnectionStatus('connected');
        break;

      case 'disconnect':
        setConnectionStatus('disconnected');
        break;
    }
  }

  // Initialize chat from storage
  useEffect(() => {
    if (storedSession) {
      setSession(storedSession);
    }
    if (storedMessages && storedMessages.length > 0) {
      setMessages(storedMessages);
    }
    
    // Test initial connection
    testConnection();
  }, []);

  // Save session and messages to storage
  useEffect(() => {
    if (session) {
      setStoredSession(session);
    }
  }, [session, setStoredSession]);

  useEffect(() => {
    if (messages.length > 0) {
      // Only store last N messages to avoid storage bloat
      const maxStoredMessages = config.maxMessages || 50;
      const messagesToStore = messages.slice(-maxStoredMessages);
      setStoredMessages(messagesToStore);
    }
  }, [messages, config.maxMessages, setStoredMessages]);

  // Test connection to the API
  const testConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await chatAPI.testConnection(config);
      setConnectionStatus('connected');
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      setConnectionStatus('disconnected');
      setError(getErrorMessage(err));
      scheduleRetry();
    }
  }, [config]);

  // Schedule connection retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const maxRetries = 5;
    if (retryCountRef.current < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Max 30 seconds
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current++;
        testConnection();
      }, delay);
    }
  }, [testConnection]);

  // Retry connection manually
  const retryConnection = useCallback(() => {
    retryCountRef.current = 0;
    testConnection();
  }, [testConnection]);

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create user message
  const createUserMessage = (content: string): ChatMessage => ({
    id: generateMessageId(),
    content,
    sender: 'user',
    timestamp: new Date(),
  });

  // Create bot message
  const createBotMessage = (content: string, sources?: any[]): ChatMessage => ({
    id: generateMessageId(),
    content,
    sender: 'bot',
    timestamp: new Date(),
    sources: sources || [],
  });

  // Get error message from error object
  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    if (err?.error) return err.error;
    return config.language === 'en' 
      ? 'Something went wrong. Please try again.' 
      : '문제가 발생했습니다. 다시 시도해주세요.';
  };

  // Send message
  const sendMessage = useCallback(async (messageContent: string) => {
    // Validate message
    const validation = InputValidator.validateMessage(messageContent);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid message');
      return;
    }

    // Check connection (both HTTP and WebSocket)
    if (connectionStatus === 'disconnected') {
      const messages = configService.getLocalizedMessages();
      setError(messages.connectionLost);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage = createUserMessage(messageContent);
      setMessages(prev => [...prev, userMessage]);

      // Try WebSocket first if connected, fallback to HTTP
      if (wsConnected && session?.sessionId) {
        // Send via WebSocket for real-time streaming
        const wsMessage: WebSocketMessage = {
          type: 'message',
          sessionId: session.sessionId,
          content: messageContent,
          messageId: userMessage.id,
          timestamp: new Date().toISOString()
        };
        
        sendWSMessage(wsMessage);
        
        // WebSocket response will be handled by handleWebSocketMessage
        setIsLoading(false);
        return;
      }

      // Fallback to HTTP API
      const apiRequest: ChatAPIRequest = {
        message: messageContent,
        sessionId: session?.sessionId,
        options: {
          maxSources: 5,
          responseStyle: 'standard'
        }
      };

      // Send request to API
      const response: ChatAPIResponse = await chatAPI.sendMessage(
        apiRequest, 
        config,
        abortControllerRef.current.signal
      );

      // Create or update session
      const newSession: ChatSession = {
        sessionId: response.session_id,
        messages: [...(session?.messages || []), userMessage],
        isActive: true,
        createdAt: session?.createdAt || new Date(),
        lastMessageAt: new Date(),
      };
      setSession(newSession);

      // Add bot response
      const botMessage = createBotMessage(response.answer, response.sources);
      setMessages(prev => [...prev, botMessage]);

      // Update session with bot message
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, botMessage],
        lastMessageAt: new Date(),
      } : null);

    } catch (err: any) {
      // Handle different types of errors
      if (err.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      // If it's a connection error, update connection status
      if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') {
        setConnectionStatus('disconnected');
        scheduleRetry();
      }

      // Add error message to chat
      const messages = configService.getLocalizedMessages();
      const errorBotMessage = createBotMessage(messages.errorMessage);
      setMessages(prev => [...prev, errorBotMessage]);

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [session, connectionStatus, config, scheduleRetry, wsConnected, sendWSMessage]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setSession(null);
    setError(null);
    setStoredMessages([]);
    setStoredSession(null);
  }, [setStoredMessages, setStoredSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Auto-retry on connection loss
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      scheduleRetry();
    }
  }, [connectionStatus, scheduleRetry]);

  // Debug logging
  useEffect(() => {
    if (config.debug) {
      console.log('Chat hook state:', {
        sessionId: session?.sessionId,
        messageCount: messages.length,
        isLoading,
        error,
        connectionStatus
      });
    }
  }, [session?.sessionId, messages.length, isLoading, error, connectionStatus, config.debug]);

  // Submit feedback for a message
  const submitFeedback = useCallback(async (
    messageId: string, 
    feedback: 'positive' | 'negative', 
    comment: string = ''
  ) => {
    if (!session?.sessionId) {
      console.warn('Cannot submit feedback: no active session');
      return;
    }

    try {
      await chatAPI.submitFeedback(
        session.sessionId,
        messageId,
        feedback,
        comment,
        config
      );

      if (config.debug) {
        console.log('Feedback submitted:', { messageId, feedback, comment });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      const messages = configService.getLocalizedMessages();
      setError(messages.errorMessage);
    }
  }, [session?.sessionId, config]);

  // Update connection status based on WebSocket and HTTP status
  useEffect(() => {
    if (wsConnected) {
      setConnectionStatus('connected');
    } else if (wsConnectionState === 'connecting') {
      setConnectionStatus('connecting');
    } else {
      // Keep existing HTTP connection status if WebSocket is not available
    }
  }, [wsConnected, wsConnectionState]);

  return {
    session,
    messages,
    streamingMessages,
    sendMessage,
    clearChat,
    isLoading,
    isTyping,
    error,
    connectionStatus,
    retryConnection,
    submitFeedback,
  };
};

export default useChat;