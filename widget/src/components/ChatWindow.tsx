import React, { useEffect, useRef } from 'react';
import { ChatMessage, ChatSession, WidgetConfig } from '@/types/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatWindowProps {
  messages: ChatMessage[];
  streamingMessages?: Map<string, ChatMessage>;
  session: ChatSession | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  config: WidgetConfig;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  onClearChat: () => void;
  onRetryConnection: () => void;
  onSubmitFeedback: (messageId: string, feedback: 'positive' | 'negative', comment?: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  streamingMessages,
  session,
  isLoading,
  isTyping,
  error,
  connectionStatus,
  config,
  onSendMessage,
  onClose,
  onMinimize,
  onClearChat,
  onRetryConnection,
  onSubmitFeedback
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus trap for accessibility
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = windowRef.current?.querySelectorAll(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, []);

  const getConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '연결 중...';
      case 'disconnected':
        return '연결이 끊어졌습니다. 재연결 중...';
      default:
        return null;
    }
  };

  const getWelcomeMessage = (): ChatMessage | null => {
    if (messages.length > 0 || !config.showWelcomeMessage) {
      return null;
    }

    return {
      id: 'welcome',
      content: config.welcomeMessage || (
        config.language === 'en' 
          ? 'Hello! How can I help you today?' 
          : '안녕하세요! 무엇을 도와드릴까요?'
      ),
      sender: 'bot',
      timestamp: new Date(),
    };
  };

  const welcomeMessage = getWelcomeMessage();
  const displayMessages = welcomeMessage ? [welcomeMessage, ...messages] : messages;

  return (
    <div 
      ref={windowRef}
      className="fcw-chat-window"
      role="dialog"
      aria-label="Chat Window"
      aria-modal="true"
      style={{
        width: config.width ? `${config.width}px` : undefined,
        height: config.height ? `${config.height}px` : undefined,
        borderRadius: config.borderRadius ? `${config.borderRadius}px` : undefined,
        boxShadow: config.shadows === false ? 'none' : undefined,
      }}
    >
      {/* Header */}
      <header className="fcw-chat-header">
        <div className="fcw-header-content">
          {/* Avatar/Logo */}
          <div className="fcw-header-avatar">
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            )}
          </div>

          {/* Title and subtitle */}
          <div className="fcw-header-info">
            <h3>{config.title || (config.language === 'en' ? 'Chat Support' : '채팅 지원')}</h3>
            {config.subtitle && <p>{config.subtitle}</p>}
          </div>
        </div>

        {/* Header actions */}
        <div className="fcw-header-actions">
          {/* Clear chat button */}
          {messages.length > 0 && (
            <button
              className="fcw-header-button"
              onClick={onClearChat}
              title={config.language === 'en' ? 'Clear chat' : '대화 지우기'}
              aria-label={config.language === 'en' ? 'Clear chat' : '대화 지우기'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          )}

          {/* Minimize button */}
          <button
            className="fcw-header-button"
            onClick={onMinimize}
            title={config.language === 'en' ? 'Minimize' : '최소화'}
            aria-label={config.language === 'en' ? 'Minimize chat window' : '채팅창 최소화'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h12v2H6z"/>
            </svg>
          </button>

          {/* Close button */}
          <button
            className="fcw-header-button"
            onClick={onClose}
            title={config.language === 'en' ? 'Close' : '닫기'}
            aria-label={config.language === 'en' ? 'Close chat window' : '채팅창 닫기'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Connection status bar */}
      {connectionStatus !== 'connected' && (
        <div className={`fcw-connection-status fcw-${connectionStatus}`}>
          {getConnectionStatusMessage()}
          {connectionStatus === 'disconnected' && (
            <button 
              className="fcw-reconnect-button"
              onClick={onRetryConnection}
              style={{ 
                marginLeft: '8px', 
                background: 'none', 
                border: '1px solid currentColor', 
                color: 'inherit',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {config.language === 'en' ? 'Reconnect' : '재연결'}
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fcw-error-message" style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '8px 16px',
          fontSize: '12px',
          borderBottom: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Messages container */}
      <div className="fcw-messages-container">
        {isLoading && messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px'
          }}>
            <LoadingSpinner 
              config={config} 
              size="medium"
              text={config.language === 'en' ? 'Connecting...' : '연결 중...'}
            />
          </div>
        ) : (
          <>
            <MessageList 
              messages={displayMessages}
              streamingMessages={streamingMessages}
              config={config}
              onSubmitFeedback={onSubmitFeedback}
            />
            
            {/* Typing indicator */}
            {isTyping && config.enableTypingIndicator !== false && (
              <TypingIndicator config={config} />
            )}

            {/* Loading spinner for ongoing requests */}
            {isLoading && messages.length > 0 && (
              <div style={{ padding: '8px 16px' }}>
                <LoadingSpinner 
                  config={config} 
                  size="small"
                />
              </div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isLoading || connectionStatus !== 'connected'}
        placeholder={config.placeholderText || (
          config.language === 'en' 
            ? 'Type your message...' 
            : '메시지를 입력하세요...'
        )}
        config={config}
      />

      {/* Powered by footer */}
      {config.customMessages?.poweredBy !== '' && (
        <div className="fcw-powered-by" style={{
          padding: '4px 16px',
          fontSize: '10px',
          color: '#9ca3af',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          {config.customMessages?.poweredBy || 
           (config.language === 'en' ? 'Powered by Dual Lambda RAG' : 'Dual Lambda RAG 제공')}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;