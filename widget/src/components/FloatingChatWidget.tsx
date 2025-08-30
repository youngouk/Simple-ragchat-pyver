import React, { useState, useEffect, useCallback } from 'react';
import { WidgetConfig, WidgetState, ChatSession, WidgetEvents } from '@/types/chat';
import { ChatBubble } from './ChatBubble';
import { ChatWindow } from './ChatWindow';
import { ErrorBoundary } from './ErrorBoundary';
import { useChat } from '@/hooks/useChat';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { InputValidator } from '@/utils/validator';
import { SecuritySanitizer } from '@/utils/sanitizer';

interface FloatingChatWidgetProps {
  config: WidgetConfig;
  events?: WidgetEvents;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  config,
  events
}) => {
  // Widget state
  const [widgetState, setWidgetState] = useState<WidgetState>({
    isOpen: config.autoOpen || false,
    isMinimized: false,
    isConnected: false,
    isTyping: false,
    hasUnreadMessages: false,
    unreadCount: 0,
  });

  // Chat hook for managing chat functionality
  const {
    session,
    messages,
    sendMessage,
    clearChat,
    isLoading,
    isTyping,
    error,
    connectionStatus,
    retryConnection,
    submitFeedback,
    streamingMessages
  } = useChat(config);

  // Local storage for persistence
  const [storedState, setStoredState] = useLocalStorage<Partial<WidgetState>>('fcw-widget-state', {});
  const [storedSession, setStoredSession] = useLocalStorage<ChatSession | null>('fcw-chat-session', null);

  // Initialize widget state from storage
  useEffect(() => {
    if (storedState) {
      setWidgetState(prev => ({
        ...prev,
        ...storedState,
        // Always start closed unless autoOpen is true
        isOpen: config.autoOpen || false,
      }));
    }
  }, [storedState, config.autoOpen]);

  // Update connection status
  useEffect(() => {
    setWidgetState(prev => ({
      ...prev,
      isConnected: connectionStatus === 'connected'
    }));
  }, [connectionStatus]);

  // Handle new messages for unread count
  useEffect(() => {
    if (!widgetState.isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot') {
        setWidgetState(prev => ({
          ...prev,
          hasUnreadMessages: true,
          unreadCount: prev.unreadCount + 1
        }));
      }
    }
  }, [messages, widgetState.isOpen]);

  // Save state to local storage
  useEffect(() => {
    setStoredState({
      isMinimized: widgetState.isMinimized,
      hasUnreadMessages: widgetState.hasUnreadMessages,
      unreadCount: widgetState.unreadCount,
    });
  }, [widgetState.isMinimized, widgetState.hasUnreadMessages, widgetState.unreadCount, setStoredState]);

  // Save session to local storage
  useEffect(() => {
    if (session) {
      setStoredSession(session);
    }
  }, [session, setStoredSession]);

  // Widget action handlers
  const handleOpen = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      hasUnreadMessages: false,
      unreadCount: 0
    }));
    events?.onOpen?.();
  }, [events]);

  const handleClose = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false
    }));
    events?.onClose?.();
  }, [events]);

  const handleMinimize = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isMinimized: true,
      isOpen: false
    }));
    events?.onMinimize?.();
  }, [events]);

  const handleMaximize = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isMinimized: false,
      isOpen: true,
      hasUnreadMessages: false,
      unreadCount: 0
    }));
    events?.onMaximize?.();
  }, [events]);

  const handleSendMessage = useCallback(async (message: string) => {
    // Validate message
    const validation = InputValidator.validateMessage(message);
    if (!validation.isValid) {
      console.error('Invalid message:', validation.error);
      return;
    }

    // Sanitize message
    const sanitizedMessage = SecuritySanitizer.sanitizeUserInput(message);
    
    try {
      await sendMessage(sanitizedMessage);
      events?.onMessageSent?.({
        id: Date.now().toString(),
        content: sanitizedMessage,
        sender: 'user',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      events?.onError?.(error as Error);
    }
  }, [sendMessage, events]);

  const handleClearChat = useCallback(() => {
    clearChat();
    setWidgetState(prev => ({
      ...prev,
      hasUnreadMessages: false,
      unreadCount: 0
    }));
  }, [clearChat]);

  // Generate CSS custom properties for theming
  const getCSSCustomProperties = (): React.CSSProperties => {
    const customProperties: Record<string, string> = {};

    if (config.primaryColor) {
      customProperties['--fcw-primary-color'] = config.primaryColor;
    }
    if (config.secondaryColor) {
      customProperties['--fcw-secondary-color'] = config.secondaryColor;
    }
    if (config.width) {
      customProperties['--fcw-widget-width'] = `${config.width}px`;
    }
    if (config.height) {
      customProperties['--fcw-widget-height'] = `${config.height}px`;
    }
    if (config.borderRadius) {
      customProperties['--fcw-border-radius'] = `${config.borderRadius}px`;
    }

    return customProperties as React.CSSProperties;
  };

  // Generate widget container classes
  const getWidgetClasses = (): string => {
    const classes = ['fcw-widget-container'];
    
    classes.push(`fcw-position-${config.position || 'bottom-right'}`);
    classes.push(`fcw-theme-${config.theme || 'light'}`);
    
    if (widgetState.isOpen) {
      classes.push('fcw-open');
    }
    
    if (widgetState.isMinimized) {
      classes.push('fcw-minimized');
    }

    return classes.join(' ');
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && widgetState.isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [widgetState.isOpen, handleClose]);

  // Log widget interactions for analytics
  useEffect(() => {
    if (config.debug) {
      console.log('Widget state changed:', widgetState);
    }
  }, [widgetState, config.debug]);

  return (
    <ErrorBoundary 
      config={config}
      onError={(error, errorInfo) => {
        console.error('Widget error:', error, errorInfo);
        events?.onError?.(error);
      }}
    >
      <div 
        className={getWidgetClasses()}
        style={getCSSCustomProperties()}
        role="complementary"
        aria-label="Chat Widget"
      >
        {/* Chat Bubble (always visible) */}
        <ChatBubble
          isOpen={widgetState.isOpen}
          isMinimized={widgetState.isMinimized}
          unreadCount={widgetState.unreadCount}
          hasUnreadMessages={widgetState.hasUnreadMessages}
          isConnected={widgetState.isConnected}
          onClick={widgetState.isMinimized ? handleMaximize : handleOpen}
          config={config}
        />

        {/* Chat Window (visible when open) */}
        {widgetState.isOpen && !widgetState.isMinimized && (
          <ChatWindow
            messages={messages}
            streamingMessages={streamingMessages}
            session={session}
            isLoading={isLoading}
            isTyping={isTyping}
            error={error}
            connectionStatus={connectionStatus}
            config={config}
            onSendMessage={handleSendMessage}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onClearChat={handleClearChat}
            onRetryConnection={retryConnection}
            onSubmitFeedback={submitFeedback}
          />
        )}

        {/* Debug Information */}
        {config.debug && (
          <div className="fcw-debug-info" style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            fontSize: '12px',
            borderRadius: '4px',
            zIndex: 2147483647,
            fontFamily: 'monospace'
          }}>
            <div>State: {JSON.stringify(widgetState, null, 2)}</div>
            <div>Messages: {messages.length}</div>
            <div>Connection: {connectionStatus}</div>
            <div>Session: {session?.sessionId ? 'Active' : 'None'}</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default FloatingChatWidget;