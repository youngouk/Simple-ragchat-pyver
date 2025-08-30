import { WidgetConfig, ChatAPIRequest, ChatAPIResponse } from '@/types/chat';
import { InputValidator } from '@/utils/validator';
import { SecuritySanitizer } from '@/utils/sanitizer';

/**
 * Chat API service for communicating with the Dual Lambda RAG backend
 */
export class ChatAPIService {
  private baseURL: string = '';
  private timeout: number = 30000; // 30 seconds
  private maxRetries: number = 3;

  /**
   * Initialize the API service with configuration
   */
  initialize(config: WidgetConfig): void {
    this.baseURL = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.debug ? 60000 : 30000; // Longer timeout in debug mode
  }

  /**
   * Test connection to the API
   */
  async testConnection(config: WidgetConfig): Promise<void> {
    this.initialize(config);
    
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/health`,
        {
          method: 'GET',
          headers: this.getHeaders(config),
        },
        5000 // Short timeout for health check
      );

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.status !== 'healthy') {
        throw new Error('API is not healthy');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      throw this.createAPIError(error, 'CONNECTION_TEST_FAILED');
    }
  }

  /**
   * Send a chat message to the API
   */
  async sendMessage(
    request: ChatAPIRequest,
    config: WidgetConfig,
    signal?: AbortSignal
  ): Promise<ChatAPIResponse> {
    this.initialize(config);

    // Validate request
    const validation = InputValidator.validateMessage(request.message);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid message');
    }

    // Sanitize request
    const sanitizedRequest: ChatAPIRequest = {
      message: SecuritySanitizer.sanitizeUserInput(request.message),
      sessionId: request.sessionId,
      options: request.options || {}
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.baseURL}/api/chat`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(config),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sanitizedRequest),
          signal,
        },
        this.maxRetries
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data: ChatAPIResponse = await response.json();
      
      // Validate response
      this.validateResponse(data);
      
      // Sanitize response
      return this.sanitizeResponse(data);

    } catch (error) {
      console.error('Send message failed:', error);
      throw this.createAPIError(error, 'SEND_MESSAGE_FAILED');
    }
  }

  /**
   * Get session information
   */
  async getSession(
    sessionId: string,
    config: WidgetConfig,
    signal?: AbortSignal
  ): Promise<any> {
    this.initialize(config);

    if (!InputValidator.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID');
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/session/${encodeURIComponent(sessionId)}`,
        {
          method: 'GET',
          headers: this.getHeaders(config),
          signal,
        },
        this.timeout
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Session not found
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Get session failed:', error);
      throw this.createAPIError(error, 'GET_SESSION_FAILED');
    }
  }

  /**
   * Submit feedback for a message
   */
  async submitFeedback(
    sessionId: string,
    messageId: string,
    feedback: 'positive' | 'negative',
    comment: string,
    config: WidgetConfig,
    signal?: AbortSignal
  ): Promise<void> {
    this.initialize(config);

    const feedbackData = {
      sessionId: SecuritySanitizer.sanitizeUserInput(sessionId),
      messageId: SecuritySanitizer.sanitizeUserInput(messageId),
      feedback,
      comment: SecuritySanitizer.sanitizeUserInput(comment)
    };

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/feedback`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(config),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
          signal,
        },
        this.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Submit feedback failed:', error);
      throw this.createAPIError(error, 'SUBMIT_FEEDBACK_FAILED');
    }
  }

  /**
   * Get request headers
   */
  private getHeaders(config: WidgetConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'DualLambdaRAG-Widget/1.0',
      'Accept': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    return headers;
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, this.timeout);
        
        // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Validate API response structure
   */
  private validateResponse(response: ChatAPIResponse): void {
    if (!response) {
      throw new Error('Empty response');
    }

    if (typeof response.answer !== 'string') {
      throw new Error('Invalid response: missing answer');
    }

    if (!response.session_id) {
      throw new Error('Invalid response: missing session_id');
    }

    if (!Array.isArray(response.sources)) {
      throw new Error('Invalid response: invalid sources');
    }

    if (typeof response.processing_time !== 'number') {
      throw new Error('Invalid response: invalid processing_time');
    }
  }

  /**
   * Sanitize API response
   */
  private sanitizeResponse(response: ChatAPIResponse): ChatAPIResponse {
    return {
      answer: SecuritySanitizer.sanitizeBotResponse(response.answer),
      sources: SecuritySanitizer.sanitizeMessageSources(response.sources),
      session_id: response.session_id,
      processing_time: Math.max(0, response.processing_time),
      tokens_used: Math.max(0, response.tokens_used || 0),
      timestamp: response.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Create standardized API error
   */
  private createAPIError(error: any, code: string): Error {
    const apiError = new Error(
      error?.message || 'An unexpected error occurred'
    ) as Error & { code: string; originalError: any };
    
    apiError.code = code;
    apiError.originalError = error;
    
    return apiError;
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    return error?.code === 'CONNECTION_TEST_FAILED' ||
           error?.name === 'TypeError' ||
           error?.message?.includes('fetch') ||
           error?.message?.includes('network');
  }

  /**
   * Check if error is a timeout error
   */
  isTimeoutError(error: any): boolean {
    return error?.name === 'AbortError' ||
           error?.message?.includes('timeout');
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(error: any, language: 'en' | 'ko' = 'en'): string {
    if (this.isNetworkError(error)) {
      return language === 'en' 
        ? 'Unable to connect. Please check your internet connection.'
        : '연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
    }

    if (this.isTimeoutError(error)) {
      return language === 'en'
        ? 'Request timed out. Please try again.'
        : '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }

    if (error?.message?.includes('rate limit')) {
      return language === 'en'
        ? 'Too many requests. Please wait a moment.'
        : '너무 많은 요청입니다. 잠시 후 시도해주세요.';
    }

    return language === 'en'
      ? 'Something went wrong. Please try again.'
      : '문제가 발생했습니다. 다시 시도해주세요.';
  }
}

// Export singleton instance
export const chatAPI = new ChatAPIService();

export default chatAPI;