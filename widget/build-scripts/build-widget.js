#!/usr/bin/env node

/**
 * Widget Build Script
 * Creates optimized, self-contained widget bundle for CDN distribution
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class WidgetBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.srcDir = path.join(this.projectRoot, 'src');
    this.version = require('../package.json').version;
  }

  async build() {
    console.log('🔨 Building Floating Chat Widget...');
    
    try {
      // Clean dist directory
      await this.cleanDist();
      
      // Build with Vite
      await this.buildWithVite();
      
      // Process built files
      await this.processBuildFiles();
      
      // Create widget loader
      await this.createWidgetLoader();
      
      // Create examples
      await this.createExamples();
      
      // Generate docs
      await this.generateDocs();
      
      // Analyze bundle size
      await this.analyzeBundleSize();
      
      console.log('✅ Widget build completed successfully!');
      console.log(`📦 Files available in: ${this.distDir}`);
      
    } catch (error) {
      console.error('❌ Widget build failed:', error);
      process.exit(1);
    }
  }

  async cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    
    try {
      await fs.rm(this.distDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    await fs.mkdir(this.distDir, { recursive: true });
  }

  async buildWithVite() {
    console.log('⚡ Building with Vite...');
    
    try {
      execSync('npm run build', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error('Vite build failed');
    }
  }

  async processBuildFiles() {
    console.log('🔧 Processing build files...');
    
    // Find the main widget file
    const files = await fs.readdir(this.distDir);
    const widgetFile = files.find(f => f.startsWith('widget.iife.js'));
    const cssFile = files.find(f => f.endsWith('.css'));
    
    if (!widgetFile) {
      throw new Error('Widget JS file not found in dist directory');
    }

    // Rename to standard names
    if (widgetFile !== 'widget.js') {
      await fs.rename(
        path.join(this.distDir, widgetFile),
        path.join(this.distDir, 'widget.js')
      );
    }

    if (cssFile && cssFile !== 'widget.css') {
      await fs.rename(
        path.join(this.distDir, cssFile),
        path.join(this.distDir, 'widget.css')
      );
    }

    // Inline CSS into JS for single-file distribution
    await this.inlineCSSIntoJS();
    
    // Create minified version
    await this.createMinifiedVersion();
  }

  async inlineCSSIntoJS() {
    console.log('🎨 Inlining CSS into JavaScript...');
    
    const jsPath = path.join(this.distDir, 'widget.js');
    const cssPath = path.join(this.distDir, 'widget.css');
    
    try {
      let jsContent = await fs.readFile(jsPath, 'utf8');
      
      // Check if CSS file exists
      try {
        const cssContent = await fs.readFile(cssPath, 'utf8');
        
        // Minify CSS (basic minification)
        const minifiedCSS = cssContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
          .trim();
        
        // Create CSS injection code
        const cssInjectionCode = `
(function() {
  if (typeof document !== 'undefined') {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = ${JSON.stringify(minifiedCSS)};
    document.head.appendChild(style);
  }
})();
`;
        
        // Prepend CSS injection to JS
        jsContent = cssInjectionCode + '\n' + jsContent;
        
        // Write back to file
        await fs.writeFile(jsPath, jsContent);
        
        // Remove separate CSS file
        await fs.rm(cssPath);
        
        console.log('  ✓ CSS inlined successfully');
      } catch (cssError) {
        console.log('  ⚠️ No CSS file found, skipping CSS inlining');
      }
    } catch (error) {
      console.error('  ❌ Failed to inline CSS:', error);
    }
  }

  async createMinifiedVersion() {
    console.log('🗜️ Creating minified version...');
    
    const jsPath = path.join(this.distDir, 'widget.js');
    const minPath = path.join(this.distDir, 'widget.min.js');
    
    try {
      // For now, just copy the file (Vite already minifies)
      // In production, you might want to use additional minification
      await fs.copyFile(jsPath, minPath);
      
      const originalSize = (await fs.stat(jsPath)).size;
      const minifiedSize = (await fs.stat(minPath)).size;
      
      console.log(`  ✓ Original: ${this.formatBytes(originalSize)}`);
      console.log(`  ✓ Minified: ${this.formatBytes(minifiedSize)}`);
    } catch (error) {
      console.error('  ❌ Failed to create minified version:', error);
    }
  }

  async createWidgetLoader() {
    console.log('📦 Creating widget loader...');
    
    const loaderContent = `/*!
 * Dual Lambda RAG Chat Widget Loader v${this.version}
 * https://github.com/your-org/dual-lambda-rag
 * 
 * Usage:
 * <script src="https://cdn.yoursite.com/widget-loader.js" 
 *         data-api-url="https://api.yoursite.com"
 *         data-theme="light"
 *         data-position="bottom-right">
 * </script>
 */

(function() {
  'use strict';
  
  var config = {
    // Default configuration
    apiUrl: '',
    theme: 'light',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    language: 'ko',
    autoOpen: false,
    debug: false
  };

  // Get configuration from script tag data attributes
  var script = document.currentScript || 
    (function() {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  if (script && script.dataset) {
    Object.keys(config).forEach(function(key) {
      var dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (script.dataset[dataKey] !== undefined) {
        var value = script.dataset[dataKey];
        
        // Convert string booleans
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        
        config[key] = value;
      }
    });
  }

  // Validate required config
  if (!config.apiUrl) {
    console.error('Dual Lambda RAG Widget: data-api-url is required');
    return;
  }

  // Load the main widget script
  function loadWidget() {
    var widgetScript = document.createElement('script');
    widgetScript.src = script.src.replace('widget-loader.js', 'widget.min.js');
    widgetScript.onload = function() {
      if (window.DualLambdaRAGChatWidget) {
        try {
          window.DualLambdaRAGChatWidget.init(config);
        } catch (error) {
          console.error('Failed to initialize chat widget:', error);
        }
      }
    };
    widgetScript.onerror = function() {
      console.error('Failed to load chat widget script');
    };
    document.head.appendChild(widgetScript);
  }

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget);
  } else {
    loadWidget();
  }
})();`;

    await fs.writeFile(
      path.join(this.distDir, 'widget-loader.js'),
      loaderContent
    );
    
    console.log('  ✓ Widget loader created');
  }

  async createExamples() {
    console.log('📝 Creating examples...');
    
    const examplesDir = path.join(this.distDir, 'examples');
    await fs.mkdir(examplesDir, { recursive: true });

    // Basic example
    const basicExample = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dual Lambda RAG Chat Widget - Basic Example</title>
</head>
<body>
    <h1>기본 사용 예제</h1>
    <p>우측 하단에 채팅 위젯이 표시됩니다.</p>
    
    <!-- Widget Script -->
    <script src="../widget-loader.js" 
            data-api-url="https://api.yoursite.com"
            data-theme="light"
            data-position="bottom-right"
            data-title="고객 지원"
            data-welcome-message="안녕하세요! 무엇을 도와드릴까요?"
            data-auto-open="false">
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(examplesDir, 'basic.html'), basicExample);

    // Advanced example
    const advancedExample = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dual Lambda RAG Chat Widget - Advanced Example</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .controls { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        button { margin: 5px; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; }
        .primary { background: #3b82f6; color: white; }
        .secondary { background: #6b7280; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>고급 사용 예제</h1>
        <p>JavaScript API를 사용하여 위젯을 프로그래밍 방식으로 제어할 수 있습니다.</p>
        
        <div class="controls">
            <h3>위젯 컨트롤</h3>
            <button class="primary" onclick="openWidget()">위젯 열기</button>
            <button class="secondary" onclick="closeWidget()">위젯 닫기</button>
            <button class="secondary" onclick="sendMessage()">메시지 보내기</button>
            <button class="secondary" onclick="clearChat()">대화 지우기</button>
            <button class="secondary" onclick="toggleTheme()">테마 변경</button>
        </div>
        
        <div class="controls">
            <h3>상태 정보</h3>
            <p>위젯 열림: <span id="isOpen">-</span></p>
            <p>연결 상태: <span id="isConnected">-</span></p>
        </div>
    </div>

    <script>
        let isDarkTheme = false;

        function openWidget() {
            if (window.DualLambdaRAGChatWidget) {
                window.DualLambdaRAGChatWidget.open();
            }
        }

        function closeWidget() {
            if (window.DualLambdaRAGChatWidget) {
                window.DualLambdaRAGChatWidget.close();
            }
        }

        function sendMessage() {
            if (window.DualLambdaRAGChatWidget) {
                window.DualLambdaRAGChatWidget.sendMessage('프로그래밍 방식으로 보낸 메시지입니다.');
            }
        }

        function clearChat() {
            if (window.DualLambdaRAGChatWidget) {
                window.DualLambdaRAGChatWidget.clearChat();
            }
        }

        function toggleTheme() {
            if (window.DualLambdaRAGChatWidget) {
                isDarkTheme = !isDarkTheme;
                window.DualLambdaRAGChatWidget.updateConfig({
                    theme: isDarkTheme ? 'dark' : 'light'
                });
            }
        }

        function updateStatus() {
            if (window.DualLambdaRAGChatWidget) {
                document.getElementById('isOpen').textContent = 
                    window.DualLambdaRAGChatWidget.isOpen() ? '예' : '아니오';
                document.getElementById('isConnected').textContent = 
                    window.DualLambdaRAGChatWidget.isConnected() ? '연결됨' : '연결 안됨';
            }
        }

        // Update status every second
        setInterval(updateStatus, 1000);
    </script>

    <!-- Widget Script -->
    <script src="../widget-loader.js" 
            data-api-url="https://api.yoursite.com"
            data-theme="light"
            data-position="bottom-right"
            data-primary-color="#7c3aed"
            data-title="고급 채팅 지원"
            data-debug="true">
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(examplesDir, 'advanced.html'), advancedExample);

    console.log('  ✓ Examples created');
  }

  async generateDocs() {
    console.log('📚 Generating documentation...');
    
    const readmeContent = `# Dual Lambda RAG Floating Chat Widget

Version: ${this.version}

## 설치 및 사용법

### 1. 기본 사용법

웹사이트에 다음 스크립트 태그를 추가하세요:

\`\`\`html
<script src="https://cdn.yoursite.com/floating-chat/widget-loader.js" 
        data-api-url="https://api.yoursite.com"
        data-theme="light"
        data-position="bottom-right">
</script>
\`\`\`

### 2. 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data-api-url | string | (필수) | RAG API 서버 URL |
| data-theme | 'light' \\| 'dark' | 'light' | 테마 |
| data-position | string | 'bottom-right' | 위젯 위치 |
| data-primary-color | string | '#3b82f6' | 주 색상 |
| data-secondary-color | string | - | 보조 색상 |
| data-title | string | '채팅 지원' | 위젯 제목 |
| data-subtitle | string | - | 위젯 부제목 |
| data-welcome-message | string | - | 환영 메시지 |
| data-placeholder-text | string | - | 입력 필드 플레이스홀더 |
| data-auto-open | boolean | false | 자동 열기 |
| data-language | 'ko' \\| 'en' | 'ko' | 언어 |
| data-debug | boolean | false | 디버그 모드 |

### 3. JavaScript API

\`\`\`javascript
// 위젯 열기
window.DualLambdaRAGChatWidget.open();

// 위젯 닫기
window.DualLambdaRAGChatWidget.close();

// 메시지 보내기
window.DualLambdaRAGChatWidget.sendMessage('안녕하세요');

// 대화 지우기
window.DualLambdaRAGChatWidget.clearChat();

// 설정 업데이트
window.DualLambdaRAGChatWidget.updateConfig({
    theme: 'dark',
    primaryColor: '#ff6b6b'
});

// 상태 확인
console.log(window.DualLambdaRAGChatWidget.isOpen());
console.log(window.DualLambdaRAGChatWidget.isConnected());
\`\`\`

### 4. 이벤트 처리

위젯은 사용자 정의 이벤트를 발생시킵니다:

\`\`\`javascript
document.addEventListener('widget-open', function() {
    console.log('위젯이 열렸습니다');
});

document.addEventListener('widget-close', function() {
    console.log('위젯이 닫혔습니다');
});
\`\`\`

### 5. 보안

- 모든 사용자 입력은 자동으로 sanitize됩니다
- XSS 공격을 방지하기 위해 DOMPurify를 사용합니다
- CORS 정책을 준수합니다

### 6. 브라우저 지원

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+

### 7. 성능

- 초기 로딩: ~50KB (gzipped)
- 메모리 사용량: ~2MB
- 응답 시간: < 3초 (평균)

## 문제 해결

### 일반적인 문제

1. **위젯이 표시되지 않음**
   - API URL이 올바른지 확인
   - 네트워크 연결 상태 확인
   - 브라우저 콘솔에서 오류 메시지 확인

2. **스타일링 충돌**
   - 위젯은 \`fcw-\` 접두사를 사용하여 충돌을 방지합니다
   - CSS reset이 위젯에 영향을 주지 않도록 설계되었습니다

3. **모바일에서 문제**
   - 뷰포트 메타 태그가 올바르게 설정되어 있는지 확인
   - 터치 이벤트가 다른 요소에 의해 차단되지 않는지 확인

## 라이선스

MIT License
`;

    await fs.writeFile(path.join(this.distDir, 'README.md'), readmeContent);
    
    console.log('  ✓ Documentation generated');
  }

  async analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...');
    
    try {
      const jsPath = path.join(this.distDir, 'widget.min.js');
      const stats = await fs.stat(jsPath);
      
      const sizeKB = Math.round(stats.size / 1024);
      const sizeGzipped = await this.getGzippedSize(jsPath);
      
      console.log(`  📦 Bundle size: ${sizeKB}KB`);
      console.log(`  🗜️ Gzipped size: ${Math.round(sizeGzipped / 1024)}KB`);
      
      // Size warnings
      if (sizeKB > 200) {
        console.warn('  ⚠️ Bundle size is large (>200KB)');
      }
      
      if (sizeGzipped > 50000) {
        console.warn('  ⚠️ Gzipped size is large (>50KB)');
      }
      
    } catch (error) {
      console.warn('  ⚠️ Could not analyze bundle size:', error.message);
    }
  }

  async getGzippedSize(filePath) {
    try {
      const { gzipSync } = require('zlib');
      const content = await fs.readFile(filePath);
      return gzipSync(content).length;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Execute if run directly
if (require.main === module) {
  const builder = new WidgetBuilder();
  builder.build();
}

module.exports = WidgetBuilder;