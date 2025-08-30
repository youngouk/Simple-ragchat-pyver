# Sendbird 스타일 디자인 가이드라인

모던하고 세련된 Sendbird 디자인 시스템을 기반으로 한 채팅 인터페이스 디자인 정의서

## 🎨 핵심 디자인 철학

### 1. Modern Minimalism
- **목적**: 깔끔하고 현대적인 인터페이스로 사용자 집중도 향상
- **구현**: 불필요한 요소 제거, 여백의 미 활용, 기능적 아름다움 추구

### 2. Brand Identity
- **목적**: 독특한 보라색 브랜드 컬러로 차별화된 경험 제공
- **구현**: Sendbird 시그니처 퍼플 그라디언트, 일관된 컬러 시스템

### 3. Accessibility First
- **목적**: 모든 사용자가 편안하게 사용할 수 있는 포용적 디자인
- **구현**: 높은 대비율, 명확한 계층 구조, 직관적 인터랙션

## 🌈 컬러 시스템

### Primary Colors (Sendbird Purple)
```css
--sendbird-purple-500: #491389;  /* Darkest - Text on light */
--sendbird-purple-400: #6210CC;  /* Main brand color */
--sendbird-purple-300: #742DDD;  /* Default primary */
--sendbird-purple-200: #C2A9FA;  /* Light accent */
--sendbird-purple-100: #DBD1FF;  /* Lightest - Background */
```

### Secondary Colors (Teal)
```css
--sendbird-teal-500: #066858;    /* Darkest */
--sendbird-teal-400: #027D69;    /* Dark */
--sendbird-teal-300: #259C72;    /* Default secondary */
--sendbird-teal-200: #69C085;    /* Light */
--sendbird-teal-100: #A8E2AB;    /* Lightest */
```

### Semantic Colors
```css
/* Error/Danger */
--sendbird-error-500: #9D091E;   /* Dark red */
--sendbird-error-400: #A30E16;   /* Error text */
--sendbird-error-300: #BF0711;   /* Default error */
--sendbird-error-200: #E53157;   /* Light error */
--sendbird-error-100: #FDAAAA;   /* Error background */

/* Success */
--sendbird-success-500: #066858;  /* Dark green */
--sendbird-success-300: #259C72;  /* Default success */
--sendbird-success-100: #A8E2AB;  /* Success background */

/* Warning */
--sendbird-warning-500: #E89404;  /* Dark yellow */
--sendbird-warning-300: #FFC107;  /* Default warning */
--sendbird-warning-100: #FFF2B6;  /* Warning background */

/* Information */
--sendbird-info-500: #0062E0;     /* Dark blue */
--sendbird-info-300: #3B7FFF;     /* Default info */
--sendbird-info-100: #ADC9FF;     /* Info background */
```

### Neutral Colors
```css
--sendbird-neutral-900: #0D0D0D;  /* Darkest - Primary text */
--sendbird-neutral-800: #161616;  /* Dark text */
--sendbird-neutral-700: #2C2C2C;  /* Body text */
--sendbird-neutral-600: #3B3B3B;  /* Secondary text */
--sendbird-neutral-500: #585858;  /* Muted text */
--sendbird-neutral-400: #A6A6A6;  /* Placeholder */
--sendbird-neutral-300: #C7C7C7;  /* Borders */
--sendbird-neutral-200: #E9E9E9;  /* Dividers */
--sendbird-neutral-100: #F7F7F7;  /* Background */
--sendbird-neutral-50: #FFFFFF;   /* White */
```

### Special Colors
```css
--sendbird-overlay-dark: rgba(0, 0, 0, 0.55);    /* Modal backdrop */
--sendbird-overlay-light: rgba(0, 0, 0, 0.32);   /* Light overlay */
--sendbird-highlight: #FFF2B6;                    /* Highlight/Mention */
--sendbird-shadow: rgba(0, 0, 0, 0.12);          /* Shadows */
```

## 📝 타이포그래피

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 
             'Segoe UI Emoji', 'Segoe UI Symbol';
```

### Text Styles
```css
/* Display */
--text-display: 700 32px/1.2;     /* Bold headlines */

/* Heading */
--text-h1: 600 24px/1.3;          /* Page titles */
--text-h2: 600 20px/1.3;          /* Section headers */
--text-h3: 600 18px/1.3;          /* Subsection headers */

/* Body */
--text-body-lg: 400 16px/1.5;     /* Large body text */
--text-body: 400 14px/1.5;        /* Default body text */
--text-body-sm: 400 13px/1.5;     /* Small body text */

/* Caption */
--text-caption: 400 12px/1.4;     /* Captions, labels */
--text-caption-sm: 400 11px/1.4;  /* Small captions */

/* Button */
--text-button: 600 14px/1;        /* Button text */
--text-button-sm: 600 12px/1;     /* Small buttons */
```

## 🎭 그림자 시스템

```css
/* Elevation Levels */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Colored Shadows */
--shadow-purple: 0 4px 14px 0 rgba(116, 45, 221, 0.25);
--shadow-teal: 0 4px 14px 0 rgba(37, 156, 114, 0.25);
```

## 📏 간격 시스템

```css
/* Spacing Scale */
--space-xxs: 2px;   /* Micro spacing */
--space-xs: 4px;    /* Extra small */
--space-sm: 8px;    /* Small */
--space-md: 12px;   /* Medium */
--space-lg: 16px;   /* Large */
--space-xl: 20px;   /* Extra large */
--space-2xl: 24px;  /* 2X large */
--space-3xl: 32px;  /* 3X large */
--space-4xl: 48px;  /* 4X large */
```

## 🔘 컴포넌트 스타일

### 버튼
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #742DDD 0%, #6210CC 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(116, 45, 221, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(116, 45, 221, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #742DDD;
  border: 1.5px solid #742DDD;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(116, 45, 221, 0.08);
}
```

### 메시지 버블
```css
/* Sent Message */
.message-sent {
  background: linear-gradient(135deg, #742DDD 0%, #6210CC 100%);
  color: white;
  border-radius: 20px 20px 4px 20px;
  padding: 12px 16px;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(116, 45, 221, 0.3);
}

/* Received Message */
.message-received {
  background: #F7F7F7;
  color: #2C2C2C;
  border-radius: 20px 20px 20px 4px;
  padding: 12px 16px;
  max-width: 70%;
  border: 1px solid #E9E9E9;
}

/* System Message */
.message-system {
  background: rgba(116, 45, 221, 0.08);
  color: #742DDD;
  border-radius: 12px;
  padding: 8px 12px;
  text-align: center;
  font-size: 13px;
}
```

### 입력 필드
```css
.input-field {
  background: #F7F7F7;
  border: 1.5px solid transparent;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.input-field:focus {
  background: white;
  border-color: #742DDD;
  box-shadow: 0 0 0 3px rgba(116, 45, 221, 0.1);
}
```

### 카드
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #E9E9E9;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
```

## ⚡ 애니메이션

```css
/* Timing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Common Transitions */
--transition-all: all 200ms var(--ease-in-out);
--transition-colors: background-color, border-color, color 200ms var(--ease-in-out);
--transition-transform: transform 200ms var(--ease-out);
--transition-shadow: box-shadow 200ms var(--ease-in-out);
```

### 메시지 애니메이션
```css
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes typing-pulse {
  0%, 80%, 100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}
```

## 📱 반응형 브레이크포인트

```css
--mobile: 375px;     /* Mobile devices */
--tablet: 768px;     /* Tablets */
--desktop: 1024px;   /* Desktop */
--wide: 1440px;      /* Wide screens */
```

## 🌙 다크모드

```css
/* Dark Theme Colors */
[data-theme="dark"] {
  --bg-primary: #0D0D0D;
  --bg-secondary: #161616;
  --bg-tertiary: #2C2C2C;
  --text-primary: #F7F7F7;
  --text-secondary: #C7C7C7;
  --border-color: #3B3B3B;
  
  /* Adjusted brand colors for dark mode */
  --sendbird-purple-dark: #8B5CF6;
  --sendbird-purple-light: #A78BFA;
}
```

## ♿ 접근성 가이드라인

### 색상 대비
- 일반 텍스트: 최소 4.5:1 (WCAG AA)
- 대형 텍스트: 최소 3:1 (WCAG AA)
- 인터랙티브 요소: 최소 3:1
- 보라색 배경의 흰색 텍스트: 5.2:1 (검증됨)

### 포커스 표시
```css
:focus-visible {
  outline: 2px solid #742DDD;
  outline-offset: 2px;
}
```

### 터치 타겟
- 최소 크기: 44x44px
- 권장 크기: 48x48px

## 🔧 구현 체크리스트

- [ ] Sendbird 컬러 팔레트 적용
- [ ] 보라색 그라디언트 메시지 버블
- [ ] 모던한 타이포그래피 시스템
- [ ] 부드러운 그림자 효과
- [ ] 세련된 호버 애니메이션
- [ ] 반응형 레이아웃
- [ ] 다크모드 지원
- [ ] 접근성 최적화

## 📊 성능 목표

- 초기 로딩: < 1.5초
- 애니메이션: 60fps 유지
- 인터랙션 응답: < 100ms
- 번들 크기: < 300KB

---

*이 가이드라인은 Sendbird의 공식 디자인 시스템과 최신 UI/UX 트렌드를 기반으로 작성되었습니다.*