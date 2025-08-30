// Chat message types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: MessageSource[];
  isStreaming?: boolean;
  isTyping?: boolean;
}

export interface MessageSource {
  id: number;
  document: string;
  page?: number;
  chunk?: number;
  relevance: number;
  content_preview: string;
}

// Chat session types
export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  lastMessageAt: Date;
}

// Widget configuration types
export interface WidgetConfig {
  // API Configuration
  apiUrl: string;
  websocketUrl?: string;
  apiKey?: string;
  
  // UI Configuration
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  secondaryColor?: string;
  
  // Behavior Configuration
  autoOpen?: boolean;
  showWelcomeMessage?: boolean;
  enableSound?: boolean;
  enableTypingIndicator?: boolean;
  maxMessages?: number;
  
  // Branding
  title?: string;
  subtitle?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  logoUrl?: string;
  
  // Customization
  width?: number;
  height?: number;
  borderRadius?: number;
  shadows?: boolean;
  
  // Localization
  language?: 'ko' | 'en';
  customMessages?: Partial<LocalizedMessages>;
  
  // Debug
  debug?: boolean;
}

export interface LocalizedMessages {
  title: string;
  subtitle: string;
  welcomeMessage: string;
  placeholderText: string;
  sendButton: string;
  minimizeButton: string;
  closeButton: string;
  reconnectButton: string;
  clearChatButton: string;
  typingIndicator: string;
  connectionLost: string;
  reconnecting: string;
  errorMessage: string;
  retryButton: string;
  poweredBy: string;
}

// API types
export interface ChatAPIRequest {
  message: string;
  sessionId?: string;
  options?: {
    maxSources?: number;
    responseStyle?: 'standard' | 'detailed' | 'concise';
    stream?: boolean;
  };
}

export interface ChatAPIResponse {
  answer: string;
  sources: MessageSource[];
  session_id: string;
  processing_time: number;
  tokens_used: number;
  timestamp: string;
}

// WebSocket types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'connect' | 'disconnect' | 'stream_start' | 'stream_chunk' | 'stream_end' | 'stream_error';
  sessionId?: string;
  content?: string;
  messageId?: string;
  timestamp?: string;
  sources?: MessageSource[];
}

// Widget state types
export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  isTyping: boolean;
  hasUnreadMessages: boolean;
  unreadCount: number;
  lastError?: string;
}

// Event types
export interface WidgetEvents {
  onOpen?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Storage types
export interface WidgetStorage {
  session?: ChatSession;
  settings?: Partial<WidgetConfig>;
  state?: Partial<WidgetState>;
}

// Animation types
export type AnimationType = 'slide' | 'fade' | 'scale' | 'bounce';

// Theme types
export interface WidgetTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}