import React, { Component, ReactNode } from 'react';
import { WidgetConfig } from '@/types/chat';

interface ErrorBoundaryProps {
  children: ReactNode;
  config: WidgetConfig;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Chat widget error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
    
    // Clear any stored state that might be causing issues
    try {
      localStorage.removeItem('fcw-widget-state');
      localStorage.removeItem('fcw-chat-session');
      localStorage.removeItem('fcw-chat-messages');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      const { config } = this.props;
      const { error, retryCount } = this.state;
      
      const errorMessage = config.language === 'en' 
        ? 'Something went wrong with the chat widget'
        : '채팅 위젯에 문제가 발생했습니다';
        
      const retryText = config.language === 'en' ? 'Try Again' : '다시 시도';
      const resetText = config.language === 'en' ? 'Reset Chat' : '채팅 초기화';

      return (
        <div className="fcw-error-boundary" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
          maxWidth: '300px'
        }}>
          {/* Error Icon */}
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginBottom: '12px', opacity: 0.7 }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>

          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {errorMessage}
          </h3>

          {config.debug && error && (
            <details style={{ 
              marginBottom: '16px',
              fontSize: '12px',
              textAlign: 'left',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '4px' }}>
                Error Details
              </summary>
              <pre style={{
                background: 'rgba(0,0,0,0.1)',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '100px'
              }}>
                {error.stack || error.message}
              </pre>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {retryCount < this.maxRetries && (
              <button
                onClick={this.handleRetry}
                style={{
                  background: config.primaryColor || '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {retryText} ({this.maxRetries - retryCount})
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              style={{
                background: 'transparent',
                color: '#991b1b',
                border: '1px solid currentColor',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {resetText}
            </button>
          </div>

          {retryCount >= this.maxRetries && (
            <p style={{
              marginTop: '12px',
              fontSize: '12px',
              opacity: 0.8
            }}>
              {config.language === 'en' 
                ? 'If the problem persists, please refresh the page.'
                : '문제가 계속되면 페이지를 새로고침해주세요.'}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;