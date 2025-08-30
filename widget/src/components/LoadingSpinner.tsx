import React from 'react';
import { WidgetConfig } from '@/types/chat';

interface LoadingSpinnerProps {
  config: WidgetConfig;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  config, 
  size = 'medium',
  text 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '16px', height: '16px' };
      case 'large':
        return { width: '32px', height: '32px' };
      default:
        return { width: '24px', height: '24px' };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return '12px';
      case 'large':
        return '16px';
      default:
        return '14px';
    }
  };

  return (
    <div 
      className="fcw-loading-spinner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: size === 'small' ? '8px' : '16px'
      }}
    >
      <div
        className="fcw-spinner"
        style={{
          ...getSizeStyles(),
          border: '2px solid #f3f4f6',
          borderTop: `2px solid ${config.primaryColor || '#3b82f6'}`,
          borderRadius: '50%',
          animation: 'fcw-spin 1s linear infinite'
        }}
      />
      
      {text && (
        <span 
          style={{
            fontSize: getTextSize(),
            color: '#6b7280',
            textAlign: 'center'
          }}
        >
          {text}
        </span>
      )}

      <style jsx>{`
        @keyframes fcw-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fcw-spinner {
            animation: none !important;
            border-top-color: ${config.primaryColor || '#3b82f6'} !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;