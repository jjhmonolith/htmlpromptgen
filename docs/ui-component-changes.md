# UI 컴포넌트 변경사항 설계

## 🎯 변경 개요

Step2 재설계에 따른 UI 컴포넌트 변경사항과 데이터 흐름 재설계 방안입니다.

## 📱 Step2VisualIdentity 컴포넌트 확장

### 현재 구조
```typescript
interface Step2VisualIdentityProps {
  initialData?: { visualIdentity: VisualIdentity; designTokens: DesignTokens };
  projectData: ProjectData;
  apiKey: string;
  onComplete?: (data: { visualIdentity: VisualIdentity; designTokens: DesignTokens }) => void;
  onDataChange?: (data: { visualIdentity: VisualIdentity; designTokens: DesignTokens }) => void;
  // ...
}
```

### 새로운 구조
```typescript
interface Step2IntegratedProps {
  initialData?: Step2NewResult;
  projectData: ProjectData;
  apiKey: string;
  onComplete?: (data: Step2NewResult) => void;
  onDataChange?: (data: Step2NewResult) => void;
  // ...
}
```

### UI 확장 계획

1. **기존 3개 카드 유지** (무드&톤, 컬러팔레트, 타이포그래피)
2. **새로운 교안 미리보기 섹션 추가**
   - 페이지별 탭으로 구성
   - 각 페이지의 교안 텍스트 미리보기
   - 학습목표, 핵심메시지, 이미지설명, 상호작용 표시

### 레이아웃 설계

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 2: 통합 결과                          │
├─────────────────────────────────────────────────────────────┤
│  [무드&톤]    [컬러팔레트]    [타이포그래피]                   │
├─────────────────────────────────────────────────────────────┤
│                  [컴포넌트 스타일]                           │
├─────────────────────────────────────────────────────────────┤
│                   📚 교안 미리보기                           │
│  ┌─ 페이지 1 ─┐ ┌─ 페이지 2 ─┐ ┌─ 페이지 3 ─┐               │
│  │  학습목표   │ │  학습목표   │ │  학습목표   │               │
│  │  핵심메시지 │ │  핵심메시지 │ │  핵심메시지 │               │
│  │  교안본문   │ │  교안본문   │ │  교안본문   │               │
│  │  (요약)     │ │  (요약)     │ │  (요약)     │               │
│  └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Step3EducationalDesign 컴포넌트 단순화

### 현재 구조
- 복잡한 교육 콘텐츠 설계 + 레이아웃 표시
- Phase1, Phase2 구분
- 복잡한 파싱 결과 표시

### 새로운 구조
- **레이아웃 설계만 표시**
- Step2에서 받은 교안 텍스트는 수정 없이 참조만
- 레이아웃 구조, 이미지 배치, 디자인 가이드 중심

### 레이아웃 설계

```
┌─────────────────────────────────────────────────────────────┐
│                Step 3: 레이아웃 설계                          │
├─────────────────────────────────────────────────────────────┤
│  [페이지 1] [페이지 2] [페이지 3] ... 탭                     │
├─────────────────────────────────────────────────────────────┤
│ 📄 Step2 교안 내용 (읽기 전용)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 학습목표: [Step2에서 생성된 내용]                       │ │
│ │ 핵심메시지: [Step2에서 생성된 내용]                     │ │
│ │ 교안본문: [Step2에서 생성된 내용]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🎨 레이아웃 설계 결과                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • 전체 레이아웃 컨셉: [AI 생성 설명]                    │ │
│ │ • 섹션 구성: [헤더/메인/이미지/상호작용 영역]            │ │
│ │ • 그리드 시스템: [12컬럼 기반 배치]                     │ │
│ │ • 이미지 배치: [위치, 크기, 통합 방법]                  │ │
│ │ • 디자인 가이드: [타이포그래피, 색상, 간격]             │ │
│ │ • 구현 가이드: [CSS, 반응형, 접근성]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 데이터 흐름 재설계

### 기존 데이터 흐름
```
Step1 → Step2 (비주얼만) → Step3 (콘텐츠+레이아웃) → Step4 → Step5
```

### 새로운 데이터 흐름
```
Step1 → Step2 (비주얼+교안) → Step3 (레이아웃만) → Step4 → Step5
```

### WorkflowContainer 변경사항

```typescript
// 기존
interface WorkflowState {
  step1?: ProjectData;
  step2?: { visualIdentity: VisualIdentity; designTokens: DesignTokens };
  step3?: Step3IntegratedResult;
  // ...
}

// 새로운
interface WorkflowState {
  step1?: ProjectData;
  step2?: Step2NewResult;  // 통합 결과
  step3?: Step3LayoutOnlyResult;  // 레이아웃만
  // ...
}
```

### 단계별 데이터 전달

1. **Step1 → Step2**
   ```typescript
   <Step2Integrated
     projectData={workflowState.step1}
     layoutMode={workflowState.step1.layoutMode}
     contentMode={workflowState.step1.contentMode}
     onComplete={(result) => setWorkflowState(prev => ({ ...prev, step2: result }))}
   />
   ```

2. **Step2 → Step3**
   ```typescript
   <Step3LayoutOnly
     step2Result={workflowState.step2}
     layoutMode={workflowState.step2.layoutMode}
     onComplete={(result) => setWorkflowState(prev => ({ ...prev, step3: result }))}
   />
   ```

3. **Step3 → Step4**
   ```typescript
   // Step4는 Step2의 교안 + Step3의 레이아웃을 모두 참조
   <Step4Enhancement
     step2Result={workflowState.step2}
     step3Result={workflowState.step3}
     onComplete={(result) => setWorkflowState(prev => ({ ...prev, step4: result }))}
   />
   ```

## 🎛️ 자동저장 시스템 적용

### Step2 자동저장
```typescript
// Step2IntegratedComponent에서
useEffect(() => {
  if (step2Data && isDataLoaded) {
    const currentHash = JSON.stringify(step2Data);
    if (currentHash !== lastStep2HashRef.current) {
      lastStep2HashRef.current = currentHash;
      onDataChange?.(step2Data);  // WorkflowContainer로 전달
    }
  }
}, [step2Data, onDataChange, isDataLoaded]);
```

### Step3 자동저장
```typescript
// Step3LayoutOnlyComponent에서
useEffect(() => {
  if (step3Data && isDataLoaded) {
    const currentHash = JSON.stringify(step3Data);
    if (currentHash !== lastStep3HashRef.current) {
      lastStep3HashRef.current = currentHash;
      onDataChange?.(step3Data);  // WorkflowContainer로 전달
    }
  }
}, [step3Data, onDataChange, isDataLoaded]);
```

## 🔄 GNB 아이콘 정책 적용

### Step2 생성 상태 표시
```typescript
// Step2에서 생성 중일 때
onGeneratingChange?.(isGenerating || isPageContentGenerating);

// GNB에서 받아서 처리
const step2Generating = step2GeneratingState || step2PageContentGenerating;
```

### Step3 생성 상태 표시
```typescript
// Step3에서 레이아웃 생성 중일 때
onGeneratingChange?.(isGenerating || pagesGeneratingCount > 0);

// GNB에서 받아서 처리
const step3Generating = step3GeneratingState || step3LayoutGenerating;
```

## 📱 반응형 고려사항

### Step2 교안 미리보기
- **Desktop**: 3열 그리드로 페이지 미리보기
- **Tablet**: 2열 그리드
- **Mobile**: 1열 스택, 페이지별 아코디언

### Step3 레이아웃 설계
- **Desktop**: 좌측 교안 내용, 우측 레이아웃 설계
- **Tablet**: 상하 분할
- **Mobile**: 탭으로 분리 (교안 내용 탭 / 레이아웃 설계 탭)

## 🧪 테스트 시나리오

### Step2 통합 테스트
1. **기본 생성**: 프로젝트 데이터 → 비주얼 + 교안 생성
2. **재생성**: 다시 생성 시 새로운 내용 생성
3. **자동저장**: 새로고침 후 데이터 보존
4. **교안 미리보기**: 모든 페이지 내용 표시

### Step3 레이아웃 테스트
1. **Step2 연동**: Step2 결과를 받아서 레이아웃 설계
2. **페이지별 처리**: 각 페이지별 개별 레이아웃 생성
3. **레이아웃 표시**: 섹션, 이미지, 가이드 등 표시
4. **읽기 전용**: Step2 교안 내용 수정 불가

### 통합 테스트
1. **전체 워크플로우**: Step1 → Step2 → Step3 연속 진행
2. **데이터 무결성**: 각 단계 간 데이터 정확한 전달
3. **성능**: 각 단계별 적절한 로딩 시간
4. **오류 처리**: API 실패 시 폴백 처리

## 📋 구현 체크리스트

### Phase 1: 백엔드 (완료)
- [x] Step2NewResult 타입 정의
- [x] Step2IntegratedService 구현
- [x] Step2ResponseParser 구현
- [x] Step3LayoutOnlyResult 타입 정의
- [x] Step3LayoutOnlyService 구현
- [x] Step3LayoutResponseParser 구현

### Phase 2: UI 컴포넌트
- [ ] Step2VisualIdentity → Step2Integrated 확장
- [ ] 교안 미리보기 섹션 추가
- [ ] Step3EducationalDesign → Step3LayoutOnly 단순화
- [ ] WorkflowContainer 데이터 흐름 수정

### Phase 3: 통합 및 테스트
- [ ] 자동저장 시스템 적용
- [ ] GNB 아이콘 정책 적용
- [ ] 반응형 디자인 적용
- [ ] 전체 워크플로우 테스트
- [ ] 성능 최적화

## 🚀 배포 전략

### 1. 점진적 배포
- 기존 컴포넌트와 병렬 운영
- 플래그를 통한 새 버전 활성화
- 사용자 피드백 수집

### 2. 데이터 마이그레이션
- 기존 Step2 데이터 → 새 형식 변환
- 기존 Step3 데이터 → 새 형식 변환
- 호환성 유지 기간 설정

### 3. 성능 모니터링
- 각 단계별 생성 시간 측정
- API 호출 성공률 모니터링
- 사용자 만족도 조사

이 설계를 통해 Step2는 더 풍부한 교안 콘텐츠를, Step3는 더 전문적인 레이아웃 설계를 제공할 수 있게 됩니다.