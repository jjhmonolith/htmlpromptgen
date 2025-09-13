# Step4 상세 디자인 시스템 설계

## 📋 개요

Step4는 **상세 디자인 & 인터랙션** 단계로, Step3에서 정의된 콘텐츠와 컴포넌트를 기반으로 **정교한 레이아웃 설계**와 **교육 효과를 극대화하는 인터랙션**을 구현합니다.

## 🎯 핵심 설계 원칙

### 1. 📏 Overflow 방지 원칙
- **텍스트 오버플로우 방지**: 모든 텍스트 컨테이너에 적절한 크기 계산
- **컴포넌트 경계 준수**: 페이지 뷰포트 및 그리드 시스템 내 배치
- **반응형 안전성**: 모든 화면 크기에서 레이아웃 무결성 보장

### 2. 🎓 교육 효과 중심 인터랙션
- **학습 집중도 향상**: 핵심 콘텐츠로 주의 유도하는 애니메이션
- **점진적 정보 공개**: 학습 순서에 맞춘 단계적 콘텐츠 표시
- **피드백 시스템**: 학습자 행동에 대한 즉각적 시각적 반응

### 3. ✨ 유려한 애니메이션 가이드라인
- **자연스러운 움직임**: easing 함수를 통한 부드러운 전환
- **목적성 있는 애니메이션**: 장식이 아닌 학습 보조 수단
- **성능 최적화**: 60fps 유지 가능한 경량 애니메이션

## 🏗️ 기술 아키텍처

### 데이터 구조

```typescript
interface Step4DetailDesign {
  layoutSystem: LayoutSystem;
  interactionPlan: InteractionPlan;
  animationSequence: AnimationSequence;
  responsiveRules: ResponsiveRules;
  overflowPrevention: OverflowPrevention;
}

interface LayoutSystem {
  viewport: {
    safeWidth: number;        // 안전 영역 너비 (좌우 패딩 고려)
    safeHeight: number;       // 안전 영역 높이 (상하 패딩 고려)
    breakpoints: {
      mobile: { width: number; height: number };
      tablet: { width: number; height: number };
      desktop: { width: number; height: number };
    };
  };

  components: Array<{
    id: string;               // Step3 컴포넌트 참조
    position: {
      x: number;              // 픽셀 단위 정확한 위치
      y: number;
      width: number;
      height: number;
      zIndex: number;
    };
    constraints: {
      minWidth: number;       // 최소 너비 (텍스트 오버플로우 방지)
      maxWidth: number;       // 최대 너비 (페이지 경계 준수)
      minHeight: number;      // 최소 높이 (콘텐츠 보장)
      maxHeight: number;      // 최대 높이 (스크롤 방지)
    };
    textLayout: {
      fontSize: string;       // Step2 타이포그래피 기반
      lineHeight: number;     // 텍스트 가독성 보장
      letterSpacing: string;
      wordBreak: 'normal' | 'break-word' | 'keep-all';
      textOverflow: 'ellipsis' | 'clip';
      whiteSpace: 'normal' | 'nowrap' | 'pre-wrap';
    };
  }>;
}

interface InteractionPlan {
  educationalInteractions: Array<{
    name: string;
    targetComponentIds: string[];
    trigger: {
      type: 'hover' | 'click' | 'scroll' | 'focus' | 'timer';
      condition?: string;     // 조건부 트리거
    };
    purpose: 'attention' | 'progression' | 'feedback' | 'exploration';
    learningGoal: string;     // 교육적 목표 설명
    effect: {
      type: 'highlight' | 'reveal' | 'transform' | 'guide';
      duration: number;       // ms 단위
      easing: 'ease-in-out' | 'bounce' | 'elastic';
      properties: Record<string, any>;
    };
  }>;

  accessibilityInteractions: Array<{
    type: 'keyboard' | 'screen-reader' | 'high-contrast';
    implementation: string;
    fallback: string;
  }>;
}

interface AnimationSequence {
  pageLoad: {
    sequence: Array<{
      order: number;
      componentIds: string[];
      delay: number;          // ms
      animation: {
        type: 'fadeIn' | 'slideIn' | 'scaleIn' | 'typewriter';
        direction?: 'top' | 'bottom' | 'left' | 'right';
        duration: number;
        easing: string;
      };
      educationalReason: string;  // 왜 이 순서로 나타나는가?
    }>;
  };

  microAnimations: Array<{
    trigger: string;
    componentId: string;
    feedback: {
      visual: string;         // CSS 변화
      duration: number;
      purpose: string;        // 사용자에게 전달하는 메시지
    };
  }>;

  progressAnimations: Array<{
    name: string;
    triggers: string[];       // 진행 상황 기반 트리거
    effect: string;
    learningMilestone: string;
  }>;
}

interface ResponsiveRules {
  mobile: ResponsiveLayout;
  tablet: ResponsiveLayout;
  desktop: ResponsiveLayout;
}

interface ResponsiveLayout {
  componentAdjustments: Array<{
    componentId: string;
    position: Position;
    textScaling: number;      // 폰트 크기 배율
    spacingAdjustment: number; // 여백 조정 배율
    visibilityRule: 'show' | 'hide' | 'collapse'; // 화면별 표시 여부
  }>;

  interactionModifications: Array<{
    originalInteraction: string;
    mobileAlternative: string; // 터치 기반 대안
    tapTargetSize: number;     // 최소 44px 터치 영역
  }>;
}

interface OverflowPrevention {
  textOverflowStrategies: Array<{
    componentId: string;
    strategy: 'truncate' | 'wrap' | 'scroll' | 'resize-font';
    maxLines?: number;
    fallbackAction: string;
  }>;

  layoutOverflowRules: Array<{
    componentId: string;
    horizontalBehavior: 'contain' | 'scroll' | 'wrap';
    verticalBehavior: 'contain' | 'scroll' | 'expand';
    emergencyResize: boolean;  // 극한 상황에서 컴포넌트 크기 조정 허용
  }>;

  contentSafeguards: Array<{
    rule: string;
    description: string;
    implementation: string;
  }>;
}
```

## 🎯 Overflow 방지 전략

### 1. 텍스트 오버플로우 방지

#### A. 동적 폰트 크기 계산
```typescript
interface FontSizeCalculation {
  baseSize: number;           // Step2에서 정의된 기본 크기
  containerWidth: number;     // 컨테이너 너비
  contentLength: number;      // 텍스트 길이
  targetLines: number;        // 목표 줄 수

  calculation: {
    optimalSize: number;      // 최적 폰트 크기
    actualLines: number;      // 예상 줄 수
    safetyMargin: number;     // 10% 여유 공간
  };
}
```

#### B. 텍스트 레이아웃 전략
- **제목 텍스트**: `text-overflow: ellipsis` + 툴팁으로 전체 내용 표시
- **본문 텍스트**: `word-break: keep-all` (한글 단어 보존) + 자동 줄바꿈
- **캡션 텍스트**: 최대 2줄 제한 + 초과 시 "더보기" 버튼

#### C. 다국어 대응
```typescript
interface TextLayoutRules {
  korean: {
    wordBreak: 'keep-all';
    lineHeight: 1.6;          // 한글 가독성 최적화
    letterSpacing: '-0.02em';
  };
  english: {
    wordBreak: 'break-word';
    lineHeight: 1.4;
    letterSpacing: '0em';
  };
  mixed: {
    wordBreak: 'auto-phrase'; // 최신 브라우저 지원
    lineHeight: 1.5;
    letterSpacing: '-0.01em';
  };
}
```

### 2. 컴포넌트 오버플로우 방지

#### A. 그리드 시스템 기반 배치
```typescript
interface GridConstraints {
  columns: 12;                // 12컬럼 그리드
  gutterWidth: 24;           // 24px 간격
  marginSafety: 16;          // 좌우 16px 최소 여백

  componentRules: {
    maxSpan: 12;             // 최대 12컬럼 점유
    minSpan: 2;              // 최소 2컬럼 점유
    overlapPrevention: true; // 겹침 방지
  };
}
```

#### B. 반응형 안전 장치
```typescript
interface ResponsiveSafeguards {
  mobile: {
    maxComponentsPerRow: 1;   // 세로 배치 강제
    minTouchTarget: 44;       // 44px 최소 터치 영역
    textScaleLimit: 0.8;      // 최소 80% 크기 유지
  };
  tablet: {
    maxComponentsPerRow: 2;
    minTouchTarget: 44;
    textScaleLimit: 0.9;
  };
  desktop: {
    maxComponentsPerRow: 4;
    minTouchTarget: 32;
    textScaleLimit: 1.0;
  };
}
```

## 🎓 교육 효과 중심 인터랙션 설계

### 1. 학습 집중도 향상 인터랙션

#### A. 순차적 주의 유도 (Sequential Attention)
```typescript
interface AttentionGuidance {
  name: "sequential-highlight";
  purpose: "학습 순서에 맞춘 콘텐츠 강조";
  implementation: {
    sequence: [
      {
        step: 1;
        target: "main-title";
        effect: "pulse-highlight";
        duration: 2000;
        message: "먼저 제목을 읽어보세요";
      },
      {
        step: 2;
        target: "key-concept";
        effect: "border-glow";
        duration: 3000;
        message: "핵심 개념을 확인하세요";
      },
      {
        step: 3;
        target: "example-image";
        effect: "zoom-focus";
        duration: 2500;
        message: "예시 이미지를 관찰하세요";
      }
    ];
  };
}
```

#### B. 상호작용 기반 학습 확인 (Interactive Verification)
```typescript
interface LearningVerification {
  name: "comprehension-check";
  triggers: [
    {
      condition: "scroll-to-concept";
      action: "highlight-key-terms";
      feedback: "important-terms-glow";
    },
    {
      condition: "hover-on-diagram";
      action: "show-detailed-labels";
      feedback: "smooth-label-appear";
    },
    {
      condition: "click-on-example";
      action: "expand-explanation";
      feedback: "accordion-expand";
    }
  ];
}
```

### 2. 점진적 정보 공개 (Progressive Disclosure)

#### A. 레이어드 콘텐츠 시스템
```typescript
interface ProgressiveContent {
  levels: [
    {
      level: "overview";
      components: ["title", "summary", "main-image"];
      trigger: "page-load";
      animation: "fade-in-sequence";
    },
    {
      level: "detail";
      components: ["detailed-text", "sub-images", "captions"];
      trigger: "scroll-50%";
      animation: "slide-up-stagger";
    },
    {
      level: "exploration";
      components: ["interactive-elements", "additional-info"];
      trigger: "user-engagement";
      animation: "scale-in-bounce";
    }
  ];
}
```

### 3. 학습 피드백 시스템

#### A. 실시간 진행 표시
```typescript
interface ProgressFeedback {
  readingProgress: {
    indicator: "progress-bar";
    position: "top-fixed";
    animation: "smooth-fill";
    color: "primary-blue";
  };

  interactionFeedback: {
    hover: {
      effect: "subtle-lift";
      shadow: "0 4px 12px rgba(59, 130, 246, 0.15)";
      duration: 200;
    };
    click: {
      effect: "ripple-effect";
      color: "primary-blue";
      duration: 300;
    };
  };
}
```

## ✨ 유려한 애니메이션 시스템

### 1. 자연스러운 움직임 원칙

#### A. Easing 함수 라이브러리
```typescript
interface EasingLibrary {
  gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)";     // 부드러운 시작과 끝
  bouncy: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";   // 탄성 효과
  swift: "cubic-bezier(0.4, 0.0, 0.2, 1)";            // 빠른 전환
  educational: "cubic-bezier(0.23, 1, 0.32, 1)";      // 교육용 최적화
}
```

#### B. 타이밍 가이드라인
```typescript
interface AnimationTiming {
  microInteraction: 150;      // 버튼 호버 등
  transition: 300;           // 페이지 전환
  reveal: 500;               // 콘텐츠 나타남
  attention: 800;            // 주의 유도
  sequence: 1200;            // 순차적 애니메이션
}
```

### 2. 교육적 목적성을 가진 애니메이션

#### A. 개념 설명 애니메이션
```typescript
interface ConceptAnimation {
  name: "step-by-step-process";
  purpose: "복잡한 과정을 단계별로 시각화";
  implementation: {
    steps: [
      {
        phase: "introduction";
        elements: ["process-title"];
        animation: "typewriter-effect";
        speed: 50; // ms per character
      },
      {
        phase: "step-revelation";
        elements: ["step-1", "step-2", "step-3"];
        animation: "cascade-appear";
        delay: 400; // ms between steps
      },
      {
        phase: "connection-drawing";
        elements: ["connecting-arrows"];
        animation: "draw-path";
        duration: 1000;
      }
    ];
  };
}
```

#### B. 주의 집중 애니메이션
```typescript
interface AttentionAnimation {
  subtle: {
    name: "gentle-pulse";
    keyframes: "scale(1) → scale(1.05) → scale(1)";
    duration: 2000;
    iterations: 3;
    purpose: "중요한 정보에 부드럽게 주의 유도";
  };

  moderate: {
    name: "highlight-glow";
    keyframes: "box-shadow: none → 0 0 20px rgba(59,130,246,0.4) → none";
    duration: 1500;
    iterations: 2;
    purpose: "핵심 콘텐츠 강조";
  };

  strong: {
    name: "importance-shake";
    keyframes: "translateX(0) → translateX(-5px) → translateX(5px) → translateX(0)";
    duration: 400;
    iterations: 1;
    purpose: "즉각적인 주의 필요시";
  };
}
```

### 3. 성능 최적화 애니메이션

#### A. GPU 가속 활용
```typescript
interface PerformanceOptimization {
  gpuAccelerated: {
    properties: ["transform", "opacity"];
    avoid: ["width", "height", "padding", "margin"];
    reason: "레이아웃 리플로우 방지";
  };

  compositingLayers: {
    triggers: ["transform3d", "opacity", "filter"];
    usage: "독립적인 애니메이션 요소에만 적용";
  };

  frameRateOptimization: {
    target: 60; // fps
    monitoring: "performance.now() 기반 측정";
    fallback: "복잡한 애니메이션 비활성화 옵션";
  };
}
```

## 🔧 구현 가이드라인

### 1. 컴포넌트 개발 패턴

```typescript
// Step4DetailDesign.tsx 핵심 구조
const Step4DetailDesign: React.FC<Step4Props> = ({
  initialData,
  step1Data,
  step2Data,
  step3Data,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  // 상태 관리
  const [designData, setDesignData] = useState<Step4DetailDesign | null>(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [designMode, setDesignMode] = useState<'layout' | 'interaction' | 'animation'>('layout');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Overflow 방지 계산
  const overflowCalculator = useOverflowPrevention(step3Data, previewMode);

  // 인터랙션 시뮬레이터
  const interactionSimulator = useInteractionSimulation(designData?.interactionPlan);

  // 애니메이션 시퀀서
  const animationSequencer = useAnimationSequence(designData?.animationSequence);

  return (
    <div className="step4-container">
      <PageSelector />
      <DesignModeTabSelector />

      <div className="design-workspace grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 설정 패널 */}
        <DesignControlPanel
          mode={designMode}
          onLayoutChange={handleLayoutChange}
          onInteractionChange={handleInteractionChange}
          onAnimationChange={handleAnimationChange}
        />

        {/* 우측: 실시간 프리뷰 */}
        <LivePreviewCanvas
          designData={designData}
          previewMode={previewMode}
          simulateInteractions={interactionSimulator.active}
          showAnimations={animationSequencer.active}
        />
      </div>

      <ActionButtons />
    </div>
  );
};
```

### 2. 오버플로우 방지 Hook

```typescript
const useOverflowPrevention = (step3Data: Step3Data, viewport: ViewportMode) => {
  const calculateSafeLayout = useCallback(() => {
    const safeZone = getViewportSafeZone(viewport);
    const componentConstraints = calculateComponentConstraints(step3Data.components);

    return {
      safePositions: optimizePositions(componentConstraints, safeZone),
      textSafety: calculateTextSafety(componentConstraints, safeZone),
      overflowWarnings: detectPotentialOverflows(componentConstraints, safeZone)
    };
  }, [step3Data, viewport]);

  return calculateSafeLayout();
};
```

### 3. 교육적 인터랙션 Hook

```typescript
const useEducationalInteractions = (interactionPlan: InteractionPlan) => {
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({});

  const triggerInteraction = useCallback((interactionName: string) => {
    const interaction = interactionPlan.educationalInteractions.find(i => i.name === interactionName);
    if (!interaction) return;

    // 교육적 목적 달성 추적
    trackLearningGoal(interaction.learningGoal);

    // 시각적 피드백 실행
    executeVisualFeedback(interaction.effect);

    // 진행 상황 업데이트
    updateLearningProgress(interactionName);
  }, [interactionPlan]);

  return {
    triggerInteraction,
    activeInteraction,
    learningProgress
  };
};
```

## 🎯 품질 보증 체크리스트

### Layout & Overflow 방지
- [ ] 모든 텍스트가 컨테이너 내에서 완전히 표시되는가?
- [ ] 모든 컴포넌트가 페이지 경계 내에 위치하는가?
- [ ] 3가지 화면 크기에서 레이아웃이 깨지지 않는가?
- [ ] 긴 텍스트 입력 시에도 레이아웃이 유지되는가?

### 교육적 인터랙션
- [ ] 각 인터랙션이 명확한 학습 목표를 가지고 있는가?
- [ ] 학습 순서가 논리적으로 구성되었는가?
- [ ] 사용자 행동에 대한 즉각적인 피드백이 제공되는가?
- [ ] 인터랙션이 학습을 방해하지 않고 도움이 되는가?

### 애니메이션 품질
- [ ] 모든 애니메이션이 60fps에서 부드럽게 실행되는가?
- [ ] 애니메이션의 목적이 명확하고 교육적인가?
- [ ] 과도한 움직임으로 인한 멀미나 산만함이 없는가?
- [ ] 애니메이션 비활성화 옵션이 제공되는가?

### 접근성 & 호환성
- [ ] 키보드만으로 모든 인터랙션이 가능한가?
- [ ] 스크린 리더 사용자를 위한 대체 텍스트가 제공되는가?
- [ ] 색각 이상자도 인터랙션을 구분할 수 있는가?
- [ ] 주요 브라우저에서 일관된 경험이 제공되는가?

## 📚 관련 파일 구조

```
src/
├── components/workflow/Step4DetailDesign/
│   ├── Step4DetailDesign.tsx           # 메인 컴포넌트
│   ├── DesignControlPanel.tsx          # 설정 패널
│   ├── LivePreviewCanvas.tsx           # 실시간 프리뷰
│   ├── OverflowPrevention.tsx          # 오버플로우 방지 도구
│   └── InteractionSimulator.tsx        # 인터랙션 시뮬레이터
├── hooks/
│   ├── useOverflowPrevention.ts        # 오버플로우 방지 Hook
│   ├── useEducationalInteractions.ts   # 교육적 인터랙션 Hook
│   └── useAnimationSequence.ts         # 애니메이션 시퀀스 Hook
├── services/
│   └── step4-detail-design.service.ts  # AI 생성 서비스
└── types/
    └── step4-detail-design.types.ts    # 타입 정의
```

---

**⚠️ 중요**: 이 설계 문서는 **교육 효과 극대화**와 **기술적 안정성** 두 가지 목표를 균형있게 추구합니다. 모든 기능은 **학습자의 경험**을 우선으로 하되, **개발자의 구현 복잡성**을 최소화하는 방향으로 설계되었습니다.