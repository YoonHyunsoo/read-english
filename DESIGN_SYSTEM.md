# 리드-잉글리시 디자인 시스템

## 🎨 색상 체계 (현재 앱 기준)

### 주요 브랜드 컬러
```css
/* 네비게이션 & 액센트 */
--blue-primary: #3b82f6;      /* text-blue-600 */
--blue-secondary: #4D7099;    /* FooterNav 비활성 색상 */

/* 배경 컬러 */
--bg-main: #f0f9ff;          /* bg-sky-100 - 메인 배경 */
--bg-card: #ffffff;          /* 카드 배경 */
--bg-hover: #f3f4f6;         /* hover 상태 */

/* 텍스트 컬러 */
--text-primary: #1e293b;     /* slate-800 - 메인 텍스트 */
--text-secondary: #64748b;   /* slate-500 */
--text-muted: #9ca3af;       /* gray-400 */

/* 테두리 */
--border-light: #e5e7eb;     /* gray-200 */
--border-dark: #d1d5db;      /* gray-300 */
```

### 활동별 색상 (colorUtils.ts 기준)
```css
/* Vocab (노란색 계열) */
--vocab-light-1: #FFF7D9;
--vocab-light-2: #FFF0B3;
--vocab-light-3: #FFE680;
--vocab-dark-1: #F7BA00;
--vocab-dark-2: #D99E00;
--vocab-dark-3: #A67600;

/* Listening (보라색 계열) */
--listening-light-1: #EEDDF3;
--listening-light-2: #E0C6EB;
--listening-light-3: #D1AEE3;
--listening-dark-1: #8A4EAF;
--listening-dark-2: #6B3795;
--listening-dark-3: #4C1F74;

/* Reading (초록색 계열) */
--reading-light-1: #DCF2E4;
--reading-light-2: #C6EBD4;
--reading-light-3: #A9DFC0;
--reading-dark-1: #3AA06F;
--reading-dark-2: #2D805A;
--reading-dark-3: #1F5C42;

/* Grammar (주황색 계열) */
--grammar-light-1: #FFE9D6;
--grammar-light-2: #FFD9B8;
--grammar-light-3: #FFC394;
--grammar-dark-1: #F6781A;
--grammar-dark-2: #D65F14;
--grammar-dark-3: #A94708;
```

## 📝 타이포그래피
```css
/* 폰트 패밀리 */
font-family: 'Lexend', 'Noto Sans KR', sans-serif;

/* 폰트 크기 */
--text-xs: 0.75rem;     /* 12px - FooterNav 라벨 */
--text-sm: 0.875rem;    /* 14px - ActivityButton 라벨 */
--text-base: 1rem;      /* 16px - 기본 텍스트 */
--text-lg: 1.125rem;    /* 18px - 제목 */
--text-xl: 1.25rem;     /* 20px - 큰 제목 */

/* 폰트 굵기 */
--font-normal: 400;
--font-medium: 500;
--font-bold: 700;
```

## 📏 간격 시스템 (현재 사용 중)
```css
/* 패딩 & 마진 */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px - gap-2 */
--spacing-3: 0.75rem;   /* 12px - p-3 */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */

/* 컴포넌트별 고정 크기 */
--button-height: 58px;  /* ActivityButton h-[58px] */
--nav-height: 54px;     /* FooterNav h-[54px] */
--icon-size: 24px;      /* w-6 h-6 */
```

## 🎭 애니메이션 (index.html 기준)
```css
/* Fade In */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}

/* Fade In Up */
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
}

/* Scale Up */
@keyframes scaleUp {
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}
.animate-scale-up {
    animation: scaleUp 0.2s ease-out forwards;
}
```

## 🔲 핵심 컴포넌트 패턴

### ActivityButton 스타일
```css
.activity-button {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.75rem;           /* p-3 */
    gap: 0.5rem;               /* gap-2 */
    height: 58px;              /* h-[58px] */
    background: white;
    border: 1px solid #e5e7eb; /* border-gray-200 */
    border-radius: 0.5rem;     /* rounded-lg */
    transition: colors 0.15s;  /* transition-colors */
    flex: 1;
}

.activity-button:hover {
    background: #f3f4f6;       /* hover:bg-gray-100 */
}

.activity-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### FooterNav 스타일
```css
.nav-item {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 0.25rem;              /* gap-1 */
    flex: 1;
    height: 54px;              /* h-[54px] */
}

.nav-item.active {
    color: #3b82f6;            /* text-blue-600 */
}

.nav-item:not(.active) {
    color: #4D7099;            /* 커스텀 색상 */
}
```

## 📱 반응형 규칙
- **Mobile First**: 기본 스타일은 모바일 기준
- **Tablet**: 640px 이상
- **Desktop**: 1024px 이상

## ⚠️ 절대 변경 금지 사항
1. **폰트**: 'Lexend', 'Noto Sans KR' 조합
2. **메인 배경**: #f0f9ff (bg-sky-100)
3. **애니메이션 속도**: 0.2s (빠른 반응), 0.3s (부드러운 전환)
4. **활동별 색상 체계**: colorUtils.ts의 9단계 색상
5. **컴포넌트 고정 높이**: ActivityButton(58px), FooterNav(54px)
6. **아이콘 크기**: 24px (w-6 h-6)

## 🎯 디자인 원칙
1. **일관성**: 모든 버튼, 카드, 간격이 동일한 패턴
2. **접근성**: 충분한 대비와 터치 영역
3. **성능**: 0.2초 이내의 빠른 애니메이션
4. **반응형**: 모든 화면 크기에서 최적화
