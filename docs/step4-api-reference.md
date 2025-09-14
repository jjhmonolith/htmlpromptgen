# Step4 API 참조 문서

> **Version**: 1.0.0
> **Last Updated**: 2025-09-14

## 📋 목차

1. [메인 서비스 API](#메인-서비스-api)
2. [Engine 클래스 API](#engine-클래스-api)
3. [타입 정의](#타입-정의)
4. [사용 예시](#사용-예시)
5. [에러 핸들링](#에러-핸들링)

---

## 🔧 메인 서비스 API

### Step4DesignSpecificationService

교육용 HTML 교안을 위한 정밀한 디자인 명세 생성 서비스

#### Constructor

```typescript
constructor(private openAIService: OpenAIService)
```

**파라미터**:
- `openAIService`: OpenAI API 서비스 인스턴스

#### 메인 메서드

##### generateDesignSpecification()

Step3 결과를 받아 정밀한 디자인 명세 생성

```typescript
async generateDesignSpecification(
  projectData: ProjectData,
  visualIdentity: VisualIdentity,
  step3Result: Step3IntegratedResult
): Promise<Step4DesignResult>
```

**파라미터**:
- `projectData`: 프로젝트 기본 정보
- `visualIdentity`: Step2 비주얼 아이덴티티
- `step3Result`: Step3 통합 디자인 결과

**반환값**: `Step4DesignResult` - 구현 가능한 디자인 명세

**예외**:
- `Step4GenerationError`: 디자인 명세 생성 실패
- `Step4ValidationError`: 입력 데이터 유효성 검증 실패

**사용 예시**:
```typescript
const step4Service = new Step4DesignSpecificationService(openAIService);

try {
  const designSpec = await step4Service.generateDesignSpecification(
    projectData,
    visualIdentity,
    step3Result
  );

  console.log('생성된 페이지 수:', designSpec.pages.length);
  console.log('완료된 페이지:', designSpec.pages.filter(p => p.isComplete).length);
} catch (error) {
  if (error instanceof Step4GenerationError) {
    console.error('생성 실패:', error.message);
  }
}
```

##### regeneratePage()

개별 페이지 재생성

```typescript
async regeneratePage(
  result: Step4DesignResult,
  pageIndex: number,
  projectData: ProjectData,
  visualIdentity: VisualIdentity,
  step3PageData: any
): Promise<void>
```

**파라미터**:
- `result`: Step4 결과 객체
- `pageIndex`: 재생성할 페이지 인덱스 (0부터 시작)
- `projectData`: 프로젝트 데이터
- `visualIdentity`: 비주얼 아이덴티티
- `step3PageData`: Step3 페이지 데이터

**반환값**: `void` (result 객체가 직접 수정됨)

**사용 예시**:
```typescript
// 첫 번째 페이지 재생성
await step4Service.regeneratePage(
  designResult,
  0,
  projectData,
  visualIdentity,
  step3Result.pages[0]
);

console.log('페이지 재생성 완료');
```

---

## ⚙️ Engine 클래스 API

### PromptEngine

AI 프롬프트 생성 엔진

#### generatePagePrompt()

페이지별 Step4 프롬프트 생성

```typescript
generatePagePrompt(
  step3PageData: any,
  projectData: ProjectData,
  visualIdentity: VisualIdentity
): string
```

**반환값**: 최적화된 AI 프롬프트 문자열

**특징**:
- 레이아웃 모드별 특화 전략 적용
- 교육 컨텐츠 특화 지시사항 포함
- 99%+ 파싱 성공률을 위한 구조화된 출력 형식

### ParsingEngine

라인 기반 파싱 엔진

#### parseStep4Response()

AI 응답을 구조화된 데이터로 파싱

```typescript
parseStep4Response(content: string): {
  layout: LayoutSpecification;
  componentStyles: ComponentStyleSpecification[];
  imagePlacements: ImagePlacementSpecification[];
  interactions: InteractionSpecification[];
  educationalFeatures: EducationalFeature[];
}
```

**파라미터**:
- `content`: AI 응답 텍스트 (BEGIN_S4...END_S4 형식)

**반환값**: 파싱된 페이지 결과 객체

**예외**:
- `Step4ParsingError`: 파싱 실패 시

### ValidationEngine

품질 검증 엔진

#### validate()

Step4 전체 결과 검증

```typescript
validate(step4Result: Step4DesignResult): ValidationResult
```

**검증 항목**:
1. 필수 요소 검증
2. 레이아웃 제약 검증
3. CSS 속성값 유효성 검증
4. 구현 가능성 검증
5. 접근성 검증
6. 교육적 효과성 검증

#### validatePage()

개별 페이지 검증

```typescript
validatePage(
  pageResult: Step4PageResult,
  layoutMode: 'fixed' | 'scrollable'
): ValidationResult
```

### LayoutRefinementEngine

레이아웃 정밀화 엔진

#### refineLayout()

Step3 섹션을 정밀한 레이아웃 명세로 변환

```typescript
refineLayout(
  step3Sections: Step3Section[],
  layoutMode: 'fixed' | 'scrollable'
): LayoutSpecification
```

### StyleSpecificationEngine

스타일 구체화 엔진

#### specifyComponentStyles()

컴포넌트 스타일 구체화

```typescript
specifyComponentStyles(
  components: ComponentLine[],
  visualIdentity: VisualIdentity,
  designTokens: DesignTokens,
  layoutMode: 'fixed' | 'scrollable'
): ComponentStyleSpecification[]
```

### InteractionDesignEngine

상호작용 디자인 엔진

#### generateInteractions()

컴포넌트별 인터랙션 생성

```typescript
generateInteractions(
  components: ComponentStyleSpecification[],
  layoutMode: 'fixed' | 'scrollable'
): InteractionSpecification[]
```

#### generateProgressInteractions()

진행 상태 인터랙션 생성

```typescript
generateProgressInteractions(
  totalPages: number,
  currentPage: number
): InteractionSpecification[]
```

### EducationalFeatureEngine

교육적 기능 엔진

#### generateEducationalFeatures()

교육적 기능 생성

```typescript
generateEducationalFeatures(
  pageNumber: number,
  totalPages: number,
  layoutMode: 'fixed' | 'scrollable',
  components: ComponentStyleSpecification[]
): EducationalFeature[]
```

---

## 📊 타입 정의

### 핵심 결과 타입

#### Step4DesignResult

```typescript
interface Step4DesignResult {
  /** 레이아웃 모드 */
  layoutMode: 'fixed' | 'scrollable';
  /** 페이지별 디자인 명세 */
  pages: Step4PageResult[];
  /** 전역 기능 (진행바, 접근성 등) */
  globalFeatures: GlobalFeature[];
  /** 생성 완료 시각 */
  generatedAt: Date;
}
```

#### Step4PageResult

```typescript
interface Step4PageResult {
  // 기본 정보
  pageId: string;
  pageTitle: string;
  pageNumber: number;

  // 디자인 명세
  layout: LayoutSpecification;
  componentStyles: ComponentStyleSpecification[];
  imagePlacements: ImagePlacementSpecification[];
  interactions: InteractionSpecification[];
  educationalFeatures: EducationalFeature[];

  // 상태 관리
  isGenerating?: boolean;
  isComplete?: boolean;
  error?: string;
  debugInfo?: Step4DebugInfo;
  generatedAt: Date;
}
```

### 레이아웃 명세 타입

#### LayoutSpecification

```typescript
interface LayoutSpecification {
  /** 페이지 너비 (1600px 고정) */
  pageWidth: number;
  /** 페이지 높이 (Fixed: 1000px, Scrollable: auto) */
  pageHeight: number | 'auto';
  /** 섹션별 정밀 레이아웃 */
  sections: SectionSpecification[];
  /** 전체 페이지 배경색 */
  backgroundColor: string;
  /** 안전 영역 설정 */
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

#### SectionSpecification

```typescript
interface SectionSpecification {
  /** 섹션 ID */
  id: string;
  /** 그리드 타입 */
  gridType: '1-12' | '8+4' | '2-11' | '3-10';
  /** 절대 위치 (픽셀 단위) */
  position: { x: number; y: number };
  /** 섹션 크기 */
  dimensions: { width: number; height: number | 'auto' };
  /** 내부 여백 */
  padding: { top: number; right: number; bottom: number; left: number };
  /** 배경색 */
  backgroundColor: string;
  /** 내부 요소 간격 */
  gap: number;
  /** 다음 섹션과의 간격 */
  marginBottom: number;
}
```

### 컴포넌트 스타일 타입

#### ComponentStyleSpecification

```typescript
interface ComponentStyleSpecification {
  /** 컴포넌트 ID */
  id: string;
  /** 컴포넌트 타입 */
  type: 'heading' | 'paragraph' | 'card' | 'image';
  /** 소속 섹션 ID */
  section: string;
  /** 절대 위치 (픽셀 단위) */
  position: { x: number; y: number };
  /** 컴포넌트 크기 */
  dimensions: { width: number; height: number | 'auto' };

  /** 폰트 설정 */
  font?: FontSpecification;
  /** 색상 명세 */
  colors: ColorSpecification;
  /** 시각적 효과 */
  visual: VisualStyleSpecification;

  /** 상태별 스타일 */
  states?: {
    hover?: Partial<ComponentStyleSpecification>;
    focus?: Partial<ComponentStyleSpecification>;
    active?: Partial<ComponentStyleSpecification>;
  };

  /** z-index 값 */
  zIndex: number;
  /** 표시/숨김 */
  display: 'block' | 'inline' | 'inline-block' | 'flex' | 'none';
}
```

### 인터랙션 타입

#### InteractionSpecification

```typescript
interface InteractionSpecification {
  /** 인터랙션 ID */
  id: string;
  /** 대상 컴포넌트 ID */
  target: string;
  /** 트리거 조건 */
  trigger: 'scroll' | 'hover' | 'click' | 'focus' | 'load' | 'visible';
  /** 애니메이션 효과 */
  effect: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'highlight' | 'bounce';

  // 애니메이션 속성
  /** 지속 시간 */
  duration: string;
  /** 지연 시간 */
  delay?: string;
  /** 이징 함수 */
  easing?: string;

  /** 애니메이션 파라미터 */
  parameters?: {
    scale?: number;
    rotation?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
    opacity?: number;
  };

  /** 실행 조건 */
  conditions?: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    scrollPosition?: number;
    userInteraction?: boolean;
  };
}
```

### 교육적 기능 타입

#### EducationalFeature

```typescript
interface EducationalFeature {
  /** 기능 ID */
  id: string;
  /** 기능 타입 */
  type: 'progressBar' | 'scrollIndicator' | 'focusGuide' | 'stepNavigation' | 'readingProgress';
  /** 위치 */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'floating';
  /** 크기 */
  dimensions?: { width: number; height: number };

  /** 스타일링 */
  styling: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    opacity?: number;
  };

  /** 동작 설정 */
  behavior: {
    autoUpdate: boolean;
    userControl: boolean;
    persistence: boolean;
  };
}
```

### 검증 결과 타입

#### ValidationResult

```typescript
interface ValidationResult {
  /** 검증 통과 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: string[];
  /** 경고 목록 */
  warnings: string[];
  /** 품질 점수 (0-100) */
  score: number;
  /** 항목별 검증 결과 */
  checks: {
    layoutConstraints: boolean;
    cssProperties: boolean;
    implementability: boolean;
    accessibility: boolean;
  };
}
```

---

## 💡 사용 예시

### 기본 사용법

```typescript
import { Step4DesignSpecificationService } from './services/step4-design-specification.service';
import { OpenAIService } from './services/openai.service';

// 서비스 초기화
const openAIService = new OpenAIService();
openAIService.initialize(apiKey);
const step4Service = new Step4DesignSpecificationService(openAIService);

// 디자인 명세 생성
const designSpec = await step4Service.generateDesignSpecification(
  projectData,
  visualIdentity,
  step3Result
);

// 결과 활용
if (designSpec.pages.every(page => page.isComplete)) {
  console.log('모든 페이지 생성 완료');

  designSpec.pages.forEach((page, index) => {
    console.log(`페이지 ${index + 1}: ${page.pageTitle}`);
    console.log(`- 컴포넌트: ${page.componentStyles.length}개`);
    console.log(`- 이미지: ${page.imagePlacements.length}개`);
    console.log(`- 인터랙션: ${page.interactions.length}개`);
  });
} else {
  console.log('일부 페이지 생성 실패');
  const failedPages = designSpec.pages.filter(page => page.error);
  failedPages.forEach(page => {
    console.log(`페이지 ${page.pageNumber} 오류:`, page.error);
  });
}
```

### React 컴포넌트에서 사용

```tsx
import React, { useState } from 'react';
import { Step4DesignSpecification } from './components/workflow/Step4DesignSpecification';

function WorkflowStep4({ projectData, visualIdentity, step3Result, apiKey }) {
  const [step4Data, setStep4Data] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStep4Complete = (data) => {
    setStep4Data(data);
    console.log('Step4 완료:', data);
  };

  return (
    <Step4DesignSpecification
      initialData={step4Data}
      projectData={projectData}
      visualIdentity={visualIdentity}
      step3Result={step3Result}
      apiKey={apiKey}
      onComplete={handleStep4Complete}
      onDataChange={setStep4Data}
      onGeneratingChange={setIsGenerating}
    />
  );
}
```

### 개별 Engine 사용

```typescript
import { ValidationEngine } from './services/engines/ValidationEngine';

// ValidationEngine 단독 사용
const validationEngine = new ValidationEngine();

// 페이지 검증
const validationResult = validationEngine.validatePage(
  pageResult,
  'fixed'
);

if (!validationResult.isValid) {
  console.log('검증 실패:');
  validationResult.errors.forEach(error => {
    console.log(`- ${error}`);
  });
}

if (validationResult.warnings.length > 0) {
  console.log('경고사항:');
  validationResult.warnings.forEach(warning => {
    console.log(`- ${warning}`);
  });
}

console.log(`품질 점수: ${validationResult.score}/100`);
```

### 커스텀 검증 로직

```typescript
// 커스텀 검증 함수
function validateEducationalContent(designSpec: Step4DesignResult): string[] {
  const issues: string[] = [];

  designSpec.pages.forEach((page, index) => {
    // 헤딩 구조 검증
    const headings = page.componentStyles.filter(comp => comp.type === 'heading');
    if (headings.length === 0) {
      issues.push(`페이지 ${index + 1}: 제목이 없음`);
    }

    // 이미지-텍스트 균형 검증
    const images = page.imagePlacements.length;
    const textComponents = page.componentStyles.filter(comp =>
      comp.type === 'paragraph' || comp.type === 'heading'
    ).length;

    if (images === 0 && textComponents > 5) {
      issues.push(`페이지 ${index + 1}: 텍스트만 과다, 시각적 요소 필요`);
    }
  });

  return issues;
}

// 사용
const educationalIssues = validateEducationalContent(designSpec);
if (educationalIssues.length > 0) {
  console.log('교육적 개선사항:', educationalIssues);
}
```

---

## 🚨 에러 핸들링

### 예외 타입

#### Step4GenerationError

```typescript
class Step4GenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'Step4GenerationError';
  }
}
```

#### Step4ValidationError

```typescript
class Step4ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'Step4ValidationError';
  }
}
```

#### Step4ParsingError

```typescript
class Step4ParsingError extends Error {
  constructor(
    message: string,
    public readonly rawContent: string,
    public readonly line?: number
  ) {
    super(message);
    this.name = 'Step4ParsingError';
  }
}
```

### 에러 처리 패턴

```typescript
async function safeGenerateDesignSpec(
  step4Service: Step4DesignSpecificationService,
  projectData: ProjectData,
  visualIdentity: VisualIdentity,
  step3Result: Step3IntegratedResult
): Promise<Step4DesignResult | null> {
  try {
    return await step4Service.generateDesignSpecification(
      projectData,
      visualIdentity,
      step3Result
    );
  } catch (error) {
    if (error instanceof Step4ValidationError) {
      console.error(`입력 검증 실패 - ${error.field}:`, error.value);
      // 사용자에게 입력 수정 요청
      return null;
    } else if (error instanceof Step4ParsingError) {
      console.error('AI 응답 파싱 실패:', error.message);
      console.log('원본 응답:', error.rawContent.substring(0, 500));
      // 재시도 로직 또는 대체 파싱 시도
      return await retryWithAlternativePrompt();
    } else if (error instanceof Step4GenerationError) {
      console.error('생성 프로세스 실패:', error.message);
      if (error.cause) {
        console.error('원인:', error.cause.message);
      }
      // 부분 생성 결과라도 반환할지 결정
      return await getPartialResult();
    } else {
      console.error('예상치 못한 오류:', error);
      // 전역 에러 핸들러로 전달
      throw error;
    }
  }
}
```

### 재시도 전략

```typescript
async function generateWithRetry(
  step4Service: Step4DesignSpecificationService,
  ...args: any[]
): Promise<Step4DesignResult> {
  const maxRetries = 3;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`생성 시도 ${attempt}/${maxRetries}`);

      const result = await step4Service.generateDesignSpecification(...args);

      // 부분 실패 체크
      const failedPages = result.pages.filter(page => page.error);
      if (failedPages.length > 0 && attempt < maxRetries) {
        console.log(`${failedPages.length}개 페이지 실패, 재시도...`);
        continue;
      }

      return result;
    } catch (error) {
      lastError = error;
      console.warn(`시도 ${attempt} 실패:`, error.message);

      if (attempt < maxRetries) {
        // 지수 백오프
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw new Step4GenerationError(
    `${maxRetries}회 시도 후에도 생성 실패`,
    lastError
  );
}
```

---

## 📝 개발자 노트

### 성능 고려사항

1. **메모리 사용량**: 대용량 디자인 명세 처리 시 스트림 처리 고려
2. **API 비용**: OpenAI API 호출 최적화를 위한 프롬프트 압축
3. **응답 시간**: 병렬 처리 활용하여 페이지별 독립 생성

### 확장성 가이드

1. **새로운 Engine 추가**: `Engine` 인터페이스 구현
2. **커스텀 검증 규칙**: `ValidationEngine` 확장
3. **다양한 AI 모델**: `AIProvider` 인터페이스 구현

### 디버깅 팁

1. **파싱 실패 시**: `debugInfo.response`에서 원본 AI 응답 확인
2. **검증 실패 시**: `ValidationResult.checks`로 실패 항목 식별
3. **성능 이슈 시**: `debugInfo.processingTime`으로 병목 지점 파악

---

*이 API 문서는 Step4 시스템의 모든 공개 인터페이스를 포함하며, 실제 구현과 동기화됩니다.*