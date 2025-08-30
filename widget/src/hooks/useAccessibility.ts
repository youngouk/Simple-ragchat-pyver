import { useEffect, useCallback, useRef } from 'react';
import { WidgetConfig, ChatMessage } from '@/types/chat';

interface UseAccessibilityOptions {
  announceMessages?: boolean;
  enableKeyboardNavigation?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
  screenReaderOptimized?: boolean;
}

interface UseAccessibilityResult {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusToInput: () => void;
  handleKeyNavigation: (event: KeyboardEvent, context: 'widget' | 'chat' | 'input') => void;
  ariaLiveRegion: React.RefObject<HTMLDivElement>;
  setupFocusTrap: (container: HTMLElement) => () => void;
  getAccessibilityProps: (element: 'widget' | 'bubble' | 'window' | 'message' | 'input') => Record<string, any>;
}

export const useAccessibility = (
  config: WidgetConfig,
  options: UseAccessibilityOptions = {}
): UseAccessibilityResult => {
  const {
    announceMessages = true,
    enableKeyboardNavigation = true,
    reducedMotion = false,
    highContrast = false,
    screenReaderOptimized = true
  } = options;

  const ariaLiveRegion = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout>();

  // Announce messages to screen readers
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceMessages || !ariaLiveRegion.current) return;

    // Clear any existing timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    const region = ariaLiveRegion.current;
    region.setAttribute('aria-live', priority);
    
    // Clear and set the message with a small delay to ensure screen readers notice the change
    region.textContent = '';
    
    announcementTimeoutRef.current = setTimeout(() => {
      region.textContent = message;
      
      // Clear the announcement after a reasonable time to avoid cluttering
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 5000);
    }, 100);
  }, [announceMessages]);

  // Set focus to input element
  const setFocusToInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback((event: KeyboardEvent, context: 'widget' | 'chat' | 'input') => {
    if (!enableKeyboardNavigation) return;

    switch (context) {
      case 'widget':
        // Widget-level keyboard shortcuts
        if (event.key === 'Escape') {
          event.preventDefault();
          announceMessage(config.language === 'en' ? 'Chat closed' : '채팅 닫음');
          return 'close';
        }
        break;

      case 'chat':
        // Chat window keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'k':
              event.preventDefault();
              setFocusToInput();
              announceMessage(config.language === 'en' ? 'Focus moved to message input' : '메시지 입력란으로 포커스 이동');
              break;
            case 'l':
              event.preventDefault();
              announceMessage(config.language === 'en' ? 'Chat cleared' : '채팅 지움');
              return 'clear';
          }
        }
        break;

      case 'input':
        // Input-specific keyboard shortcuts
        if (event.key === 'Enter' && !event.shiftKey) {
          if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') {
            // Allow Enter in textarea for multiline input
            return;
          }
          event.preventDefault();
          return 'send';
        }
        
        if (event.key === 'Escape') {
          event.preventDefault();
          (event.target as HTMLElement).blur();
          announceMessage(config.language === 'en' ? 'Input cleared' : '입력 취소');
          return 'cancel';
        }
        break;
    }
  }, [enableKeyboardNavigation, config.language, announceMessage, setFocusToInput]);

  // Setup focus trap for modal-like behavior
  const setupFocusTrap = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus the first element when trap is set up
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Get accessibility props for different elements
  const getAccessibilityProps = useCallback((element: 'widget' | 'bubble' | 'window' | 'message' | 'input') => {
    const baseProps = {
      role: undefined as string | undefined,
      'aria-label': undefined as string | undefined,
      'aria-labelledby': undefined as string | undefined,
      'aria-describedby': undefined as string | undefined,
      'aria-expanded': undefined as boolean | undefined,
      'aria-live': undefined as 'polite' | 'assertive' | 'off' | undefined,
      'aria-atomic': undefined as boolean | undefined,
      'aria-relevant': undefined as string | undefined,
      'tabIndex': undefined as number | undefined,
    };

    switch (element) {
      case 'widget':
        return {
          ...baseProps,
          role: 'complementary',
          'aria-label': config.language === 'en' ? 'Chat Widget' : '채팅 위젯',
          'aria-describedby': 'fcw-widget-description'
        };

      case 'bubble':
        return {
          ...baseProps,
          role: 'button',
          'aria-label': config.language === 'en' 
            ? 'Open chat window' 
            : '채팅창 열기',
          'aria-expanded': false,
          'tabIndex': 0
        };

      case 'window':
        return {
          ...baseProps,
          role: 'dialog',
          'aria-label': config.language === 'en' ? 'Chat Window' : '채팅창',
          'aria-modal': 'true',
          'aria-describedby': 'fcw-chat-description'
        };

      case 'message':
        return {
          ...baseProps,
          role: 'log',
          'aria-live': 'polite',
          'aria-atomic': false,
          'aria-relevant': 'additions',
          'aria-label': config.language === 'en' ? 'Chat messages' : '채팅 메시지'
        };

      case 'input':
        return {
          ...baseProps,
          role: 'textbox',
          'aria-label': config.language === 'en' 
            ? 'Type your message here' 
            : '메시지를 입력하세요',
          'aria-describedby': 'fcw-input-help',
          'aria-multiline': 'true'
        };

      default:
        return baseProps;
    }
  }, [config.language]);

  // Set up global keyboard listeners
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Global keyboard shortcuts that work regardless of focus
      if (event.altKey && event.key === 'c') {
        event.preventDefault();
        announceMessage(config.language === 'en' ? 'Chat widget toggle' : '채팅 위젯 토글');
        // This would trigger widget toggle - to be handled by parent component
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [config.language, announceMessage]);

  // Detect and respond to user preferences
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && config.debug) {
      console.log('Reduced motion preference detected');
    }

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast && config.debug) {
      console.log('High contrast preference detected');
    }

    // Check for screen reader
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis?.getVoices().length > 0;
    
    if (hasScreenReader && config.debug) {
      console.log('Screen reader potentially detected');
    }
  }, [config.debug]);

  // Announce important state changes
  useEffect(() => {
    if (screenReaderOptimized) {
      // These would be triggered by parent component state changes
      // announceMessage('Chat connected', 'polite');
      // announceMessage('New message received', 'polite');
    }
  }, [screenReaderOptimized, announceMessage]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  return {
    announceMessage,
    setFocusToInput,
    handleKeyNavigation,
    ariaLiveRegion,
    setupFocusTrap,
    getAccessibilityProps
  };
};

export default useAccessibility;