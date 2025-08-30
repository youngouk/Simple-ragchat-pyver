import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, WidgetConfig } from '@/types/chat';

interface UsePerformanceOptimizationOptions {
  maxMessagesInMemory?: number;
  virtualizationThreshold?: number;
  debounceDelay?: number;
  enableVirtualization?: boolean;
}

interface UsePerformanceOptimizationResult {
  visibleMessages: ChatMessage[];
  isVirtualized: boolean;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  itemHeight: number;
  scrollToBottom: () => void;
  optimizeMessages: (messages: ChatMessage[]) => ChatMessage[];
}

const DEFAULT_ITEM_HEIGHT = 80; // Estimated height of each message
const DEFAULT_MAX_MESSAGES = 100;
const DEFAULT_VIRTUALIZATION_THRESHOLD = 50;
const DEFAULT_DEBOUNCE_DELAY = 100;

export const usePerformanceOptimization = (
  messages: ChatMessage[],
  config: WidgetConfig,
  containerRef: React.RefObject<HTMLElement>,
  options: UsePerformanceOptimizationOptions = {}
): UsePerformanceOptimizationResult => {
  const {
    maxMessagesInMemory = DEFAULT_MAX_MESSAGES,
    virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
    debounceDelay = DEFAULT_DEBOUNCE_DELAY,
    enableVirtualization = true
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [itemHeight] = useState(DEFAULT_ITEM_HEIGHT);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if virtualization should be enabled
  const shouldVirtualize = enableVirtualization && messages.length > virtualizationThreshold;

  // Calculate visible range for virtualization
  const startIndex = shouldVirtualize 
    ? Math.floor(scrollTop / itemHeight) 
    : 0;
  
  const visibleCount = shouldVirtualize 
    ? Math.ceil(containerHeight / itemHeight) + 2 // +2 for buffer
    : messages.length;
  
  const endIndex = shouldVirtualize 
    ? Math.min(startIndex + visibleCount, messages.length) 
    : messages.length;

  // Get visible messages
  const visibleMessages = shouldVirtualize 
    ? messages.slice(startIndex, endIndex)
    : messages;

  // Total height for virtual scrolling
  const totalHeight = shouldVirtualize ? messages.length * itemHeight : 0;

  // Optimize messages by removing old ones if we exceed the limit
  const optimizeMessages = useCallback((allMessages: ChatMessage[]): ChatMessage[] => {
    if (allMessages.length <= maxMessagesInMemory) {
      return allMessages;
    }

    // Keep the most recent messages and always keep the first few for context
    const contextMessages = allMessages.slice(0, 5); // Keep first 5 messages
    const recentMessages = allMessages.slice(-(maxMessagesInMemory - 5)); // Keep recent messages

    // Merge context and recent messages, avoiding duplicates
    const optimized = [...contextMessages];
    
    recentMessages.forEach(msg => {
      if (!optimized.some(existing => existing.id === msg.id)) {
        optimized.push(msg);
      }
    });

    // Sort by timestamp to maintain order
    return optimized.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [maxMessagesInMemory]);

  // Handle scroll events with debouncing
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setScrollTop(target.scrollTop);
    }, debounceDelay);
  }, [debounceDelay]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [containerRef]);

  // Set up scroll listener and resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldVirtualize) return;

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Set up resize observer to track container height changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    // Initial height calculation
    setContainerHeight(container.clientHeight);
    setScrollTop(container.scrollTop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [containerRef, shouldVirtualize, handleScroll]);

  // Performance monitoring in debug mode
  useEffect(() => {
    if (config.debug) {
      console.log('Performance metrics:', {
        totalMessages: messages.length,
        visibleMessages: visibleMessages.length,
        isVirtualized: shouldVirtualize,
        startIndex,
        endIndex,
        memoryUsage: {
          total: messages.length,
          visible: visibleMessages.length,
          percentage: Math.round((visibleMessages.length / messages.length) * 100)
        }
      });
    }
  }, [messages.length, visibleMessages.length, shouldVirtualize, startIndex, endIndex, config.debug]);

  // Memory pressure detection
  useEffect(() => {
    if (!('memory' in performance)) return;

    const checkMemoryPressure = () => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        if (memoryUsage > 0.8 && config.debug) {
          console.warn('High memory usage detected:', {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB',
            percentage: Math.round(memoryUsage * 100) + '%',
            recommendation: 'Consider reducing maxMessagesInMemory or enabling virtualization'
          });
        }
      }
    };

    const interval = setInterval(checkMemoryPressure, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [config.debug]);

  // Preload optimization for smooth scrolling
  useEffect(() => {
    if (!shouldVirtualize) return;

    // Preload images or heavy content in visible messages
    const preloadPromises = visibleMessages
      .filter(msg => msg.sources && msg.sources.length > 0)
      .map(async (msg) => {
        // Preload any image sources if they exist
        if (msg.sources) {
          return Promise.all(
            msg.sources
              .filter(source => source.content_preview.includes('image'))
              .map(source => {
                return new Promise((resolve) => {
                  const img = new Image();
                  img.onload = resolve;
                  img.onerror = resolve;
                  // Extract image URL from content_preview if it exists
                  const urlMatch = source.content_preview.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
                  if (urlMatch) {
                    img.src = urlMatch[0];
                  } else {
                    resolve(null);
                  }
                });
              })
          );
        }
        return Promise.resolve();
      });

    Promise.all(preloadPromises).catch(error => {
      if (config.debug) {
        console.warn('Preload error:', error);
      }
    });
  }, [visibleMessages, shouldVirtualize, config.debug]);

  return {
    visibleMessages,
    isVirtualized: shouldVirtualize,
    totalHeight,
    startIndex,
    endIndex,
    itemHeight,
    scrollToBottom,
    optimizeMessages
  };
};

export default usePerformanceOptimization;