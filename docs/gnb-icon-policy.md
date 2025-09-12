# GNB 아이콘 정책 및 구현 가이드

## 📋 개요

프롬프트 생성기의 GNB(Global Navigation Bar) 중앙에 위치한 스텝 아이콘들의 시각적 상태, 상호작용 규칙 및 구현 방법을 정의합니다.

## 🎯 핵심 정책

### 1. 아이콘 색상 정책
- ✅ **완료된 스텝**: 파란색 아이콘 (`fill-blue-500`, `text-blue-500`)
- ✅ **현재 진행 중인 스텝**: 파란색 아이콘 (`fill-blue-500`, `text-blue-500`)
- ❌ **미완료 스텝**: 회색 아이콘 (`fill-gray-400`, `text-gray-400`)

### 2. 아이콘 크기 정책
- 🔍 **현재 스텝**: 1.25배 확대 (`scale-125`)
- 📝 **기타 스텝**: 기본 크기 (`scale-100`)
- ✨ **드롭 섀도우**: 현재 스텝에만 적용 (`filter drop-shadow-lg`)

### 3. 클릭 가능성 정책
- ✅ **완료된 스텝**: 클릭 가능 (현재 스텝 제외)
- ❌ **미완료 스텝**: 클릭 불가
- ❌ **현재 스텝**: 클릭 불가 (이미 해당 위치에 있음)

### 4. 생성 중 애니메이션 정책
- 🔄 **생성 중**: 파란색-회색 번갈아가는 애니메이션 (`animate-generating-fill`)
- 💫 **배경 효과**: 펄스 링 효과 (`animate-ping`)
- ⏱️ **애니메이션 주기**: 2초 (`2s ease-in-out infinite`)

### 5. 연결선 정책
- 📍 **위치**: 각 아이콘의 **좌측**에 배치 (첫 번째 아이콘 제외)
- 🎨 **색상**: 해당 아이콘과 동일한 상태
  - 완료/현재 스텝: 파란색 연결선 (`bg-blue-500`)
  - 미완료 스텝: 회색 연결선 (`bg-gray-300`)
- 📏 **크기**: 너비 8 (`w-8`), 높이 0.5 (`h-0.5`)

### 6. 앞선 단계 수정 시 자동 초기화 정책
- 🔄 **Step1 수정**: Step2~5 자동 초기화 → 회색 아이콘으로 변경
- 🔄 **Step2 수정**: Step3~5 자동 초기화 → 회색 아이콘으로 변경
- 📊 **변경 감지**: JSON 해시 기반 실제 데이터 변경 시에만 초기화

## 🏗️ 기술 구현

### 아이콘 상태 계산 로직

```typescript
const isActive = step.num === currentStep;
const isCompleted = step.isCompleted;
const canAccess = isCompleted && !isActive;

// 색상 정책
const iconColor = isActive && isGenerating ? '' : 
  (isCompleted || isActive ? 'text-blue-500' : 'text-gray-400');
const fillColor = isActive && isGenerating ? '' : 
  (isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400');

// 크기 정책
const scale = isActive ? 'scale-125' : 'scale-100';
```

### 연결선 렌더링 로직

```typescript
{/* 각 아이콘 좌측에 연결선 (첫 번째 아이콘 제외) */}
{index > 0 && (
  <div className={`
    w-8 h-0.5 transition-all duration-500
    ${(isCompleted || isActive) ? 'bg-blue-500' : 'bg-gray-300'}
    ${isActive && isGenerating ? 'animate-pulse' : ''}
  `}></div>
)}
```

### 데이터 변경 감지 로직

```typescript
// WorkflowContainer.tsx
const handleStep1DataChange = (partialData: any) => {
  const currentStep1Hash = JSON.stringify(workflowData.step1);
  const newStep1Hash = JSON.stringify(partialData);
  
  let updatedWorkflowData;
  
  // 실제 데이터 변경 시에만 뒷 단계 초기화
  if (currentStep1Hash !== newStep1Hash && workflowData.step1) {
    const resetData = resetLaterSteps(1);
    updatedWorkflowData = { ...resetData, step1: partialData };
  } else {
    updatedWorkflowData = { ...workflowData, step1: partialData };
  }
  
  setWorkflowData(updatedWorkflowData);
};
```

### 생성 중 애니메이션 설정

```javascript
// tailwind.config.js
keyframes: {
  'generating-fill': {
    '0%, 100%': { fill: 'rgb(59 130 246)' }, // blue-500
    '50%': { fill: 'rgb(156 163 175)' }, // gray-400
  }
},
animation: {
  'generating-fill': 'generating-fill 2s ease-in-out infinite',
}
```

## 🎭 상태별 시각적 예시

### 시나리오 1: 새 프로젝트 시작
```
[파란색-1] ㅡ [회색-2] ㅡ [회색-3] ㅡ [회색-4] ㅡ [회색-5]
```

### 시나리오 2: Step2 완료 후
```
[파란색-1] ㅡ [파란색(확대)-2] ㅡ [회색-3] ㅡ [회색-4] ㅡ [회색-5]
```

### 시나리오 3: Step2 생성 중
```
[파란색-1] ㅡ [애니메이션(확대)-2] ㅡ [회색-3] ㅡ [회색-4] ㅡ [회색-5]
```

### 시나리오 4: Step1 수정 시 (Step2 초기화)
```
[파란색(확대)-1] ㅡ [회색-2] ㅡ [회색-3] ㅡ [회색-4] ㅡ [회색-5]
```

## 🔧 새로운 Step 추가 시 체크리스트

새로운 Step을 추가할 때 다음 사항들을 확인하세요:

### 1. Step 컴포넌트 구현
- [ ] `onGeneratingChange` prop 추가
- [ ] 생성 중 상태를 부모로 전달
- [ ] `onDataChange`로 실시간 데이터 변경 알림

### 2. WorkflowContainer 수정
- [ ] `getWorkflowSteps()` 함수에 새 step 추가
- [ ] `handleStepXDataChange` 함수 구현 (데이터 변경 감지 포함)
- [ ] `handleStepXComplete` 함수 구현
- [ ] `renderCurrentStep()`에 새 step 케이스 추가

### 3. GNB 아이콘 추가
- [ ] `GNB.tsx`에 새 step 아이콘 SVG 추가
- [ ] 동일한 색상/애니메이션 로직 적용
- [ ] `fillColor` 변수 적용

### 4. 자동 초기화 로직
- [ ] 앞선 단계 수정 시 해당 step도 초기화되도록 `resetLaterSteps` 함수 범위 확인

## 🚨 주의사항

### 1. 애니메이션 성능
- 과도한 애니메이션은 피하고, 2초 주기 권장
- `transform` 보다는 `color`, `fill` 속성 애니메이션 우선

### 2. 접근성 고려
- 색상만으로 상태를 구분하지 않고 크기, 투명도도 함께 활용
- 툴팁으로 각 단계명 표시

### 3. 일관성 유지
- 모든 step에서 동일한 색상 팔레트 사용 (`blue-500`, `gray-400`)
- 연결선과 아이콘 상태 동기화 필수

## 📚 관련 파일

- `src/components/common/GNB.tsx`: 메인 구현
- `src/components/workflow/WorkflowContainer.tsx`: 상태 관리
- `tailwind.config.js`: 애니메이션 정의
- `docs/gnb-icon-policy.md`: 이 문서

## 🔄 업데이트 히스토리

- **2024.09.13**: 초기 정책 수립 및 문서 작성
- **2024.09.13**: 연결선 위치 수정 (우측 → 좌측)
- **2024.09.13**: 데이터 변경 감지 로직 개선