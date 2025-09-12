# 자동 저장 시스템 (Auto-Save System)

## 📋 개요

이 프로젝트는 **2계층 자동 저장 시스템**을 사용하여 사용자의 작업을 안전하게 보호합니다.

## 🏗️ 아키텍처

### 1. 저장 계층

```
📦 localStorage 기반 저장
├── 📄 프로젝트 메타데이터 (Project)
│   ├── id, name, createdAt, updatedAt
│   ├── apiKey, currentStep
│   └── generatedPrompt
└── 📊 워크플로우 데이터 (WorkflowState) 
    ├── step1: ProjectData (기본 정보)
    ├── step2: VisualIdentity (비주얼 아이덴티티)
    ├── step3: LayoutProposal[] (레이아웃 제안)
    ├── step4: PageEnhancement[] (콘텐츠 개선)
    ├── step5: FinalPrompt (최종 프롬프트)
    ├── currentStep: number
    └── stepCompletion: Record<step, boolean>
```

### 2. 자동 저장 훅 (useAutoSave)

```typescript
const { forceSave } = useAutoSave(currentProject, workflowData, {
  enabled: true,
  interval: 10000, // 10초마다 자동 저장
  immediate: true, // 변경 시 즉시 저장 (0.5초 디바운스)
  onSave: (project, workflow) => { /* 저장 완료 시 콜백 */ },
  onError: (error) => { /* 에러 처리 */ }
});
```

## 🔧 핵심 기능

### 1. 스마트 변경 감지
- **데이터 해시**: JSON.stringify로 변경 사항 감지
- **중복 저장 방지**: 동일한 데이터는 저장하지 않음
- **디바운스**: 0.5초 내 연속 변경 시 마지막 것만 저장

### 2. 브라우저 최적화
- **탭 가시성 감지**: 비활성 탭에서는 저장 일시 중지
- **페이지 이탈 감지**: beforeunload 시 마지막 저장 시도
- **메모리 관리**: interval 자동 정리

### 3. 프로젝트 제목 동기화
- **실시간 동기화**: Step1에서 입력한 제목이 즉시 프로젝트 이름으로 반영
- **GNB 업데이트**: 상단 네비게이션의 프로젝트 이름도 자동 갱신

### 4. 새로고침 데이터 보존
- **완벽한 상태 복원**: 새로고침(F5) 후에도 모든 입력 데이터가 그대로 유지
- **Step별 진행상태 보존**: 현재 진행 중인 Step과 완료된 Step 정보 복원
- **실시간 데이터 동기화**: initialData 변경 시 즉시 컴포넌트 상태 업데이트

## 💾 저장 시점

1. **즉시 저장**: 사용자 입력 후 0.5초 디바운스
2. **정기 저장**: 10초마다 변경 사항 확인 후 저장
3. **단계 완료**: 각 Step 완료 시 즉시 저장
4. **페이지 이탈**: 브라우저 종료/새로고침 시 마지막 저장

## 🔍 로깅 시스템

```
🔄 WorkflowContainer: 워크플로우 데이터 로딩 시작, projectId: project_xxx
✅ 저장된 워크플로우 데이터 복원: { step1: {...}, currentStep: 2 }
📋 Step1BasicInfo에 전달할 초기 데이터: { projectTitle: "React 강의", ... }
📝 Step1 실시간 데이터 변경 알림: { projectTitle: "...", isDataLoaded: true }
💾 자동 저장됨: { project: "React 강의", step: "course-input", workflowStep: 1 }
🏷️ 프로젝트 제목 동기화: 새 프로젝트 → React 기초 강의
📝 새로운 워크플로우 시작 - 저장된 데이터 없음
🕒 자동 저장 활성화 - 10초 간격
🛑 자동 저장 정리됨
```

## 📝 개발 규칙

### 1. 새 Step 컴포넌트 개발 시 (새로고침 대응)

```typescript
// ✅ 올바른 방식 - 새로고침 데이터 보존 대응
const Step2Example = ({ initialData, onComplete, onDataChange }) => {
  const [step2Data, setStep2Data] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // initialData가 변경될 때마다 상태 업데이트 (새로고침 대응)
  useEffect(() => {
    if (initialData) {
      setStep2Data(initialData);
      setIsDataLoaded(true);
    }
  }, [initialData]);

  // 실시간 데이터 변경 알림
  useEffect(() => {
    if (isDataLoaded && onDataChange) {
      const timeoutId = setTimeout(() => {
        onDataChange(step2Data);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [step2Data, isDataLoaded, onDataChange]);

  const handleComplete = (data) => {
    onComplete(data);
  };

  return (
    <div>
      {/* Step2 UI */}
    </div>
  );
};
```

### 2. WorkflowContainer에서 Step 데이터 처리

```typescript
const handleStep2Complete = (data) => {
  const newWorkflowData = { 
    ...workflowData, 
    step2: data, 
    currentStep: 3,
    stepCompletion: { ...workflowData.stepCompletion, step2: true }
  };
  
  setWorkflowData(newWorkflowData);
  setCurrentStep(3);
  
  // 🔄 자동 저장을 위해 부모에게 알림
  onWorkflowDataChange?.(newWorkflowData);
};
```

### 3. 데이터 타입 정의

```typescript
// types/workflow.types.ts에 추가
export interface Step2Data {
  visualIdentity: VisualIdentity;
  colorPalette: ColorPalette;
  typography: Typography;
}

// WorkflowState에 추가
export interface WorkflowState {
  step2?: Step2Data;
  // ...
}
```

## 🚨 주의사항

### 1. localStorage 용량 제한
- **제한**: 브라우저마다 5-10MB
- **대응**: 큰 데이터(이미지 등)는 Base64 대신 URL 사용
- **모니터링**: 저장 실패 시 에러 로깅

### 2. 타입 안전성
- **모든 Step 데이터**는 `WorkflowState` 인터페이스에 정의
- **JSON 직렬화 가능**한 데이터만 저장
- **Date 객체**는 ISO 문자열로 변환 후 복원

### 3. 성능 고려사항
- **과도한 저장 방지**: 해시 기반 변경 감지
- **메모리 누수 방지**: useEffect cleanup 필수
- **UI 블로킹 방지**: 비동기 저장
- **무한루프 방지**: useEffect dependency 최적화
- **불필요한 리렌더링 방지**: isDataLoaded 상태 활용

## 🔄 복원 시스템

### 1. WorkflowContainer 데이터 로딩

```typescript
// 프로젝트 ID 변경 시에만 데이터 로드 (무한루프 방지)
useEffect(() => {
  const loadWorkflowData = async () => {
    console.log('🔄 WorkflowContainer: 워크플로우 데이터 로딩 시작');
    const savedWorkflowData = projectService.loadWorkflowData(projectId);
    
    if (savedWorkflowData) {
      console.log('✅ 저장된 워크플로우 데이터 복원:', savedWorkflowData);
      setWorkflowData(savedWorkflowData);
      setCurrentStep(savedWorkflowData.currentStep || 1);
      onWorkflowDataChange?.(savedWorkflowData);
    }
  };
  loadWorkflowData();
}, [projectId]); // onWorkflowDataChange 제거로 무한루프 방지
```

### 2. Step별 데이터 복원 (개선됨)

```typescript
// ❌ 잘못된 방식 - 새로고침 시 데이터 손실
const Step1BasicInfo = ({ initialData }) => {
  const [formData, setFormData] = useState(initialData || defaultValues);
};

// ✅ 올바른 방식 - 새로고침 대응
const Step1BasicInfo = ({ initialData }) => {
  const [formData, setFormData] = useState('');
  
  // initialData 변경 시 상태 업데이트 (새로고침 대응)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
};
```

## 🎯 개발자 체크리스트

새로운 Step을 개발할 때 반드시 확인:

- [ ] Step 데이터 타입을 `WorkflowState`에 정의했는가?
- [ ] `onComplete` 콜백으로 데이터를 부모에게 전달하는가?
- [ ] `onDataChange` 콜백으로 실시간 변경사항을 전달하는가?
- [ ] `WorkflowContainer`에서 해당 Step 완료 핸들러를 추가했는가?
- [ ] `initialData` 변경 시 컴포넌트 상태가 업데이트되는가?
- [ ] `isDataLoaded` 상태로 데이터 로딩 완료를 추적하는가?
- [ ] 새로고침 테스트: 데이터 입력 → F5 → 데이터 보존 확인?
- [ ] 개발자 도구에서 자동 저장 로그가 정상적으로 출력되는가?

## 💡 디버깅 팁

### 1. 자동 저장 확인
```javascript
// 개발자 도구 Console에서 확인
localStorage.getItem('promptgen_workflows')
localStorage.getItem('promptgen_projects')
```

### 2. 새로고침 데이터 보존 테스트
```javascript
// 테스트 순서:
// 1. Step1에서 데이터 입력
// 2. F5 또는 Ctrl+R로 새로고침
// 3. 콘솔에서 다음 로그 확인:
console.log 필터: "✅ 저장된 워크플로우 데이터 복원"
console.log 필터: "📋 Step1BasicInfo에 전달할 초기 데이터"
```

### 3. 저장 상태 모니터링
```javascript
// 저장 로그 필터링
console.log 필터: "💾 자동 저장"
console.log 필터: "🔄 WorkflowContainer"
```

### 4. 강제 저장 테스트
```typescript
// 컴포넌트에서 강제 저장 실행
const { forceSave } = useAutoSave(/* ... */);
forceSave(); // 테스트용
```

## 🚨 중요한 개선사항 (2024.09.13 업데이트)

### 해결된 문제들:
1. **✅ 과도한 콘솔 로그**: WorkflowContainer useEffect 무한루프 해결
2. **✅ 새로고침 시 데이터 삭제**: initialData 변경 감지로 상태 복원 구현
3. **✅ 다음 단계 버튼 미동작**: Step2, Step3 임시 컴포넌트 구현으로 완전한 플로우 테스트 가능

### 핵심 수정사항:
- `WorkflowContainer.tsx`: useEffect dependency에서 `onWorkflowDataChange` 제거
- `Step1BasicInfo.tsx`: `initialData` 변경 시 상태 업데이트 로직 추가
- `isDataLoaded` 상태로 데이터 로딩 완료 추적
- 실시간 데이터 변경 알림 최적화

## 📚 관련 파일

- `src/hooks/useAutoSave.ts`: 자동 저장 훅
- `src/services/project.service.ts`: 프로젝트 데이터 관리
- `src/components/workflow/WorkflowContainer.tsx`: 워크플로우 상태 관리
- `src/types/workflow.types.ts`: 워크플로우 타입 정의

---

**⚠️ 중요**: 이 자동 저장 시스템은 모든 Step에서 일관되게 작동해야 합니다. **특히 새로고침 데이터 보존 기능**을 위해 새로운 Step을 구현할 때는 반드시 이 가이드를 따라주세요.