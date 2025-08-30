# Apple iOS 스타일 디자인 가이드라인

최신 iOS 17+ 스타일을 반영한 미니멀하고 모던한 채팅 인터페이스 디자인 정의서

## 🎨 핵심 디자인 원칙

### 1. Clarity (명확성)
- **목적**: 사용자가 한눈에 이해할 수 있는 직관적 인터페이스
- **구현**: 명확한 시각적 계층, 적절한 여백, 명확한 액션 표시

### 2. Deference (존중)
- **목적**: 콘텐츠가 주인공이 되는 디자인
- **구현**: 미니멀한 UI 요소, 콘텐츠에 집중할 수 있는 레이아웃

### 3. Depth (깊이감)
- **목적**: 공간감과 레이어를 통한 직관적 내비게이션
- **구현**: 부드러운 그림자, 블러 효과, 레이어 구분

## 🌈 컬러 시스템

### Primary Colors
```css
--ios-blue: #007AFF;          /* System Blue */
--ios-blue-light: #5AC8FA;    /* Light Blue */
--ios-blue-dark: #0056B3;     /* Dark Blue */
```

### Semantic Colors
```css
--ios-green: #34C759;         /* System Green */
--ios-red: #FF3B30;           /* System Red */
--ios-orange: #FF9500;        /* System Orange */
--ios-yellow: #FFCC00;        /* System Yellow */
--ios-purple: #AF52DE;        /* System Purple */
```

### Background Colors
```css
--ios-background-primary: #FFFFFF;
--ios-background-secondary: #F2F2F7;
--ios-background-tertiary: #FFFFFF;
--ios-background-grouped: #F2F2F7;
```

### Text Colors
```css
--ios-label-primary: #000000;
--ios-label-secondary: #3C3C43;
--ios-label-tertiary: #3C3C43;
--ios-label-quaternary: #3C3C43;
```

### Separator & Border
```css
--ios-separator: rgba(60, 60, 67, 0.36);
--ios-separator-opaque: #C6C6C8;
--ios-border-light: rgba(0, 0, 0, 0.04);
```

## 📝 타이포그래피

### SF Pro 시스템 폰트 대체
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 
             'Helvetica Neue', Helvetica, Arial, sans-serif;
```

### 텍스트 크기 & 스타일
```css
--ios-title-large: 34px/1.2 (weight: 700);      /* Large Title */
--ios-title: 28px/1.2 (weight: 700);            /* Title 1 */
--ios-title2: 22px/1.2 (weight: 700);           /* Title 2 */
--ios-title3: 20px/1.25 (weight: 600);          /* Title 3 */
--ios-headline: 17px/1.3 (weight: 600);         /* Headline */
--ios-body: 17px/1.4 (weight: 400);             /* Body */
--ios-callout: 16px/1.4 (weight: 400);          /* Callout */
--ios-subheadline: 15px/1.35 (weight: 400);     /* Subheadline */
--ios-footnote: 13px/1.4 (weight: 400);         /* Footnote */
--ios-caption: 12px/1.35 (weight: 400);         /* Caption 1 */
--ios-caption2: 11px/1.2 (weight: 400);         /* Caption 2 */
```

## 🎭 그림자 & 엘레베이션

### 카드 그림자
```css
--ios-shadow-small: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
--ios-shadow-medium: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
--ios-shadow-large: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
```

### 블러 효과
```css
--ios-blur-light: blur(20px) saturate(180%);
--ios-blur-medium: blur(40px) saturate(180%);
--ios-blur-strong: blur(60px) saturate(180%);
```

## 📏 간격 & 레이아웃

### 표준 간격
```css
--ios-spacing-xs: 2px;    /* Extra Small */
--ios-spacing-sm: 4px;    /* Small */
--ios-spacing-md: 8px;    /* Medium */
--ios-spacing-lg: 12px;   /* Large */
--ios-spacing-xl: 16px;   /* Extra Large */
--ios-spacing-2xl: 20px;  /* 2X Large */
--ios-spacing-3xl: 24px;  /* 3X Large */
--ios-spacing-4xl: 32px;  /* 4X Large */
```

### 둥근 모서리
```css
--ios-radius-sm: 6px;     /* Small Radius */
--ios-radius-md: 10px;    /* Medium Radius */
--ios-radius-lg: 14px;    /* Large Radius */
--ios-radius-xl: 20px;    /* Extra Large Radius */
--ios-radius-pill: 50px;  /* Pill Shape */
```

### 터치 타겟
```css
--ios-touch-target: 44px; /* 최소 터치 영역 */
```

## 🔘 버튼 스타일

### Primary Button
- **배경**: `--ios-blue` → `--ios-blue-dark` (hover)
- **텍스트**: 흰색, 폰트 가중치 600
- **둥근 모서리**: `--ios-radius-md` (10px)
- **패딩**: 12px 24px
- **그림자**: `--ios-shadow-small`
- **전환**: 0.2s ease

### Secondary Button
- **배경**: 투명 → rgba(0, 122, 255, 0.1) (hover)
- **테두리**: 1px solid `--ios-blue`
- **텍스트**: `--ios-blue`, 폰트 가중치 600

### Ghost Button
- **배경**: 투명
- **텍스트**: `--ios-blue`, 폰트 가중치 500
- **호버**: 배경색 변경 없이 투명도 조정

## 💬 메시지 버블

### 사용자 메시지 (송신)
```css
background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
color: white;
border-radius: 18px 18px 4px 18px;
max-width: 75%;
align: flex-end;
box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
```

### AI 메시지 (수신)
```css
background: #F2F2F7;
color: --ios-label-primary;
border-radius: 18px 18px 18px 4px;
max-width: 75%;
align: flex-start;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
```

### 메시지 간격
- **메시지 간**: 8px
- **대화 그룹 간**: 16px
- **내부 패딩**: 12px 16px

## 🎯 아이콘 시스템

### 아이콘 크기
```css
--ios-icon-sm: 16px;      /* Small Icons */
--ios-icon-md: 20px;      /* Medium Icons */
--ios-icon-lg: 24px;      /* Large Icons */
--ios-icon-xl: 32px;      /* Extra Large Icons */
```

### 아이콘 스타일
- **선 굵기**: 2px (medium weight)
- **스타일**: SF Symbols 스타일
- **색상**: 컨텍스트에 따라 semantic colors 사용

## ⚡ 애니메이션 & 트랜지션

### 표준 전환
```css
--ios-transition-fast: 0.15s ease-out;
--ios-transition-normal: 0.25s ease-out;
--ios-transition-slow: 0.4s ease-out;
```

### 스프링 애니메이션
```css
--ios-spring-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ios-spring-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### 메시지 등장 애니메이션
```css
@keyframes message-appear {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

## 📱 반응형 원칙

### 브레이크포인트
```css
--ios-mobile: 375px;      /* iPhone SE */
--ios-tablet: 768px;      /* iPad */
--ios-desktop: 1024px;    /* iPad Pro */
```

### 적응형 레이아웃
- **모바일**: 단일 컬럼, 풀 너비 채팅
- **태블릿**: 사이드바 + 메인 채팅 영역
- **데스크톱**: 확장된 레이아웃, 개발자 도구 패널

## 🎨 다크모드 지원

### 다크모드 컬러
```css
@media (prefers-color-scheme: dark) {
  --ios-background-primary: #000000;
  --ios-background-secondary: #1C1C1E;
  --ios-background-tertiary: #2C2C2E;
  --ios-label-primary: #FFFFFF;
  --ios-label-secondary: #EBEBF5;
  --ios-separator: rgba(84, 84, 88, 0.65);
}
```

## ♿ 접근성 가이드라인

### 색상 대비
- **텍스트**: 최소 4.5:1 (AA 등급)
- **대형 텍스트**: 최소 3:1 (AA 등급)
- **인터랙티브 요소**: 명확한 시각적 피드백

### 키보드 내비게이션
- **포커스 표시**: 2px solid `--ios-blue`
- **탭 순서**: 논리적 흐름
- **스킵 링크**: 메인 콘텐츠로 바로 이동

### 스크린 리더
- **시맨틱 HTML**: 적절한 ARIA 라벨
- **대체 텍스트**: 의미 있는 이미지 설명
- **상태 알림**: 동적 콘텐츠 변경 안내

## 🔧 구현 체크리스트

### 필수 구현 사항
- [ ] SF Pro 대체 폰트 적용
- [ ] iOS 컬러 시스템 구현
- [ ] 표준 간격 시스템 적용
- [ ] 메시지 버블 스타일링
- [ ] 부드러운 애니메이션 구현
- [ ] 반응형 레이아웃 적용

### 고급 구현 사항
- [ ] 다크모드 지원
- [ ] 블러 효과 적용
- [ ] 햅틱 피드백 시뮬레이션
- [ ] 접근성 최적화
- [ ] 성능 최적화

## 📋 품질 기준

### 성능 목표
- **초기 로딩**: < 1초
- **상호작용**: < 100ms
- **애니메이션**: 60fps 유지
- **메모리 사용량**: < 100MB

### 사용성 기준
- **터치 타겟**: 최소 44px
- **읽기 속도**: 200-250 단어/분
- **오류율**: < 1%
- **만족도**: > 4.5/5

---

*이 가이드라인은 iOS Human Interface Guidelines와 최신 디자인 트렌드를 기반으로 작성되었습니다.*