import { WidgetConfig } from '@/types/chat';

// Input validation utilities
export class InputValidator {
  private static readonly MAX_MESSAGE_LENGTH = 1000;
  private static readonly MIN_MESSAGE_LENGTH = 1;
  private static readonly URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validate chat message input
   */
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || typeof message !== 'string') {
      return { isValid: false, error: 'Message is required' };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length < this.MIN_MESSAGE_LENGTH) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmedMessage.length > this.MAX_MESSAGE_LENGTH) {
      return { isValid: false, error: `Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters` };
    }

    // Check for potential security issues
    if (this.containsSuspiciousContent(trimmedMessage)) {
      return { isValid: false, error: 'Message contains invalid content' };
    }

    return { isValid: true };
  }

  /**
   * Validate widget configuration
   */
  static validateConfig(config: Partial<WidgetConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.apiUrl) {
      errors.push('API URL is required');
    } else if (!this.URL_REGEX.test(config.apiUrl)) {
      errors.push('Invalid API URL format');
    }

    // Optional URL fields
    if (config.websocketUrl && !this.URL_REGEX.test(config.websocketUrl)) {
      errors.push('Invalid WebSocket URL format');
    }

    if (config.logoUrl && !this.URL_REGEX.test(config.logoUrl)) {
      errors.push('Invalid logo URL format');
    }

    // Theme validation
    if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Invalid theme option');
    }

    // Position validation
    if (config.position && !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.position)) {
      errors.push('Invalid position option');
    }

    // Color validation
    if (config.primaryColor && !this.isValidColor(config.primaryColor)) {
      errors.push('Invalid primary color format');
    }

    if (config.secondaryColor && !this.isValidColor(config.secondaryColor)) {
      errors.push('Invalid secondary color format');
    }

    // Numeric validations
    if (config.width !== undefined && (config.width < 300 || config.width > 800)) {
      errors.push('Width must be between 300 and 800 pixels');
    }

    if (config.height !== undefined && (config.height < 400 || config.height > 800)) {
      errors.push('Height must be between 400 and 800 pixels');
    }

    if (config.maxMessages !== undefined && (config.maxMessages < 10 || config.maxMessages > 1000)) {
      errors.push('Max messages must be between 10 and 1000');
    }

    // Language validation
    if (config.language && !['ko', 'en'].includes(config.language)) {
      errors.push('Invalid language option');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, this.MAX_MESSAGE_LENGTH); // Limit length
  }

  /**
   * Check if message contains suspicious content
   */
  private static containsSuspiciousContent(message: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /<link[^>]*>/i,
      /<meta[^>]*>/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Validate color format (hex, rgb, rgba, hsl, hsla, named colors)
   */
  private static isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
      return false;
    }

    // Create a temporary element to test color validity
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    
    // If the browser accepts the color, it will be set
    return tempElement.style.color !== '';
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): boolean {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }

    // Check for UUID v4 format or similar
    const sessionIdRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    return sessionIdRegex.test(sessionId) || sessionId.length >= 8;
  }

  /**
   * Check if URL is from allowed domain (for security)
   */
  static isAllowedDomain(url: string, allowedDomains: string[]): boolean {
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Basic validation - should be at least 20 characters
    return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed based on rate limit
   */
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  getTimeUntilReset(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}