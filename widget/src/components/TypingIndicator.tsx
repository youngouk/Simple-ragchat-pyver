import React from 'react';
import { WidgetConfig } from '@/types/chat';

interface TypingIndicatorProps {
  config: WidgetConfig;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ config }) => {
  const getTypingText = () => {
    return config.customMessages?.typingIndicator || 
           (config.language === 'en' ? 'AI is typing...' : 'AI가 응답 중...');
  };

  return (
    <div className="fcw-message fcw-message-bot">
      {/* Bot avatar */}
      <div className="fcw-message-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20,9V7c0-4.42-3.58-8-8-8s-8,3.58-8,8v2c-1.1,0-2,0.9-2,2v4c0,1.1,0.9,2,2,2h1v-6.5c0-2.76,2.24-5,5-5 s5,2.24,5,5V17h1c1.1,0,2-0.9,2-2v-4C22,9.9,21.1,9,20,9z"/>
        </svg>
      </div>

      {/* Typing indicator bubble */}
      <div className="fcw-typing-indicator" role="status" aria-live="polite" aria-label={getTypingText()}>
        {/* Animated dots */}
        <div className="fcw-typing-dots">
          <div className="fcw-typing-dot"></div>
          <div className="fcw-typing-dot"></div>
          <div className="fcw-typing-dot"></div>
        </div>

        {/* Optional typing text */}
        {config.debug && (
          <span className="fcw-typing-text" style={{
            marginLeft: '8px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            {getTypingText()}
          </span>
        )}
      </div>

      <style jsx>{`
        .fcw-typing-indicator {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 18px 18px 18px 4px;
          max-width: 100px;
          animation: fcw-fade-in 0.3s ease-out;
        }

        .fcw-typing-dots {
          display: flex;
          gap: 3px;
        }

        .fcw-typing-dot {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: fcw-typing-bounce 1.5s ease-in-out infinite;
        }

        .fcw-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .fcw-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes fcw-typing-bounce {
          0%, 60% {
            opacity: 0.4;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }

        @keyframes fcw-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Dark theme support */
        .fcw-theme-dark .fcw-typing-indicator {
          background: #374151;
          border-color: #4b5563;
        }

        .fcw-theme-dark .fcw-typing-dot {
          background: #9ca3af;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .fcw-typing-indicator {
            border-width: 2px !important;
          }
          
          .fcw-typing-dot {
            background: #000 !important;
          }
          
          .fcw-theme-dark .fcw-typing-dot {
            background: #fff !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fcw-typing-dot {
            animation: none !important;
          }
          
          .fcw-typing-indicator {
            animation: none !important;
          }
        }

        /* Custom color support */
        .fcw-typing-indicator {
          border-color: ${config.primaryColor ? `${config.primaryColor}20` : '#e5e7eb'};
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;