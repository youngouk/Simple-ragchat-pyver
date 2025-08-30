import React from 'react';
import { WidgetConfig } from '@/types/chat';

interface ChatBubbleProps {
  isOpen: boolean;
  isMinimized: boolean;
  unreadCount: number;
  hasUnreadMessages: boolean;
  isConnected: boolean;
  onClick: () => void;
  config: WidgetConfig;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOpen,
  isMinimized,
  unreadCount,
  hasUnreadMessages,
  isConnected,
  onClick,
  config
}) => {
  // Don't show bubble when window is open (unless minimized)
  if (isOpen && !isMinimized) {
    return null;
  }

  const getBubbleIcon = () => {
    if (isMinimized) {
      return (
        <svg className="fcw-bubble-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 8h16v2H4zm0 5h16v2H4z"/>
        </svg>
      );
    }

    return (
      <svg className="fcw-bubble-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    );
  };

  const getAriaLabel = () => {
    if (isMinimized) {
      return 'Restore chat window';
    }
    
    if (hasUnreadMessages) {
      return `Open chat - ${unreadCount} unread messages`;
    }
    
    return 'Open chat';
  };

  const getBubbleTitle = () => {
    if (!isConnected) {
      return 'Chat is offline';
    }
    
    if (isMinimized) {
      return 'Click to restore chat';
    }
    
    if (hasUnreadMessages) {
      return `${unreadCount} new message${unreadCount > 1 ? 's' : ''}`;
    }
    
    return config.title || 'Chat with us';
  };

  return (
    <button
      className={`fcw-chat-bubble ${!isConnected ? 'fcw-offline' : ''}`}
      onClick={onClick}
      aria-label={getAriaLabel()}
      title={getBubbleTitle()}
      style={{
        background: config.primaryColor ? 
          `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}dd)` : 
          undefined
      }}
    >
      {/* Connection indicator */}
      {!isConnected && (
        <div className="fcw-connection-indicator" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="6" r="6" fill="#ef4444"/>
            <path d="M4 4l4 4M8 4l-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {/* Main icon */}
      {getBubbleIcon()}
      
      {/* Unread messages badge */}
      {hasUnreadMessages && unreadCount > 0 && (
        <div 
          className="fcw-bubble-badge"
          aria-label={`${unreadCount} unread messages`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}

      {/* Pulse animation for new messages */}
      {hasUnreadMessages && (
        <div 
          className="fcw-bubble-pulse" 
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: config.primaryColor || '#3b82f6',
            opacity: 0.3,
            animation: 'fcw-pulse 2s infinite'
          }}
        />
      )}

      {/* Loading indicator when connecting */}
      {!isConnected && (
        <div 
          className="fcw-bubble-loading"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'fcw-spin 1s linear infinite'
          }}
        />
      )}

      <style jsx>{`
        @keyframes fcw-pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }

        @keyframes fcw-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .fcw-chat-bubble {
          position: relative;
          overflow: hidden;
        }

        .fcw-chat-bubble.fcw-offline {
          background: #6b7280 !important;
          cursor: not-allowed;
        }

        .fcw-connection-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 1;
        }

        .fcw-bubble-loading {
          z-index: 2;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .fcw-chat-bubble {
            border: 2px solid white;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fcw-bubble-pulse,
          .fcw-bubble-loading {
            animation: none !important;
          }
        }
      `}</style>
    </button>
  );
};

export default ChatBubble;