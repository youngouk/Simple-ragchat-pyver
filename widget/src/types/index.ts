// Re-export all types for convenient importing
export * from './chat';

// Global types for the widget
export interface GlobalWidgetInstance {
  init: (config: import('./chat').WidgetConfig) => void;
  destroy: () => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  sendMessage: (message: string) => void;
  clearChat: () => void;
  getSession: () => import('./chat').ChatSession | null;
  getConfig: () => import('./chat').WidgetConfig | null;
  updateConfig: (config: Partial<import('./chat').WidgetConfig>) => void;
  isOpen: () => boolean;
  isConnected: () => boolean;
}

// Window interface extension for TypeScript
declare global {
  interface Window {
    DualLambdaRAGChatWidget: GlobalWidgetInstance;
  }
}