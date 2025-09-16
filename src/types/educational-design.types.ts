// 수정된 창작 시스템의 타입 정의
// 구체적이고 실용적인 교육 설계를 위한 타입들

export interface ComponentSpec {
  id: string;
  type: 'text' | 'image' | 'button' | 'card' | 'list' | 'chart' | 'interactive';
  position: {
    area: string;  // "좌측 상단", "중앙", "우측 하단" 등 상대적 위치
    priority: number;  // 1=최우선, 2=중요, 3=보조
  };
  size: {
    guideline: string;  // "전체 영역의 60%", "최대 400px 너비" 등
    responsive: boolean;
  };
  content: {
    primary: string;  // 주요 텍스트나 데이터
    secondary?: string;  // 부가 설명
    data?: any;  // 차트나 리스트용 데이터
  };
  purpose: string;  // 이 컴포넌트의 교육적 목적
}

export interface InteractionSpec {
  id: string;
  trigger: string;  // "title-card 클릭", "progress-bar 완료" 등
  action: string;   // "detail-panel 표시", "next-step 활성화" 등
  purpose: string;  // 이 상호작용의 교육적 의도
  feedback: string; // 사용자에게 제공할 피드백
}

export interface ContentData {
  heading: string;
  subheading?: string;
  bodyText: string;
  keyPoints: string[];
  statisticsData?: {
    label: string;
    value: string | number;
    context: string;
  }[];
  callToAction?: string;
}

export interface EducationalPageDesign {
  pageId: string;
  pageTitle: string;
  pageNumber: number;

  // 전체 AI 응답 (단순화)
  fullDescription?: string;

  // 교육 설계
  learningObjectives: string[];
  educationalStrategy: string;

  // 레이아웃 설계
  layoutStructure: {
    areas: {
      id: string;
      description: string;  // "메인 콘텐츠 영역", "사이드바" 등
      purpose: string;      // 교육적 목적
      sizeGuide: string;   // "화면의 70%", "최대 600px" 등
    }[];
  };

  // 구체적 콘텐츠
  content: ContentData;
  components: ComponentSpec[];
  interactions: InteractionSpec[];

  // 미디어 자료
  mediaAssets: {
    id: string;
    type: 'image' | 'video' | 'audio' | 'animation';
    purpose: string;
    description: string;
    sizeGuide: string;
    placement: string;
  }[];

  // 개발 가이드
  designRationale: string;        // 왜 이렇게 설계했는지
  implementationHints: string;    // 개발자를 위한 구현 팁
  uxConsiderations: string;       // 사용자 경험 고려사항

  // 메타데이터
  isComplete: boolean;
  generatedAt: Date;
  error?: string;

  // 품질 관리
  qualityMetrics?: QualityMetrics;

  // 디버그 정보
  debugInfo?: {
    originalPrompt: string;
    originalResponse: string;
    parsedSections: Record<string, string> | string | { simplified: string };
    layoutValidation?: LayoutValidation;
    qualityMetrics?: QualityMetrics;
  };
}

export interface EducationalDesignResult {
  projectOverview: {
    title: string;
    targetAudience: string;
    layoutMode: 'fixed' | 'scrollable';
    overallLearningGoals: string[];
    educationalApproach: string;
  };

  designPhilosophy: {
    coreValues: string[];           // "명확성", "상호작용성", "접근성" 등
    designPrinciples: string[];     // "인지 부하 최소화", "점진적 공개" 등
    userExperienceGoals: string[];  // "학습 동기 증진", "성취감 제공" 등
  };

  spaceConstraints: {
    mode: 'fixed' | 'scrollable';
    dimensions: string;
    criticalReminders: string[];
  };

  pageDesigns: EducationalPageDesign[];

  // 전체 가이드라인
  globalGuidelines: {
    visualHierarchy: string;
    colorUsage: string;
    typographyNotes: string;
    interactionPatterns: string;
    responsiveConsiderations: string;
  };

  // 구현 지원
  developerResources: {
    generalHints: string[];
    commonPatterns: string[];
    troubleshootingTips: string[];
    qualityChecklist: string[];
  };

  generatedAt: Date;
  processingTime: number;
}

// Step2에서 사용할 감성 컨텍스트 (기존 유지하되 목적 명확화)
export interface EmotionalContext {
  projectMood: string[];           // 전체적인 분위기
  colorEmotions: {
    primary: string;               // "신뢰감을 주는 딥블루"
    secondary: string;             // "안정감을 주는 연한 그레이"
    accent: string;                // "활기찬 오렌지"
  };
  typographyPersonality: {
    headings: string;              // "자신감 있고 명확한"
    body: string;                  // "편안하게 읽히는"
  };
  overallTone: string;            // 전체적인 톤앤매너 설명
}

// 레이아웃 제약 검증을 위한 타입
export interface LayoutValidation {
  isValid: boolean;
  errorType?: 'AREA_LIMIT_EXCEEDED' | 'HEIGHT_EXCEEDED' | 'INTERACTION_DETECTED' | 'COLOR_CODE_DETECTED';
  areaCount?: number;
  maxAllowed?: number;
  suggestions: string[];
  warnings?: string[];
}

// 이미지 구조화된 메타데이터 (8가지 요소)
export interface ImageStructuredMetadata {
  visualElements: string;      // 주요 시각 요소
  colorScheme: string;         // 색상 구성 (자연어만)
  pageContext: string;         // 페이지 내 맥락 (흐름과 연결점)
  styleTexture: string;        // 스타일과 질감
  learnerPerspective: string;  // 학습자 관점
  educationalFunction: string; // 교육적 기능
  visualDynamics: string;      // 시각적 역동성
}

// 품질 관리 시스템을 위한 타입
export interface QualityMetrics {
  imageDetailScore: number;     // 이미지 상세도 점수 (0-100)
  layoutDiversityScore: number; // 레이아웃 다양성 점수 (0-100)
  constraintComplianceScore: number; // 제약 준수 점수 (0-100)
  overallQualityScore: number;  // 전체 품질 점수 (0-100)
  suggestions: string[];
  warnings: string[];
}

// 품질 평가를 위한 타입
export interface EducationalDesignQuality {
  completenessScore: number;       // 필수 정보 완성도 (0-100)
  specificityScore: number;        // 구체성 점수 (0-100)
  educationalValueScore: number;   // 교육적 가치 점수 (0-100)
  implementabilityScore: number;   // 구현 가능성 점수 (0-100)
  layoutConstraintScore: number;   // 레이아웃 제약 준수 점수 (0-100)
  imageQualityScore: number;       // 이미지 품질 점수 (0-100)

  overallScore: number;

  strengths: string[];
  improvements: string[];
  recommendations: string[];
  layoutValidation?: LayoutValidation;
  qualityMetrics?: QualityMetrics;
}