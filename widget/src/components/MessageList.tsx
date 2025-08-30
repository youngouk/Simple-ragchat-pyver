import React from 'react';
import { ChatMessage, WidgetConfig } from '@/types/chat';
import { SecuritySanitizer } from '@/utils/sanitizer';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessages?: Map<string, ChatMessage>;
  config: WidgetConfig;
  onSubmitFeedback?: (messageId: string, feedback: 'positive' | 'negative', comment?: string) => void;
}

interface MessageItemProps {
  message: ChatMessage;
  config: WidgetConfig;
  onSubmitFeedback?: (messageId: string, feedback: 'positive' | 'negative', comment?: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, config, onSubmitFeedback }) => {
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat(config.language === 'en' ? 'en-US' : 'ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: config.language === 'en'
    }).format(timestamp);
  };

  const renderMessageContent = () => {
    if (message.sender === 'bot') {
      // Sanitize and render bot response with markdown support
      const sanitizedContent = SecuritySanitizer.sanitizeBotResponse(message.content);
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          className="fcw-message-html-content"
        />
      );
    } else {
      // For user messages, just display as plain text
      return <div>{message.content}</div>;
    }
  };

  const renderSources = () => {
    if (!message.sources || message.sources.length === 0) {
      return null;
    }

    const sanitizedSources = SecuritySanitizer.sanitizeMessageSources(message.sources);

    return (
      <div className="fcw-message-sources">
        <div className="fcw-sources-title">
          {config.language === 'en' ? 'Sources:' : '출처:'}
        </div>
        {sanitizedSources.map((source, index) => (
          <div key={index} className="fcw-source-item">
            <div className="fcw-source-document">
              📄 {source.document}
              {source.page && ` (${config.language === 'en' ? 'Page' : '페이지'} ${source.page})`}
            </div>
            <div className="fcw-source-preview">
              {source.content_preview}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getMessageClasses = () => {
    const classes = ['fcw-message'];
    classes.push(`fcw-message-${message.sender}`);
    
    if (message.isStreaming) {
      classes.push('fcw-message-streaming');
    }
    
    return classes.join(' ');
  };

  const getAvatarContent = () => {
    if (message.sender === 'bot') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20,9V7c0-4.42-3.58-8-8-8s-8,3.58-8,8v2c-1.1,0-2,0.9-2,2v4c0,1.1,0.9,2,2,2h1v-6.5c0-2.76,2.24-5,5-5 s5,2.24,5,5V17h1c1.1,0,2-0.9,2-2v-4C22,9.9,21.1,9,20,9z"/>
        </svg>
      );
    } else {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
        </svg>
      );
    }
  };

  return (
    <div className={getMessageClasses()}>
      {/* Avatar (only for bot messages or when enabled for user) */}
      {(message.sender === 'bot' || config.customMessages) && (
        <div className="fcw-message-avatar">
          {getAvatarContent()}
        </div>
      )}

      <div className="fcw-message-bubble">
        <div className="fcw-message-content">
          {renderMessageContent()}
          
          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="fcw-streaming-indicator" aria-live="polite">
              <div className="fcw-streaming-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
        </div>

        {/* Sources (only for bot messages) */}
        {message.sender === 'bot' && renderSources()}

        {/* Timestamp and feedback buttons */}
        <div className="fcw-message-timestamp">
          {formatTimestamp(message.timestamp)}
          {message.sender === 'user' && (
            <span className="fcw-message-status" aria-label="Message sent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
              </svg>
            </span>
          )}
        </div>

        {/* Feedback buttons for bot messages */}
        {message.sender === 'bot' && onSubmitFeedback && (
          <div className="fcw-message-feedback" style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}>
            <button
              onClick={() => onSubmitFeedback(message.id, 'positive')}
              className="fcw-feedback-button fcw-feedback-positive"
              title={config.language === 'en' ? 'This was helpful' : '도움이 되었습니다'}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#10b981',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10.08L23,10M1,21H5V9H1V21Z"/>
              </svg>
            </button>
            <button
              onClick={() => onSubmitFeedback(message.id, 'negative')}
              className="fcw-feedback-button fcw-feedback-negative"
              title={config.language === 'en' ? 'This was not helpful' : '도움이 되지 않았습니다'}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#ef4444',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,15H23L20.5,18.5L23,22H19L17,19.5L15,22H11L13.5,18.5L11,15H15L17,17.5L19,15M1,3H5V15H1V3M17,1A2,2 0 0,1 19,3V13C19,13.26 18.95,13.5 18.86,13.73L15.84,20.78C15.54,21.5 14.83,22 14,22H5A2,2 0 0,1 3,20V10C3,9.45 3.22,8.95 3.59,8.58L10.17,2L11.23,3.05C11.5,3.32 11.67,3.7 11.67,4.11C11.67,4.22 11.66,4.33 11.64,4.43L10.68,9H17A2,2 0 0,1 19,11V13L17,1Z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .fcw-message-html-content {
          /* Ensure proper spacing for HTML content */
          line-height: 1.4;
        }

        .fcw-message-html-content p {
          margin: 0 0 8px 0;
        }

        .fcw-message-html-content p:last-child {
          margin-bottom: 0;
        }

        .fcw-message-html-content ul,
        .fcw-message-html-content ol {
          margin: 8px 0;
          padding-left: 20px;
        }

        .fcw-message-html-content li {
          margin: 4px 0;
        }

        .fcw-message-html-content code {
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }

        .fcw-message-html-content pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 8px 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }

        .fcw-message-html-content pre code {
          background: none;
          padding: 0;
        }

        .fcw-message-html-content blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 12px;
          margin: 8px 0;
          color: #6b7280;
        }

        .fcw-streaming-indicator {
          display: flex;
          align-items: center;
          margin-top: 4px;
        }

        .fcw-streaming-dots {
          display: flex;
          gap: 2px;
        }

        .fcw-streaming-dots span {
          width: 4px;
          height: 4px;
          background: currentColor;
          border-radius: 50%;
          animation: fcw-pulse 1.5s ease-in-out infinite;
        }

        .fcw-streaming-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .fcw-streaming-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes fcw-pulse {
          0%, 60% {
            opacity: 0.4;
          }
          30% {
            opacity: 1;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .fcw-message-content {
            border-width: 2px !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fcw-streaming-dots span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessages, config, onSubmitFeedback }) => {
  // Combine regular messages with streaming messages
  const allMessages = React.useMemo(() => {
    const combined = [...messages];
    
    // Add streaming messages that aren't already in the regular messages
    if (streamingMessages) {
      streamingMessages.forEach((streamingMessage) => {
        const existsInRegular = messages.some(msg => msg.id === streamingMessage.id);
        if (!existsInRegular) {
          combined.push(streamingMessage);
        }
      });
    }
    
    // Sort by timestamp to maintain chronological order
    return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, streamingMessages]);

  if (allMessages.length === 0) {
    return (
      <div className="fcw-empty-state" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#9ca3af',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: '16px', opacity: 0.5 }}>
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <p style={{ margin: 0, fontSize: '14px' }}>
          {config.language === 'en' 
            ? 'Start a conversation...' 
            : '대화를 시작해보세요...'}
        </p>
      </div>
    );
  }

  return (
    <div className="fcw-message-list" role="log" aria-live="polite" aria-label="Chat messages">
      {allMessages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          config={config}
          onSubmitFeedback={onSubmitFeedback}
        />
      ))}
    </div>
  );
};

export default MessageList;