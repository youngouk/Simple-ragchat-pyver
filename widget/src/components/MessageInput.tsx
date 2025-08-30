import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WidgetConfig } from '@/types/chat';
import { InputValidator, RateLimiter } from '@/utils/validator';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  config: WidgetConfig;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  placeholder,
  config
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rateLimiterRef = useRef(new RateLimiter(10, 60000)); // 10 messages per minute

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 100); // Max 100px height
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setValidationError(null);
    
    // Auto-resize
    adjustTextareaHeight();
  };

  // Handle composition events (for IME input like Korean, Chinese, Japanese)
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // Validate message before sending
  const validateAndSend = useCallback(() => {
    if (isComposing || disabled) return;

    const trimmedMessage = message.trim();
    
    // Validate message content
    const validation = InputValidator.validateMessage(trimmedMessage);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid message');
      return;
    }

    // Check rate limiting
    if (!rateLimiterRef.current.isAllowed()) {
      const timeUntilReset = rateLimiterRef.current.getTimeUntilReset();
      const secondsLeft = Math.ceil(timeUntilReset / 1000);
      setValidationError(
        config.language === 'en' 
          ? `Please wait ${secondsLeft} seconds before sending another message`
          : `${secondsLeft}초 후에 다시 시도해주세요`
      );
      return;
    }

    // Send message
    onSendMessage(trimmedMessage);
    setMessage('');
    setValidationError(null);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isComposing, disabled, onSendMessage, config.language]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateAndSend();
    }
  };

  // Handle send button click
  const handleSendClick = () => {
    validateAndSend();
  };

  // Focus textarea when component mounts
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !disabled) {
      textarea.focus();
    }
  }, [disabled]);

  // Clear validation error after a delay
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  const getCharacterCount = () => {
    return message.length;
  };

  const getMaxCharacters = () => {
    return 1000; // From validator
  };

  const isNearLimit = () => {
    return getCharacterCount() > getMaxCharacters() * 0.8;
  };

  const isOverLimit = () => {
    return getCharacterCount() > getMaxCharacters();
  };

  const canSend = () => {
    return message.trim().length > 0 && 
           !disabled && 
           !isComposing && 
           !isOverLimit() &&
           !validationError;
  };

  return (
    <div className="fcw-input-container">
      {/* Validation error */}
      {validationError && (
        <div className="fcw-input-error" style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '6px 12px',
          fontSize: '12px',
          borderRadius: '6px',
          marginBottom: '8px',
          border: '1px solid #fecaca'
        }}>
          {validationError}
        </div>
      )}

      <div className="fcw-input-wrapper">
        {/* Message input */}
        <div className="fcw-textarea-container" style={{ position: 'relative', flex: 1 }}>
          <textarea
            ref={textareaRef}
            className="fcw-message-input"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            style={{
              resize: 'none',
              overflow: 'hidden',
              borderColor: isOverLimit() ? '#ef4444' : undefined
            }}
            aria-label="Message input"
            aria-describedby={validationError ? 'input-error' : undefined}
            maxLength={getMaxCharacters() + 50} // Allow slight overflow for better UX
          />

          {/* Character counter */}
          {(isNearLimit() || config.debug) && (
            <div 
              className="fcw-character-counter"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '8px',
                fontSize: '10px',
                color: isOverLimit() ? '#ef4444' : '#9ca3af',
                background: 'white',
                padding: '2px 4px',
                borderRadius: '3px'
              }}
            >
              {getCharacterCount()}/{getMaxCharacters()}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          className="fcw-send-button"
          onClick={handleSendClick}
          disabled={!canSend()}
          title={config.language === 'en' ? 'Send message' : '메시지 보내기'}
          aria-label={config.language === 'en' ? 'Send message' : '메시지 보내기'}
          style={{
            background: config.primaryColor && canSend() ? config.primaryColor : undefined
          }}
        >
          {disabled ? (
            // Loading spinner
            <svg 
              className="fcw-loading-spinner" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                animation: 'fcw-spin 1s linear infinite'
              }}
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray="32" 
                strokeDashoffset="16"
              />
            </svg>
          ) : (
            // Send icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Input hints */}
      {!disabled && message.length === 0 && (
        <div className="fcw-input-hints" style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          {config.language === 'en' 
            ? 'Press Enter to send, Shift+Enter for new line'
            : 'Enter로 전송, Shift+Enter로 줄바꿈'}
        </div>
      )}

      <style jsx>{`
        @keyframes fcw-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fcw-message-input {
          transition: border-color 0.2s ease;
        }

        .fcw-message-input:focus {
          outline: none;
          border-color: ${config.primaryColor || '#3b82f6'} !important;
          box-shadow: 0 0 0 3px ${config.primaryColor ? `${config.primaryColor}20` : 'rgba(59, 130, 246, 0.1)'} !important;
        }

        .fcw-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fcw-send-button:not(:disabled):hover {
          transform: scale(1.05);
        }

        .fcw-send-button:not(:disabled):active {
          transform: scale(0.95);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .fcw-message-input {
            border-width: 2px !important;
          }
          
          .fcw-send-button {
            border: 2px solid white !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fcw-loading-spinner {
            animation: none !important;
          }
          
          .fcw-send-button {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MessageInput;