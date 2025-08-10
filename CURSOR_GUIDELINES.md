# Cursor AI 사용 가이드라인

## 🎯 목적
이 가이드는 Cursor AI를 사용할 때 현재 앱의 디자인 품질을 유지하면서 기능을 추가/수정하기 위한 명확한 지침입니다.

## 📋 요청 템플릿

### ✅ 올바른 요청 방법
```
[기능 요청] + 디자인 시스템 준수 조건:

1. 컴포넌트: components/DesignSystem.tsx의 기존 컴포넌트 사용
2. 색상: DESIGN_SYSTEM.md의 색상 팔레트만 사용
3. 간격: 기존 p-3, gap-2, h-[58px] 등 패턴 유지
4. 애니메이션: animate-fade-in, animate-scale-up 사용
5. 참고: [기존 비슷한 컴포넌트명] 스타일과 동일하게

절대 변경 금지:
- 폰트 (Lexend, Noto Sans KR)
- 메인 배경색 (#f0f9ff)
- 컴포넌트 고정 크기 (58px, 54px 등)
- 애니메이션 속도 (0.2s)
```

### ❌ 피해야 할 요청 방법
```
"로그인 버튼 만들어줘"  // 너무 모호함
"예쁘게 만들어줘"     // 기준이 불분명
"색상 바꿔줘"         // 디자인 시스템 파괴
```

## 🧩 컴포넌트 사용법

### 기본 버튼
```tsx
// ✅ 좋은 예
import { Button } from './components/DesignSystem';

<Button variant="primary" size="md" onClick={handleClick}>
  로그인
</Button>

// ❌ 나쁜 예  
<button className="bg-red-500 p-5 text-white">  // 디자인 시스템 무시
  로그인
</button>
```

### 활동 버튼
```tsx
// ✅ 좋은 예
import { ActivityButton } from './components/DesignSystem';
import { VocabIcon } from './components/icons';

<ActivityButton 
  icon={<VocabIcon />} 
  label="어휘 학습" 
  onClick={handleVocab}
/>

// ❌ 나쁜 예
<div className="p-4 bg-blue-200">  // 기존 패턴 무시
  어휘 학습
</div>
```

### 카드
```tsx
// ✅ 좋은 예
import { Card } from './components/DesignSystem';

<Card padding="lg" className="mb-4">
  <h2>제목</h2>
  <p>내용</p>
</Card>

// ❌ 나쁜 예
<div className="p-10 bg-gray-100 rounded-sm">  // 디자인 시스템 벗어남
```

### 모달
```tsx
// ✅ 좋은 예
import { Modal } from './components/DesignSystem';

<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  title="설정"
  size="md"
>
  모달 내용
</Modal>
```

### 활동 레벨 배지
```tsx
// ✅ 좋은 예
import { ActivityLevelBadge } from './components/DesignSystem';

<ActivityLevelBadge type="vocab" level={3}>
  레벨 3
</ActivityLevelBadge>
```

## 🎨 색상 사용법

### 활동별 색상
```tsx
// ✅ 올바른 활동 색상 사용
<div className="bg-white border border-gray-200">  // 기본 카드
<ActivityLevelBadge type="vocab" level={2} />      // 어휘 색상 자동 적용
<ActivityLevelBadge type="reading" level={5} />    // 읽기 색상 자동 적용

// ❌ 잘못된 색상 사용
<div className="bg-purple-600">  // 임의의 색상 사용
```

### 텍스트 색상
```tsx
// ✅ 올바른 텍스트 색상
<h1 className="text-slate-800">제목</h1>           // 메인 텍스트
<p className="text-slate-500">부제목</p>           // 보조 텍스트
<span className="text-blue-600">활성 상태</span>    // 액센트 색상

// ❌ 잘못된 텍스트 색상
<h1 className="text-orange-500">제목</h1>  // 디자인 시스템에 없는 색상
```

## 📏 간격 및 크기 가이드

### 컴포넌트 크기
```tsx
// ✅ 기존 크기 패턴 유지
<div className="h-[58px]">  // ActivityButton 높이
<div className="h-[54px]">  // FooterNav 높이  
<div className="w-6 h-6">   // 아이콘 크기

// ❌ 임의의 크기
<div className="h-12">      // 기존 패턴과 다름
<div className="w-8 h-8">   // 아이콘 크기 불일치
```

### 간격
```tsx
// ✅ 기존 간격 패턴
<div className="p-3 gap-2">     // ActivityButton 패턴
<div className="p-4 space-y-3"> // 일반적인 카드 패턴
<div className="mb-4">          // 컴포넌트 간 간격

// ❌ 불규칙한 간격
<div className="p-7 gap-5">     // 기존 패턴과 다름
```

## ⚡ 애니메이션 사용

### 모달/팝업
```tsx
// ✅ 기존 애니메이션 사용
<div className="animate-fade-in">        // 배경 페이드인
<div className="animate-scale-up">       // 모달 등장
<div className="animate-fade-in-up">     // 아래에서 위로

// ❌ 새로운 애니메이션
<div className="animate-bounce">         // 기존 디자인과 맞지 않음
```

### 호버 효과
```tsx
// ✅ 기존 호버 패턴
<button className="hover:bg-gray-100 transition-colors">

// ❌ 과도한 호버 효과
<button className="hover:scale-110 hover:rotate-3">  // 너무 과함
```

## 🔒 절대 변경 금지 항목

1. **폰트**: `'Lexend', 'Noto Sans KR', sans-serif`
2. **메인 배경색**: `#f0f9ff` (bg-sky-100)
3. **ActivityButton 높이**: `58px`
4. **FooterNav 높이**: `54px`
5. **아이콘 크기**: `24px` (w-6 h-6)
6. **애니메이션 속도**: `0.2s` (빠른), `0.3s` (부드러운)
7. **활동별 색상 체계**: colorUtils.ts의 9단계 시스템

## 📝 체크리스트

변경 사항을 적용하기 전에 확인하세요:

- [ ] DesignSystem.tsx의 컴포넌트를 사용했는가?
- [ ] 기존 색상 팔레트를 준수했는가?
- [ ] 간격과 크기가 기존 패턴과 일치하는가?
- [ ] 애니메이션이 기존 스타일과 일관성이 있는가?
- [ ] 절대 변경 금지 항목을 건드리지 않았는가?
- [ ] 반응형 디자인이 깨지지 않았는가?

## 🚨 문제 발생 시

만약 디자인이 망가졌다면:

1. **즉시 중단**: 추가 변경 금지
2. **원인 파악**: 어떤 부분이 기존 패턴과 다른지 확인
3. **롤백**: 기존 컴포넌트 패턴으로 되돌리기
4. **재시도**: 가이드라인에 따라 다시 요청

## 💡 성공 팁

1. **작은 단위로 작업**: 한 번에 하나의 컴포넌트만
2. **기존 코드 참조**: "Header.tsx와 동일한 스타일로"
3. **구체적인 지시**: "절대 색상 변경 금지"  
4. **단계별 확인**: 각 변경 후 결과 검토

이 가이드라인을 따르면 Google AI Studio 수준의 디자인 품질을 Cursor로도 유지할 수 있습니다! 🎨✨
