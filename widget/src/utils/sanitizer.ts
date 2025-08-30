import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Security utilities for sanitizing user input and bot responses
 */
export class SecuritySanitizer {
  private static purifyInstance: typeof DOMPurify;

  /**
   * Initialize DOMPurify with custom configuration
   */
  static initialize(): void {
    this.purifyInstance = DOMPurify;
    
    // Configure DOMPurify for our specific use case
    this.purifyInstance.setConfig({
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 
        'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 
        'h4', 'h5', 'h6', 'a', 'span'
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    });

    // Add hook to modify links
    this.purifyInstance.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /**
   * Sanitize user input message
   */
  static sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove HTML tags and dangerous content
    return this.purifyInstance?.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    }) || input.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Sanitize and format bot response (supports markdown)
   */
  static sanitizeBotResponse(response: string): string {
    if (!response || typeof response !== 'string') {
      return '';
    }

    try {
      // Configure marked for security
      marked.setOptions({
        headerIds: false,
        mangle: false,
        breaks: true,
        gfm: true,
        sanitize: false, // We'll handle sanitization with DOMPurify
        smartLists: true,
        smartypants: false,
      });

      // Convert markdown to HTML
      const htmlContent = marked(response);
      
      // Sanitize the HTML
      return this.purifyInstance?.sanitize(htmlContent) || response;
    } catch (error) {
      console.error('Error processing bot response:', error);
      // Fallback to plain text sanitization
      return this.sanitizeUserInput(response);
    }
  }

  /**
   * Sanitize configuration values
   */
  static sanitizeConfig(config: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeUserInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeConfig(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }

      return urlObj.toString();
    } catch {
      return null;
    }
  }

  /**
   * Remove potentially dangerous CSS values
   */
  static sanitizeCssValue(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // Remove dangerous CSS constructs
    return value
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/url\s*\(\s*['"]?javascript:/gi, '')
      .replace(/@import/gi, '')
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
      .trim();
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validate message sources for safety
   */
  static sanitizeMessageSources(sources: any[]): any[] {
    if (!Array.isArray(sources)) {
      return [];
    }

    return sources.map(source => ({
      id: typeof source.id === 'number' ? source.id : 0,
      document: this.sanitizeUserInput(source.document || ''),
      page: typeof source.page === 'number' ? source.page : null,
      chunk: typeof source.chunk === 'number' ? source.chunk : null,
      relevance: typeof source.relevance === 'number' ? Math.max(0, Math.min(1, source.relevance)) : 0,
      content_preview: this.sanitizeUserInput(source.content_preview || '').substring(0, 200),
    }));
  }

  /**
   * Check for potential XSS attacks in configuration
   */
  static validateConfigSecurity(config: Record<string, any>): { isSecure: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const checkValue = (value: any, path: string): void => {
      if (typeof value === 'string') {
        // Check for script tags
        if (/<script[^>]*>/i.test(value)) {
          issues.push(`Script tag detected in ${path}`);
        }
        
        // Check for javascript: URLs
        if (/javascript:/i.test(value)) {
          issues.push(`JavaScript URL detected in ${path}`);
        }
        
        // Check for event handlers
        if (/on\w+\s*=/i.test(value)) {
          issues.push(`Event handler detected in ${path}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          checkValue(val, `${path}.${key}`);
        });
      }
    };

    Object.entries(config).forEach(([key, value]) => {
      checkValue(value, key);
    });

    return { isSecure: issues.length === 0, issues };
  }

  /**
   * Create a CSP-safe inline style
   */
  static createSafeInlineStyle(styles: Record<string, string>): string {
    const safeStyles: string[] = [];
    
    for (const [property, value] of Object.entries(styles)) {
      const sanitizedProperty = property.replace(/[^a-zA-Z-]/g, '');
      const sanitizedValue = this.sanitizeCssValue(value);
      
      if (sanitizedProperty && sanitizedValue) {
        safeStyles.push(`${sanitizedProperty}: ${sanitizedValue}`);
      }
    }
    
    return safeStyles.join('; ');
  }
}

// Initialize DOMPurify when the module loads
if (typeof window !== 'undefined') {
  SecuritySanitizer.initialize();
}

/**
 * Content Security Policy utilities
 */
export class CSPHelper {
  /**
   * Generate a nonce for inline scripts/styles
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a CSP-compliant meta tag
   */
  static createCSPMetaTag(nonce: string): string {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'unsafe-inline'`, // Needed for dynamic theming
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; ');

    return `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
  }
}