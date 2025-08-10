# 디자인 시스템 사용 예시

## 🎯 실제 사용 예시

이 파일은 새로운 컴포넌트를 만들 때 기존 디자인 시스템을 어떻게 활용하는지 보여주는 실습 가이드입니다.

## 📝 시나리오 1: 새로운 설정 버튼 추가

### ❌ 잘못된 방법
```tsx
// Cursor에게 이렇게 요청하면 디자인이 망가집니다
"설정 페이지에 저장 버튼 추가해줘"

// 결과: 임의의 스타일
<button className="bg-green-500 p-2 text-white rounded">
  저장
</button>
```

### ✅ 올바른 방법
```tsx
// Cursor에게 이렇게 요청하세요
"설정 페이지에 저장 버튼을 추가해줘. 
단, components/DesignSystem.tsx의 Button 컴포넌트를 사용하고,
variant='primary', size='md'로 설정해줘.
기존 FooterNav나 ActivityButton과 동일한 스타일 패턴 유지해야 해."

// 결과: 일관된 디자인
import { Button } from '../components/DesignSystem';

<Button variant="primary" size="md" onClick={handleSave}>
  저장
</Button>
```

## 📝 시나리오 2: 새로운 카드 컴포넌트 추가

### ❌ 잘못된 방법
```tsx
"진행률을 보여주는 카드 만들어줘"

// 결과: 기존 디자인과 다른 스타일
<div className="p-8 bg-blue-100 rounded-sm shadow-2xl">
  <h2 className="text-2xl text-purple-600">진행률</h2>
  <p className="text-green-500">80%</p>
</div>
```

### ✅ 올바른 방법
```tsx
"진행률을 보여주는 카드를 만들어줘.
components/DesignSystem.tsx의 Card 컴포넌트를 사용하고,
padding='lg', shadow=true로 설정해줘.
텍스트 색상은 기존 Header.tsx와 동일하게 text-slate-800 사용하고,
간격은 기존 ActivityButton과 동일한 패턴(p-3, gap-2)으로 해줘."

// 결과: 일관된 디자인
import { Card } from '../components/DesignSystem';

<Card padding="lg" className="mb-4">
  <h2 className="text-lg font-bold text-slate-800 mb-3">진행률</h2>
  <div className="flex items-center gap-2">
    <div className="text-2xl font-bold text-slate-800">80%</div>
    <div className="text-sm text-slate-500">완료</div>
  </div>
</Card>
```

## 📝 시나리오 3: 새로운 모달 추가

### ❌ 잘못된 방법
```tsx
"확인 모달 만들어줘"

// 결과: 기존 애니메이션과 다른 스타일
<div className="fixed inset-0 bg-red-500 bg-opacity-90">
  <div className="bg-white p-10 rounded-none animate-pulse">
    확인하시겠습니까?
  </div>
</div>
```

### ✅ 올바른 방법
```tsx
"확인 모달을 만들어줘.
components/DesignSystem.tsx의 Modal 컴포넌트를 사용하고,
size='md', title='확인'으로 설정해줘.
버튼은 DesignSystem의 Button 컴포넌트 사용해서
'취소'는 variant='secondary', '확인'은 variant='primary'로 해줘.
기존 모달들과 동일한 애니메이션(animate-fade-in, animate-scale-up) 패턴 유지해야 해."

// 결과: 일관된 디자인
import { Modal, Button } from '../components/DesignSystem';

<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  title="확인" 
  size="md"
>
  <p className="text-slate-800 mb-6">정말로 삭제하시겠습니까?</p>
  <div className="flex gap-3 justify-end">
    <Button variant="secondary" onClick={onClose}>
      취소
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      확인
    </Button>
  </div>
</Modal>
```

## 📝 시나리오 4: 활동 레벨 표시 추가

### ❌ 잘못된 방법
```tsx
"어휘 레벨을 보여주는 배지 만들어줘"

// 결과: colorUtils.ts 무시
<span className="bg-yellow-200 text-black px-2 py-1 rounded">
  Level 3
</span>
```

### ✅ 올바른 방법
```tsx
"어휘 레벨을 보여주는 배지를 만들어줘.
components/DesignSystem.tsx의 ActivityLevelBadge 컴포넌트를 사용하고,
type='vocab', level={레벨숫자}로 설정해줘.
utils/colorUtils.ts의 색상 시스템이 자동으로 적용되도록 해야 해."

// 결과: 일관된 색상 시스템
import { ActivityLevelBadge } from '../components/DesignSystem';

<ActivityLevelBadge type="vocab" level={3}>
  어휘 레벨 3
</ActivityLevelBadge>
```

## 📝 시나리오 5: 폼 입력 필드 추가

### ❌ 잘못된 방법
```tsx
"로그인 폼 만들어줘"

// 결과: 기존 패턴과 다른 스타일
<input 
  type="email" 
  className="w-full p-5 border-4 border-red-500 rounded-none text-lg"
  placeholder="이메일"
/>
```

### ✅ 올바른 방법
```tsx
"로그인 폼을 만들어줘.
components/DesignSystem.tsx의 Input 컴포넌트를 사용하고,
label, placeholder, type을 적절히 설정해줘.
전체적으로 Card 컴포넌트로 감싸고,
버튼은 Button 컴포넌트(variant='primary')를 사용해줘."

// 결과: 일관된 디자인
import { Card, Input, Button } from '../components/DesignSystem';

<Card padding="lg" className="max-w-md mx-auto">
  <h2 className="text-lg font-bold text-slate-800 mb-6">로그인</h2>
  <div className="space-y-4">
    <Input
      label="이메일"
      type="email"
      value={email}
      onChange={setEmail}
      placeholder="이메일을 입력하세요"
    />
    <Input
      label="비밀번호"
      type="password"
      value={password}
      onChange={setPassword}
      placeholder="비밀번호를 입력하세요"
    />
    <Button variant="primary" className="w-full" onClick={handleLogin}>
      로그인
    </Button>
  </div>
</Card>
```

## 🎨 색상 사용 예시

### 활동별 색상이 자동으로 적용되는 경우
```tsx
// 이렇게 하면 colorUtils.ts의 색상이 자동 적용됩니다
<ActivityLevelBadge type="vocab" level={1} />      // 밝은 노란색
<ActivityLevelBadge type="vocab" level={5} />      // 흰색 배경 + 노란색 테두리  
<ActivityLevelBadge type="vocab" level={8} />      // 어두운 노란색

<ActivityLevelBadge type="reading" level={2} />    // 밝은 초록색
<ActivityLevelBadge type="listening" level={6} />  // 흰색 배경 + 보라색 테두리
<ActivityLevelBadge type="grammar" level={9} />    // 어두운 주황색
```

### 일반적인 UI 색상
```tsx
// ✅ 승인된 색상만 사용
<div className="bg-white">                 // 카드 배경
<div className="bg-sky-100">               // 메인 배경 (body)
<div className="text-slate-800">           // 메인 텍스트
<div className="text-slate-500">           // 보조 텍스트  
<div className="text-blue-600">            // 액센트/링크
<div className="border-gray-200">          // 기본 테두리
<div className="hover:bg-gray-100">        // 호버 배경
```

## 🚀 성공적인 요청 실제 예시

### 프로필 설정 페이지 추가
```
"프로필 설정 페이지를 만들어줘. 다음 조건을 반드시 지켜야 해:

1. 전체 레이아웃: Card 컴포넌트(padding='lg') 사용
2. 입력 필드: Input 컴포넌트 사용 (이름, 이메일, 학년)  
3. 저장 버튼: Button 컴포넌트(variant='primary') 사용
4. 색상: text-slate-800 (제목), text-slate-500 (설명)
5. 간격: space-y-4 (입력 필드들), mb-6 (제목-내용)
6. 기존 Header.tsx, FooterNav.tsx와 동일한 스타일 패턴 유지

절대 변경 금지:
- 새로운 색상 추가 금지  
- 폰트 변경 금지
- 애니메이션 속도 변경 금지"
```

### 진행률 대시보드 추가
```
"학습 진행률을 보여주는 대시보드를 만들어줘. 조건:

1. 각 활동별 카드: Card 컴포넌트 사용
2. 레벨 표시: ActivityLevelBadge 컴포넌트 (type별로 vocab, reading, listening, grammar)
3. 진행률 숫자: text-2xl font-bold text-slate-800
4. 설명 텍스트: text-sm text-slate-500  
5. 그리드 레이아웃: grid grid-cols-2 gap-4
6. 기존 ActivityButton.tsx와 동일한 높이/간격 패턴

colorUtils.ts의 9단계 색상 시스템 반드시 사용해야 함"
```

## 💡 팁 요약

1. **항상 기존 컴포넌트 먼저**: DesignSystem.tsx 확인
2. **구체적인 조건 명시**: variant, size, padding 등
3. **참고 파일 제시**: "Header.tsx와 동일하게"
4. **금지 사항 명시**: "색상 변경 절대 금지"
5. **단계별 확인**: 하나씩 추가하며 검증

이렇게 요청하면 Google AI Studio 수준의 일관된 디자인을 유지할 수 있습니다! 🎨✨
