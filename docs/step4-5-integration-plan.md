# Step4-5 통합 설계서

## 📋 개요

**목표**: Step4(디자인 명세)와 Step5(최종 프롬프트)를 통합하여 사용자 경험을 개선하고 시스템을 단순화

**현재 상태**: 5단계 → **목표**: 4단계
- Step1 (기본정보) → Step2 (비주얼) → Step3 (교육설계) → **새로운 Step4 (최종결과)**

---

## 🔍 현재 분석 결과

### **Step4의 실제 역할**
```json
{
  "AI 생성": ["animationDescription", "interactionDescription"],
  "하드코딩": ["layout", "componentStyles", "imagePlacements", "interactions"],
  "실제 사용": "애니메이션/인터랙션 텍스트 2개만"
}
```

### **Step5의 실제 역할**
```json
{
  "역할": "모든 단계 데이터를 최종 개발자 프롬프트로 통합",
  "Step4 의존성": "animationDescription, interactionDescription만 사용",
  "핵심 기능": "compileHTMLPrompt() 함수"
}
```

### **핵심 발견**
- **Step4의 복잡한 구조화 데이터**: 실제로 사용되지 않음
- **Step3 파싱 로직**: 빈 배열만 처리하는 무의미한 코드
- **성능**: Step4 제거해도 AI 호출 감소 없음 (Step5는 AI 호출 안함)
- **사용자 경험**: 불필요한 중간 단계로 인한 플로우 복잡성

---

## 🎯 통합 설계

### **1. 새로운 플로우**
```
Before: Step1 → Step2 → Step3 → Step4 → Step5
After:  Step1 → Step2 → Step3 → Step4(통합됨)
```

### **2. 새로운 Step4 (구 Step5 + Step4 일부)**

#### **입력**
- `projectData` (Step1)
- `visualIdentity` (Step2)
- `step3Result` (Step3)
- `apiKey`

#### **처리 과정**
1. **애니메이션/인터랙션 생성** (구 Step4 로직)
   - AI 호출하여 `animationDescription`, `interactionDescription` 생성

2. **최종 프롬프트 컴파일** (구 Step5 로직)
   - 모든 데이터를 통합하여 `htmlPrompt` 생성

#### **출력**
```typescript
interface IntegratedStep4Result {
  // 최종 프롬프트 (주요 결과물)
  htmlPrompt: string;

  // 생성된 애니메이션/인터랙션 (중간 결과물)
  animationDescriptions: Record<number, string>;  // 페이지별
  interactionDescriptions: Record<number, string>; // 페이지별

  // 메타데이터
  generatedAt: Date;
  totalPages: number;
}
```

### **3. UI 변경사항**

#### **새로운 Step4 화면 구성**
```
1. 상단: "최종 명세서 생성" 타이틀
2. 생성 중: 통합 로딩 (애니메이션 생성 → 프롬프트 컴파일)
3. 완료 후: Step5와 동일한 UI (프롬프트 미리보기 + 복사)
```

#### **로딩 단계**
```
Phase 1: 애니메이션/인터랙션 디자인 (30%)
Phase 2: 최종 프롬프트 컴파일 (70%)
Phase 3: 완료 (100%)
```

---

## 📁 파일 변경 계획

### **🗑️ 제거할 파일들**
```
src/components/workflow/Step4DesignSpecification/
├── Step4DesignSpecification.tsx     ❌ 제거
└── index.ts                         ❌ 제거

src/services/
├── step4-design-specification.service.ts  ❌ 제거

src/types/
├── step4.types.ts                   ❌ 제거 (일부 타입은 이동)
```

### **📝 수정할 파일들**

#### **1. Step5 → 새로운 Step4로 변환**
```
src/components/workflow/Step5FinalPrompt/
├── Step5FinalPrompt.tsx → Step4IntegratedResult.tsx
└── index.ts → 업데이트
```

#### **2. 워크플로우 컨테이너**
```
src/components/workflow/WorkflowContainer.tsx
- step4 상태 제거
- step3Complete → 직접 새로운step4로 이동
- 핸들러 함수들 수정
```

#### **3. GNB 네비게이션**
```
src/components/common/GNB.tsx
- 5단계 → 4단계로 아이콘 조정
- Step4, Step5 아이콘 통합
```

#### **4. 타입 정의**
```
src/types/workflow.types.ts
- Step4DesignResult 제거
- 새로운 IntegratedStep4Result 추가
- WorkflowState 업데이트
```

#### **5. 서비스 레이어**
```
새로 생성: src/services/integrated-step4.service.ts
- Step4의 애니메이션 생성 로직 이동
- Step5의 프롬프트 컴파일 로직 이동
- 통합 서비스 클래스 생성
```

---

## 🔧 구현 단계

### **Phase 1: 서비스 레이어 통합**
1. ✅ Step4 코드 정리 (완료)
2. 🔄 `IntegratedStep4Service` 생성
3. 🔄 애니메이션 생성 로직 이식
4. 🔄 프롬프트 컴파일 로직 이식
5. 🔄 통합 테스트

### **Phase 2: 컴포넌트 통합**
1. 🔄 `Step4IntegratedResult.tsx` 생성
2. 🔄 UI 컴포넌트 통합 (로딩 + 결과 표시)
3. 🔄 상태 관리 로직 통합

### **Phase 3: 워크플로우 업데이트**
1. 🔄 `WorkflowContainer.tsx` 수정
2. 🔄 GNB 네비게이션 업데이트
3. 🔄 타입 정의 업데이트

### **Phase 4: 정리 및 테스트**
1. 🔄 구 Step4 파일들 제거
2. 🔄 통합 테스트
3. 🔄 문서 업데이트

---

## ⚠️ 주의사항 및 위험요소

### **데이터 호환성**
- **기존 저장된 워크플로우 데이터**: 마이그레이션 로직 필요
- **Step4 결과를 참조하는 코드**: 모두 찾아서 수정 필요

### **사용자 경험**
- **진행률 표시**: 2단계 통합으로 인한 로딩 경험 변경
- **에러 처리**: 통합 과정에서 부분 실패 시나리오 고려

### **코드 안정성**
- **Step4 타입 의존성**: 다른 파일에서 import하는 곳 모두 수정
- **자동저장 시스템**: Step4 데이터 구조 변경에 따른 호환성

---

## 📊 예상 효과

### **긍정적 효과**
- **사용자 경험**: 더 직관적이고 빠른 플로우
- **코드 품질**: 불필요한 복잡성 제거
- **유지보수**: 더 단순한 아키텍처
- **성능**: 중간 상태 저장 감소

### **비용**
- **마이그레이션 작업**: 기존 데이터 호환성 작업 필요
- **테스트**: 통합 후 전체 플로우 재검증 필요
- **사용자 적응**: 기존 사용자의 플로우 변경 적응

---

## 🎯 성공 지표

### **기능적 지표**
- [ ] Step3 완료 후 바로 최종 프롬프트 생성
- [ ] 애니메이션/인터랙션 텍스트 정상 생성
- [ ] 최종 프롬프트 품질 기존과 동일
- [ ] 자동저장 시스템 정상 작동

### **성능 지표**
- [ ] 전체 플로우 완료 시간 단축
- [ ] 불필요한 상태 저장 제거
- [ ] 메모리 사용량 감소

### **사용자 경험 지표**
- [ ] 단계 수 감소: 5단계 → 4단계
- [ ] 중간 대기 시간 제거
- [ ] 더 직관적인 진행률 표시

---

## 다음 단계

1. **승인 후**: Phase 1부터 단계별 구현 시작
2. **각 Phase 완료 시**: 기능 테스트 및 검증
3. **최종 완료 시**: 전체 플로우 통합 테스트

이 설계서에 대한 피드백이나 수정사항이 있으면 말씀해 주세요.