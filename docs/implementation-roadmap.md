# Step2 재설계 구현 로드맵 및 마이그레이션 전략

## 🎯 전체 개요

Step2 redesign 문서에 따른 구체적인 구현 로드맵과 안전한 마이그레이션 전략을 제시합니다.

## 📅 3단계 구현 계획

### Phase 1: 백엔드 서비스 구현 (3-4일) ✅ 완료
- [x] 새로운 타입 정의 (step2-new.types.ts, step3-layout-only.types.ts)
- [x] Step2IntegratedService 구현
- [x] Step2ResponseParser 구현
- [x] Step3LayoutOnlyService 구현
- [x] Step3LayoutResponseParser 구현
- [x] 폴백 및 에러 처리 시스템

### Phase 2: UI 컴포넌트 개발 (5-6일)
- [ ] Step2Integrated 컴포넌트 개발
- [ ] Step3LayoutOnly 컴포넌트 개발
- [ ] WorkflowContainer 데이터 흐름 수정
- [ ] 자동저장 시스템 적용
- [ ] GNB 아이콘 정책 적용

### Phase 3: 통합 및 배포 (3-4일)
- [ ] 전체 워크플로우 테스트
- [ ] 성능 최적화
- [ ] 데이터 마이그레이션 도구
- [ ] 점진적 롤아웃
- [ ] 모니터링 및 피드백 수집

## 🔧 Phase 2 상세 구현 계획

### 2.1 Step2Integrated 컴포넌트 (2일)

#### Day 1: 기본 구조 및 비주얼 아이덴티티 부분
```typescript
// 파일: src/components/workflow/Step2Integrated/Step2Integrated.tsx
interface Step2IntegratedProps {
  initialData?: Step2NewResult;
  projectData: ProjectData;
  apiKey: string;
  onComplete?: (data: Step2NewResult) => void;
  onDataChange?: (data: Step2NewResult) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}
```

**구현 목표**:
- [x] 기존 Step2VisualIdentity 복사 및 이름 변경
- [ ] Props 인터페이스 변경
- [ ] Step2IntegratedService 연동
- [ ] 기존 3개 카드 (무드&톤, 컬러팔레트, 타이포그래피) 유지
- [ ] 컴포넌트 스타일 카드 유지

#### Day 2: 교안 미리보기 섹션 추가
**구현 목표**:
- [ ] 페이지별 교안 미리보기 섹션 추가
- [ ] 탭 네비게이션으로 페이지 선택
- [ ] 각 페이지별 학습목표, 핵심메시지, 교안본문, 이미지설명, 상호작용 표시
- [ ] 반응형 디자인 적용 (Desktop 3열, Tablet 2열, Mobile 1열)

### 2.2 Step3LayoutOnly 컴포넌트 (2일)

#### Day 1: 기본 구조 및 데이터 표시
```typescript
// 파일: src/components/workflow/Step3LayoutOnly/Step3LayoutOnly.tsx
interface Step3LayoutOnlyProps {
  initialData?: Step3LayoutOnlyResult;
  step2Result: Step2NewResult;
  apiKey: string;
  onComplete?: (data: Step3LayoutOnlyResult) => void;
  onDataChange?: (data: Step3LayoutOnlyResult) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}
```

**구현 목표**:
- [ ] 새로운 컴포넌트 생성
- [ ] Step3LayoutOnlyService 연동
- [ ] Step2 교안 내용 읽기 전용 표시
- [ ] 페이지별 탭 네비게이션

#### Day 2: 레이아웃 설계 결과 표시
**구현 목표**:
- [ ] 레이아웃 구조 시각화
- [ ] 섹션별 구성 표시
- [ ] 이미지 배치 가이드 표시
- [ ] 디자인 가이드 및 구현 가이드 표시
- [ ] 페이지별 개별 재생성 기능

### 2.3 WorkflowContainer 수정 (1일)

**구현 목표**:
- [ ] WorkflowState 타입 변경
- [ ] Step2 → Step3 데이터 전달 로직 수정
- [ ] 자동저장 로직 적용
- [ ] 단계별 완료 검증 로직 수정

### 2.4 통합 테스트 및 UI 폴리싱 (1일)

**구현 목표**:
- [ ] 전체 워크플로우 테스트
- [ ] UI/UX 개선
- [ ] 로딩 상태 및 에러 처리 개선
- [ ] 반응형 디자인 검증

## 🔄 안전한 마이그레이션 전략

### 전략 1: 점진적 롤아웃 (권장)

#### 1단계: 기능 플래그 도입
```typescript
// 환경변수 또는 설정으로 제어
const USE_NEW_STEP2_STEP3 = process.env.REACT_APP_NEW_STEP2_STEP3 === 'true';

// WorkflowContainer에서 조건부 렌더링
{currentStep === 2 && (
  USE_NEW_STEP2_STEP3 ? (
    <Step2Integrated {...step2Props} />
  ) : (
    <Step2VisualIdentity {...step2Props} />
  )
)}
```

#### 2단계: 베타 사용자 대상 테스트
- 내부 팀 먼저 새 버전 사용
- 피드백 수집 및 개선사항 반영
- 안정성 검증

#### 3단계: 전체 사용자 배포
- 기능 플래그를 통해 점진적 활성화 (10% → 50% → 100%)
- 실시간 모니터링
- 문제 발생 시 즉시 롤백

### 전략 2: 데이터 호환성 유지

#### 기존 데이터 변환 유틸리티
```typescript
// 파일: src/utils/data-migration.ts
export function migrateStep2Data(
  oldData: { visualIdentity: VisualIdentity; designTokens: DesignTokens }
): Step2NewResult {
  return {
    visualIdentity: oldData.visualIdentity,
    designTokens: oldData.designTokens,
    pageContents: [], // 빈 배열로 초기화, 재생성 필요
    overallFlow: '',
    educationalStrategy: '',
    generatedAt: new Date()
  };
}

export function migrateStep3Data(
  oldData: Step3IntegratedResult
): Step3LayoutOnlyResult {
  return {
    layoutMode: oldData.layoutMode,
    pages: oldData.pages.map(page => ({
      pageId: page.pageId,
      pageTitle: page.pageTitle,
      pageNumber: page.pageNumber,
      textContent: {
        fullTextContent: '',
        learningGoal: '',
        keyMessage: '',
        imageDescription: '',
        interactionHint: ''
      },
      layoutStructure: {
        concept: '기존 데이터에서 변환됨',
        sections: [],
        gridSystem: '12컬럼 그리드',
        spacingStrategy: '일관된 간격'
      },
      // ... 기본값으로 초기화
    })),
    designTokens: oldData.designTokens || getDefaultDesignTokens(),
    generatedAt: new Date()
  };
}
```

#### 자동저장 데이터 변환
```typescript
// useAutoSave 훅에서 데이터 로드 시 자동 변환
const loadWorkflowData = useCallback(() => {
  const savedData = localStorage.getItem('workflow-state');
  if (savedData) {
    const parsed = JSON.parse(savedData);

    // 기존 형식 감지 및 변환
    if (parsed.step2 && !parsed.step2.pageContents) {
      parsed.step2 = migrateStep2Data(parsed.step2);
    }

    if (parsed.step3 && !parsed.step3.pages[0].textContent) {
      parsed.step3 = migrateStep3Data(parsed.step3);
    }

    return parsed;
  }
  return null;
}, []);
```

## 📊 모니터링 및 성능 지표

### 핵심 지표

#### 1. 생성 성능
- **Step2 통합 생성 시간**: 목표 < 30초 (현재 비주얼만: ~15초)
- **Step3 레이아웃 생성 시간**: 목표 < 15초 (현재 전체: ~60초)
- **전체 워크플로우 시간**: 목표 < 3분 (현재: ~5분)

#### 2. 성공률
- **Step2 파싱 성공률**: 목표 > 95%
- **Step3 파싱 성공률**: 목표 > 90%
- **전체 완주율**: 목표 > 85%

#### 3. 사용자 만족도
- **교안 품질 만족도**: 설문 조사
- **레이아웃 적절성**: 사용자 피드백
- **워크플로우 효율성**: 완료 시간 및 재생성 횟수

### 모니터링 구현

#### 로그 수집
```typescript
// 파일: src/utils/analytics.ts
export function trackStep2Generation(
  projectData: ProjectData,
  result: Step2NewResult,
  duration: number,
  success: boolean
) {
  console.log('Step2 Generation:', {
    pageCount: projectData.pages.length,
    contentMode: projectData.contentMode,
    layoutMode: projectData.layoutMode,
    duration,
    success,
    contentLength: result.pageContents.reduce((sum, page) => sum + page.fullTextContent.length, 0)
  });
}

export function trackStep3Layout(
  step2Result: Step2NewResult,
  result: Step3LayoutOnlyResult,
  duration: number,
  success: boolean
) {
  console.log('Step3 Layout:', {
    pageCount: step2Result.pageContents.length,
    layoutMode: result.layoutMode,
    duration,
    success,
    sectionsGenerated: result.pages.reduce((sum, page) => sum + page.layoutStructure.sections.length, 0)
  });
}
```

#### 대시보드 지표
- 일별/주별 생성 건수
- 평균 생성 시간 추이
- 오류율 및 오류 유형
- 사용자 피드백 점수

## 🛡️ 리스크 관리

### 주요 리스크 및 대응방안

#### 1. AI 응답 품질 저하
**리스크**: 새로운 프롬프트로 인한 응답 품질 하락
**대응방안**:
- 충분한 프롬프트 테스트
- 폴백 시스템 강화
- 단계적 프롬프트 개선

#### 2. 성능 저하
**리스크**: 복합적인 생성으로 인한 처리 시간 증가
**대응방안**:
- 병렬 처리 가능한 부분 식별
- 캐싱 전략 도입
- 적응적 타임아웃 설정

#### 3. 사용자 혼란
**리스크**: 새로운 UI/워크플로우로 인한 사용자 혼란
**대응방안**:
- 점진적 배포로 적응 시간 제공
- 명확한 가이드 및 도움말 제공
- 피드백 채널 운영

#### 4. 데이터 호환성 문제
**리스크**: 기존 프로젝트 데이터 손실 또는 오류
**대응방안**:
- 자동 마이그레이션 도구 개발
- 백업 및 복구 시스템
- 롤백 계획 수립

## 📝 체크리스트 및 검증 시나리오

### Phase 2 완료 조건

#### Step2Integrated 컴포넌트
- [ ] 기존 비주얼 아이덴티티 표시 정상 작동
- [ ] 새로운 교안 미리보기 섹션 표시
- [ ] 모든 페이지의 교안 내용 표시
- [ ] 반응형 디자인 적용
- [ ] 자동저장 시스템 정상 작동
- [ ] 재생성 기능 정상 작동

#### Step3LayoutOnly 컴포넌트
- [ ] Step2 데이터 정상 연동
- [ ] 교안 내용 읽기 전용 표시
- [ ] 레이아웃 설계 결과 표시
- [ ] 페이지별 개별 처리
- [ ] 디버그 모드 지원

#### 통합 테스트
- [ ] Step1 → Step2 → Step3 전체 플로우
- [ ] 새로고침 후 데이터 보존
- [ ] 오류 발생 시 적절한 폴백
- [ ] 모든 브라우저에서 정상 작동

### 배포 전 최종 검증

#### 기능 검증
- [ ] 모든 테스트 케이스 통과
- [ ] 성능 지표 목표치 달성
- [ ] 사용자 시나리오 검증 완료

#### 안정성 검증
- [ ] 부하 테스트 통과
- [ ] 메모리 누수 없음
- [ ] 장시간 운영 안정성 확인

#### 사용자 경험 검증
- [ ] UI/UX 검토 완료
- [ ] 접근성 가이드라인 준수
- [ ] 모바일 사용성 검증

이 로드맵을 통해 안전하고 체계적으로 Step2 재설계를 구현할 수 있습니다. 특히 점진적 배포와 철저한 테스트를 통해 사용자에게 미치는 영향을 최소화하면서 새로운 기능을 제공할 수 있습니다.