import React, { useState, useCallback, useRef } from 'react';
import { ChatMessage, WidgetConfig, WebSocketMessage } from '@/types/chat';

interface UseMessageStreamingOptions {
  onStreamStart?: (messageId: string) => void;
  onStreamChunk?: (messageId: string, chunk: string, fullContent: string) => void;
  onStreamComplete?: (messageId: string, fullContent: string) => void;
  onStreamError?: (messageId: string, error: string) => void;
}

interface UseMessageStreamingResult {
  streamingMessages: Map<string, ChatMessage>;
  startStreaming: (messageId: string, initialContent?: string) => void;
  appendToStream: (messageId: string, chunk: string) => void;
  completeStream: (messageId: string) => void;
  cancelStream: (messageId: string) => void;
  isStreaming: (messageId: string) => boolean;
}

export const useMessageStreaming = (
  config: WidgetConfig,
  options: UseMessageStreamingOptions = {}
): UseMessageStreamingResult => {
  const [streamingMessages, setStreamingMessages] = useState<Map<string, ChatMessage>>(new Map());
  const streamTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const streamBuffersRef = useRef<Map<string, string[]>>(new Map());

  // Start streaming for a message
  const startStreaming = useCallback((messageId: string, initialContent: string = '') => {
    if (config.debug) {
      console.log('Starting stream for message:', messageId);
    }

    const streamingMessage: ChatMessage = {
      id: messageId,
      content: initialContent,
      sender: 'bot',
      timestamp: new Date(),
      isStreaming: true,
      sources: []
    };

    setStreamingMessages(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, streamingMessage);
      return newMap;
    });

    // Initialize buffer for this stream
    streamBuffersRef.current.set(messageId, [initialContent]);

    options.onStreamStart?.(messageId);

    // Set a timeout to automatically complete the stream if it stalls
    const timeout = setTimeout(() => {
      if (config.debug) {
        console.warn('Stream timeout for message:', messageId);
      }
      completeStream(messageId);
    }, 30000); // 30 second timeout

    streamTimeoutsRef.current.set(messageId, timeout);
  }, [config.debug, options]);

  // Append chunk to streaming message
  const appendToStream = useCallback((messageId: string, chunk: string) => {
    const buffer = streamBuffersRef.current.get(messageId) || [];
    buffer.push(chunk);
    streamBuffersRef.current.set(messageId, buffer);

    const fullContent = buffer.join('');

    setStreamingMessages(prev => {
      const current = prev.get(messageId);
      if (!current) return prev;

      const newMap = new Map(prev);
      newMap.set(messageId, {
        ...current,
        content: fullContent,
        timestamp: new Date() // Update timestamp for latest chunk
      });
      return newMap;
    });

    // Reset timeout since we received new data
    const existingTimeout = streamTimeoutsRef.current.get(messageId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const newTimeout = setTimeout(() => {
      completeStream(messageId);
    }, 10000); // 10 second timeout for next chunk

    streamTimeoutsRef.current.set(messageId, newTimeout);

    options.onStreamChunk?.(messageId, chunk, fullContent);

    if (config.debug) {
      console.log('Stream chunk appended:', { messageId, chunkLength: chunk.length, totalLength: fullContent.length });
    }
  }, [config.debug, options]);

  // Complete streaming for a message
  const completeStream = useCallback((messageId: string) => {
    const streamingMessage = streamingMessages.get(messageId);
    if (!streamingMessage) return;

    if (config.debug) {
      console.log('Completing stream for message:', messageId);
    }

    // Clear timeout
    const timeout = streamTimeoutsRef.current.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      streamTimeoutsRef.current.delete(messageId);
    }

    // Get final content
    const buffer = streamBuffersRef.current.get(messageId) || [];
    const fullContent = buffer.join('');

    // Update message to mark as not streaming
    setStreamingMessages(prev => {
      const current = prev.get(messageId);
      if (!current) return prev;

      const newMap = new Map(prev);
      newMap.set(messageId, {
        ...current,
        content: fullContent,
        isStreaming: false,
        timestamp: new Date()
      });
      return newMap;
    });

    // Clean up buffer
    streamBuffersRef.current.delete(messageId);

    options.onStreamComplete?.(messageId, fullContent);
  }, [streamingMessages, config.debug, options]);

  // Cancel streaming for a message
  const cancelStream = useCallback((messageId: string, error?: string) => {
    if (config.debug) {
      console.log('Cancelling stream for message:', messageId, error);
    }

    // Clear timeout
    const timeout = streamTimeoutsRef.current.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      streamTimeoutsRef.current.delete(messageId);
    }

    // Remove from streaming messages
    setStreamingMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });

    // Clean up buffer
    streamBuffersRef.current.delete(messageId);

    if (error) {
      options.onStreamError?.(messageId, error);
    }
  }, [config.debug, options]);

  // Check if message is currently streaming
  const isStreaming = useCallback((messageId: string): boolean => {
    const message = streamingMessages.get(messageId);
    return message?.isStreaming === true;
  }, [streamingMessages]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear all timeouts
      streamTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      streamTimeoutsRef.current.clear();
      streamBuffersRef.current.clear();
    };
  }, []);

  return {
    streamingMessages,
    startStreaming,
    appendToStream,
    completeStream,
    cancelStream,
    isStreaming
  };
};

export default useMessageStreaming;