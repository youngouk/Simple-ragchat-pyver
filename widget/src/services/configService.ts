import { WidgetConfig, LocalizedMessages } from '@/types/chat';

/**
 * Configuration service for managing widget settings and localization
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: WidgetConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Initialize configuration
   */
  initialize(config: WidgetConfig): void {
    this.config = this.mergeWithDefaults(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): WidgetConfig | null {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<WidgetConfig>): void {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get localized messages based on current language
   */
  getLocalizedMessages(): LocalizedMessages {
    const language = this.config?.language || 'ko';
    const customMessages = this.config?.customMessages || {};

    const defaultMessages: Record<string, LocalizedMessages> = {
      ko: {
        title: '채팅 지원',
        subtitle: '온라인',
        welcomeMessage: '안녕하세요! 무엇을 도와드릴까요?',
        placeholderText: '메시지를 입력하세요...',
        sendButton: '보내기',
        minimizeButton: '최소화',
        closeButton: '닫기',
        reconnectButton: '재연결',
        clearChatButton: '대화 지우기',
        typingIndicator: 'AI가 응답 중...',
        connectionLost: '연결이 끊어졌습니다',
        reconnecting: '재연결 중...',
        errorMessage: '오류가 발생했습니다',
        retryButton: '다시 시도',
        poweredBy: 'Dual Lambda RAG 제공'
      },
      en: {
        title: 'Chat Support',
        subtitle: 'Online',
        welcomeMessage: 'Hello! How can I help you today?',
        placeholderText: 'Type your message...',
        sendButton: 'Send',
        minimizeButton: 'Minimize',
        closeButton: 'Close',
        reconnectButton: 'Reconnect',
        clearChatButton: 'Clear chat',
        typingIndicator: 'AI is typing...',
        connectionLost: 'Connection lost',
        reconnecting: 'Reconnecting...',
        errorMessage: 'An error occurred',
        retryButton: 'Retry',
        poweredBy: 'Powered by Dual Lambda RAG'
      }
    };

    return { ...defaultMessages[language], ...customMessages };
  }

  /**
   * Get API endpoints based on configuration
   */
  getAPIEndpoints() {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const baseUrl = this.config.apiUrl.replace(/\/$/, '');
    
    return {
      health: `${baseUrl}/api/health`,
      chat: `${baseUrl}/api/chat`,
      session: (id: string) => `${baseUrl}/api/session/${id}`,
      feedback: `${baseUrl}/api/feedback`,
      websocket: this.config.websocketUrl || baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    };
  }

  /**
   * Get theme configuration
   */
  getThemeConfig() {
    if (!this.config) {
      return this.getDefaultTheme();
    }

    const baseTheme = this.getDefaultTheme();
    const isDark = this.config.theme === 'dark' || 
                  (this.config.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return {
      ...baseTheme,
      isDark,
      colors: {
        ...baseTheme.colors,
        primary: this.config.primaryColor || baseTheme.colors.primary,
        secondary: this.config.secondaryColor || baseTheme.colors.secondary,
        ...(isDark ? this.getDarkThemeColors() : this.getLightThemeColors())
      }
    };
  }

  /**
   * Get widget positioning and sizing
   */
  getLayoutConfig() {
    if (!this.config) {
      return this.getDefaultLayout();
    }

    return {
      position: this.config.position || 'bottom-right',
      width: this.config.width || 360,
      height: this.config.height || 500,
      borderRadius: this.config.borderRadius || 16,
      shadows: this.config.shadows !== false,
      zIndex: 2147483647 // Maximum z-index
    };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof WidgetConfig): boolean {
    if (!this.config) {
      return false;
    }

    switch (feature) {
      case 'enableSound':
        return this.config.enableSound === true;
      case 'enableTypingIndicator':
        return this.config.enableTypingIndicator !== false;
      case 'showWelcomeMessage':
        return this.config.showWelcomeMessage !== false;
      case 'autoOpen':
        return this.config.autoOpen === true;
      case 'debug':
        return this.config.debug === true;
      default:
        return Boolean(this.config[feature]);
    }
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      maxMessages: this.config?.maxMessages || 50,
      messagesPerMinute: 10,
      burstLimit: 5
    };
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: WidgetConfig): WidgetConfig {
    const defaults: Partial<WidgetConfig> = {
      theme: 'light',
      position: 'bottom-right',
      autoOpen: false,
      showWelcomeMessage: true,
      enableSound: false,
      enableTypingIndicator: true,
      maxMessages: 50,
      width: 360,
      height: 500,
      borderRadius: 16,
      shadows: true,
      language: 'ko',
      debug: false
    };

    return { ...defaults, ...userConfig };
  }

  /**
   * Get default theme configuration
   */
  private getDefaultTheme() {
    return {
      isDark: false,
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#374151',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          md: '16px',
          lg: '18px',
          xl: '20px'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      }
    };
  }

  /**
   * Get light theme colors
   */
  private getLightThemeColors() {
    return {
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#374151',
      textSecondary: '#6b7280',
      border: '#e5e7eb'
    };
  }

  /**
   * Get dark theme colors
   */
  private getDarkThemeColors() {
    return {
      background: '#1f2937',
      surface: '#111827',
      text: '#f3f4f6',
      textSecondary: '#9ca3af',
      border: '#374151'
    };
  }

  /**
   * Get default layout configuration
   */
  private getDefaultLayout() {
    return {
      position: 'bottom-right' as const,
      width: 360,
      height: 500,
      borderRadius: 16,
      shadows: true,
      zIndex: 2147483647
    };
  }

  /**
   * Validate configuration on runtime
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    if (!this.config) {
      return { isValid: false, errors: ['Configuration not initialized'] };
    }

    const errors: string[] = [];

    // Required fields
    if (!this.config.apiUrl) {
      errors.push('API URL is required');
    }

    // URL validation
    try {
      new URL(this.config.apiUrl);
    } catch {
      errors.push('Invalid API URL format');
    }

    // Numeric ranges
    if (this.config.width && (this.config.width < 300 || this.config.width > 800)) {
      errors.push('Width must be between 300 and 800 pixels');
    }

    if (this.config.height && (this.config.height < 400 || this.config.height > 800)) {
      errors.push('Height must be between 400 and 800 pixels');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

export default configService;