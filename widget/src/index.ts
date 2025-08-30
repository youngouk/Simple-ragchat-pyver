import React from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetConfig, GlobalWidgetInstance } from '@/types';
import { FloatingChatWidget } from '@/components/FloatingChatWidget';
import { InputValidator } from '@/utils/validator';
import { SecuritySanitizer } from '@/utils/sanitizer';
import '@/styles/widget.css';

/**
 * Dual Lambda RAG Floating Chat Widget
 * 
 * A secure, embeddable chat widget that integrates with the Dual Lambda RAG system.
 * Can be embedded in any website with a single script tag.
 */
class DualLambdaRAGChatWidget {
  private container: HTMLElement | null = null;
  private root: ReactDOM.Root | null = null;
  private config: WidgetConfig | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the widget with configuration
   */
  init(config: WidgetConfig): void {
    try {
      // Validate configuration
      const validation = InputValidator.validateConfig(config);
      if (!validation.isValid) {
        console.error('Widget configuration validation failed:', validation.errors);
        throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
      }

      // Security check
      const securityCheck = SecuritySanitizer.validateConfigSecurity(config);
      if (!securityCheck.isSecure) {
        console.error('Widget configuration security check failed:', securityCheck.issues);
        throw new Error(`Security error: ${securityCheck.issues.join(', ')}`);
      }

      // Sanitize configuration
      const sanitizedConfig = SecuritySanitizer.sanitizeConfig(config) as WidgetConfig;
      this.config = { ...this.getDefaultConfig(), ...sanitizedConfig };

      // Create container
      this.createContainer();

      // Render widget
      this.render();

      this.isInitialized = true;

      if (this.config.debug) {
        console.log('Dual Lambda RAG Chat Widget initialized', this.config);
      }

    } catch (error) {
      console.error('Failed to initialize chat widget:', error);
      throw error;
    }
  }

  /**
   * Destroy the widget and clean up resources
   */
  destroy(): void {
    try {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }

      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }

      this.config = null;
      this.isInitialized = false;

      if (this.config?.debug) {
        console.log('Chat widget destroyed');
      }
    } catch (error) {
      console.error('Error destroying chat widget:', error);
    }
  }

  /**
   * Open the chat window
   */
  open(): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    // Trigger open event (handled by the React component)
    this.triggerWidgetEvent('open');
  }

  /**
   * Close the chat window
   */
  close(): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    this.triggerWidgetEvent('close');
  }

  /**
   * Minimize the chat window
   */
  minimize(): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    this.triggerWidgetEvent('minimize');
  }

  /**
   * Maximize/restore the chat window
   */
  maximize(): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    this.triggerWidgetEvent('maximize');
  }

  /**
   * Send a message programmatically
   */
  sendMessage(message: string): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    const validation = InputValidator.validateMessage(message);
    if (!validation.isValid) {
      console.error('Invalid message:', validation.error);
      return;
    }

    this.triggerWidgetEvent('sendMessage', { message });
  }

  /**
   * Clear the chat history
   */
  clearChat(): void {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return;
    }

    this.triggerWidgetEvent('clearChat');
  }

  /**
   * Get current session information
   */
  getSession(): any {
    if (!this.isInitialized) {
      console.warn('Widget not initialized');
      return null;
    }

    // This would need to be implemented with state management
    // For now, return null as session is managed in React component
    return null;
  }

  /**
   * Get current configuration
   */
  getConfig(): WidgetConfig | null {
    return this.config;
  }

  /**
   * Update widget configuration
   */
  updateConfig(newConfig: Partial<WidgetConfig>): void {
    if (!this.isInitialized || !this.config) {
      console.warn('Widget not initialized');
      return;
    }

    // Validate partial config
    const mergedConfig = { ...this.config, ...newConfig };
    const validation = InputValidator.validateConfig(mergedConfig);
    if (!validation.isValid) {
      console.error('Config update validation failed:', validation.errors);
      return;
    }

    // Update config
    this.config = mergedConfig;

    // Re-render with new config
    this.render();

    if (this.config.debug) {
      console.log('Widget config updated', this.config);
    }
  }

  /**
   * Check if widget is open
   */
  isOpen(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    // This would need to be implemented with state management
    // For now, assume it's closed
    return false;
  }

  /**
   * Check if widget is connected
   */
  isConnected(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    // This would need to be implemented with connection status
    // For now, assume it's connected if initialized
    return true;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Partial<WidgetConfig> {
    return {
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
      debug: false,
    };
  }

  /**
   * Create the widget container element
   */
  private createContainer(): void {
    // Remove existing container if any
    if (this.container) {
      this.destroy();
    }

    // Create new container
    this.container = document.createElement('div');
    this.container.id = 'dual-lambda-rag-chat-widget';
    this.container.setAttribute('data-widget', 'dual-lambda-rag');
    
    // Add container to body
    document.body.appendChild(this.container);
  }

  /**
   * Render the React component
   */
  private render(): void {
    if (!this.container || !this.config) {
      return;
    }

    // Create React root if not exists
    if (!this.root) {
      this.root = ReactDOM.createRoot(this.container);
    }

    // Render the widget
    this.root.render(
      React.createElement(FloatingChatWidget, {
        config: this.config,
        events: {
          onOpen: () => this.config?.debug && console.log('Widget opened'),
          onClose: () => this.config?.debug && console.log('Widget closed'),
          onMinimize: () => this.config?.debug && console.log('Widget minimized'),
          onMaximize: () => this.config?.debug && console.log('Widget maximized'),
          onMessageSent: (message) => this.config?.debug && console.log('Message sent:', message),
          onMessageReceived: (message) => this.config?.debug && console.log('Message received:', message),
          onError: (error) => console.error('Widget error:', error),
          onConnect: () => this.config?.debug && console.log('Widget connected'),
          onDisconnect: () => this.config?.debug && console.log('Widget disconnected'),
        }
      })
    );
  }

  /**
   * Trigger widget events (for programmatic control)
   */
  private triggerWidgetEvent(eventType: string, data?: any): void {
    const event = new CustomEvent(`widget-${eventType}`, { detail: data });
    document.dispatchEvent(event);
  }
}

// Create global instance
const widgetInstance = new DualLambdaRAGChatWidget();

// Make it available globally
const globalWidget: GlobalWidgetInstance = {
  init: (config: WidgetConfig) => widgetInstance.init(config),
  destroy: () => widgetInstance.destroy(),
  open: () => widgetInstance.open(),
  close: () => widgetInstance.close(),
  minimize: () => widgetInstance.minimize(),
  maximize: () => widgetInstance.maximize(),
  sendMessage: (message: string) => widgetInstance.sendMessage(message),
  clearChat: () => widgetInstance.clearChat(),
  getSession: () => widgetInstance.getSession(),
  getConfig: () => widgetInstance.getConfig(),
  updateConfig: (config: Partial<WidgetConfig>) => widgetInstance.updateConfig(config),
  isOpen: () => widgetInstance.isOpen(),
  isConnected: () => widgetInstance.isConnected(),
};

// Auto-initialize from script tag data attributes
function autoInitialize(): void {
  const script = document.querySelector('script[src*="widget.js"]') as HTMLScriptElement;
  if (!script) return;

  const dataset = script.dataset;
  
  if (dataset.apiUrl) {
    const config: WidgetConfig = {
      apiUrl: dataset.apiUrl,
      theme: (dataset.theme as 'light' | 'dark') || 'light',
      position: (dataset.position as any) || 'bottom-right',
      primaryColor: dataset.primaryColor,
      secondaryColor: dataset.secondaryColor,
      title: dataset.title,
      subtitle: dataset.subtitle,
      welcomeMessage: dataset.welcomeMessage,
      placeholderText: dataset.placeholderText,
      logoUrl: dataset.logoUrl,
      autoOpen: dataset.autoOpen === 'true',
      enableSound: dataset.enableSound === 'true',
      language: (dataset.language as 'ko' | 'en') || 'ko',
      debug: dataset.debug === 'true',
    };

    try {
      globalWidget.init(config);
    } catch (error) {
      console.error('Auto-initialization failed:', error);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitialize);
} else {
  autoInitialize();
}

// Export for module environments
declare global {
  interface Window {
    DualLambdaRAGChatWidget: GlobalWidgetInstance;
  }
}

// Make available globally
window.DualLambdaRAGChatWidget = globalWidget;

// Export for module bundlers
export default globalWidget;
export { DualLambdaRAGChatWidget, FloatingChatWidget };
export * from '@/types';