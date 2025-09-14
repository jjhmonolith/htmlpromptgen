/**
 * Step4 디자인 명세 관련 타입 정의
 *
 * Step4는 Step3의 컴포넌트/이미지 계획을 실제 구현 가능한
 * 구체적 디자인 명세로 변환하는 단계입니다.
 */

// =============================================================================
// 메인 결과 타입
// =============================================================================

/** Step4 전체 결과 구조 */
export interface Step4DesignResult {
  /** 레이아웃 모드 */
  layoutMode: 'fixed' | 'scrollable';
  /** 페이지별 디자인 명세 */
  pages: Step4PageResult[];
  /** 전역 기능 (진행바, 접근성 등) */
  globalFeatures: GlobalFeature[];
  /** 생성 완료 시각 */
  generatedAt: Date;
}

/** 페이지별 디자인 명세 결과 */
export interface Step4PageResult {
  /** 페이지 고유 ID */
  pageId: string;
  /** 페이지 제목 */
  pageTitle: string;
  /** 페이지 번호 */
  pageNumber: number;

  // 레이아웃 명세
  /** 페이지 레이아웃 정밀 명세 */
  layout: LayoutSpecification;

  // 컴포넌트별 상세 스타일
  /** 컴포넌트별 상세 스타일 명세 */
  componentStyles: ComponentStyleSpecification[];

  // 이미지 배치 명세
  /** 이미지 배치 정밀 명세 */
  imagePlacements: ImagePlacementSpecification[];

  // 상호작용 및 애니메이션
  /** 인터랙션 및 애니메이션 명세 */
  interactions: InteractionSpecification[];

  // 교육적 기능
  /** 교육적 기능 명세 */
  educationalFeatures: EducationalFeature[];

  // 상태 관리 (UI용)
  /** 생성 중 여부 */
  isGenerating?: boolean;
  /** 생성 완료 여부 */
  isComplete?: boolean;
  /** 오류 메시지 */
  error?: string;

  // 디버그 정보 (개발 환경용)
  /** 디버그 정보 */
  debugInfo?: Step4DebugInfo;

  /** 페이지 생성 완료 시각 */
  generatedAt: Date;
}

// =============================================================================
// 레이아웃 명세 타입
// =============================================================================

/** 페이지 레이아웃 정밀 명세 */
export interface LayoutSpecification {
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

/** 섹션별 정밀 레이아웃 명세 */
export interface SectionSpecification {
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

// =============================================================================
// 컴포넌트 스타일 명세 타입
// =============================================================================

/** 컴포넌트별 상세 스타일 명세 */
export interface ComponentStyleSpecification {
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

  // 타이포그래피 (텍스트 컴포넌트용)
  /** 폰트 설정 */
  font?: FontSpecification;

  // 색상 설정
  /** 색상 명세 */
  colors: ColorSpecification;

  // 시각적 스타일
  /** 시각적 효과 */
  visual: VisualStyleSpecification;

  // 상태별 스타일 (hover, focus 등)
  /** 상태별 스타일 */
  states?: {
    hover?: Partial<ComponentStyleSpecification>;
    focus?: Partial<ComponentStyleSpecification>;
    active?: Partial<ComponentStyleSpecification>;
  };

  // 레이아웃 관련
  /** z-index 값 */
  zIndex: number;
  /** 표시/숨김 */
  display: 'block' | 'inline' | 'inline-block' | 'flex' | 'none';
}

/** 폰트 명세 */
export interface FontSpecification {
  /** 폰트 패밀리 */
  family: string;
  /** 폰트 굵기 */
  weight: number;
  /** 폰트 크기 (px 단위) */
  size: string;
  /** 줄 높이 */
  lineHeight: number;
  /** 글자 간격 */
  letterSpacing?: string;
}

/** 색상 명세 */
export interface ColorSpecification {
  /** 텍스트 색상 */
  text: string;
  /** 배경색 */
  background: string;
  /** 테두리 색상 */
  border?: string;
}

/** 시각적 스타일 명세 */
export interface VisualStyleSpecification {
  /** 모서리 둥글기 */
  borderRadius?: number;
  /** 그림자 */
  boxShadow?: string;
  /** 투명도 */
  opacity?: number;
  /** 테두리 */
  border?: {
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
  };
}

// =============================================================================
// 이미지 배치 명세 타입
// =============================================================================

/** 이미지 배치 정밀 명세 */
export interface ImagePlacementSpecification {
  /** 이미지 ID */
  id: string;
  /** 파일명 */
  filename: string;
  /** 소속 섹션 ID */
  section: string;
  /** 절대 위치 (픽셀 단위) */
  position: { x: number; y: number };
  /** 이미지 크기 */
  dimensions: { width: number; height: number };

  // 이미지 스타일링
  /** 이미지 맞춤 방식 */
  objectFit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** 모서리 둥글기 */
  borderRadius?: number;
  /** 그림자 */
  boxShadow?: string;

  // 로딩 최적화
  /** 로딩 방식 */
  loading: 'lazy' | 'eager';
  /** 우선순위 */
  priority: 'high' | 'normal' | 'low';

  // 접근성
  /** 대체 텍스트 */
  alt: string;
  /** 캡션 */
  caption?: string;

  // z-index
  /** z-index 값 */
  zIndex: number;
}

// =============================================================================
// 상호작용 명세 타입
// =============================================================================

/** 인터랙션 및 애니메이션 명세 */
export interface InteractionSpecification {
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

  // 효과별 파라미터
  /** 애니메이션 파라미터 */
  parameters?: {
    /** 스케일 비율 */
    scale?: number;
    /** 회전 각도 */
    rotation?: number;
    /** 이동 방향 */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** 이동 거리 */
    distance?: number;
    /** 최종 투명도 */
    opacity?: number;
  };

  // 조건부 실행
  /** 실행 조건 */
  conditions?: {
    /** 뷰포트 크기 */
    viewport?: 'mobile' | 'tablet' | 'desktop';
    /** 스크롤 위치 (%) */
    scrollPosition?: number;
    /** 사용자 상호작용 필요 여부 */
    userInteraction?: boolean;
  };
}

// =============================================================================
// 교육적 기능 타입
// =============================================================================

/** 교육적 기능 명세 */
export interface EducationalFeature {
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
    /** 주 색상 */
    primaryColor: string;
    /** 보조 색상 */
    secondaryColor: string;
    /** 배경색 */
    backgroundColor: string;
    /** 투명도 */
    opacity?: number;
  };

  /** 동작 설정 */
  behavior: {
    /** 자동 업데이트 여부 */
    autoUpdate: boolean;
    /** 사용자 제어 가능 여부 */
    userControl: boolean;
    /** 지속성 (새로고침 후에도 유지) */
    persistence: boolean;
  };
}

/** 전역 기능 (접근성, 성능 등) */
export interface GlobalFeature {
  /** 기능 타입 */
  type: 'accessibility' | 'performance' | 'seo' | 'analytics';
  /** 기능별 상세 설정 */
  specifications: Record<string, any>;
  /** 활성화 여부 */
  enabled: boolean;
}

// =============================================================================
// 디버그 및 검증 타입
// =============================================================================

/** Step4 디버그 정보 */
export interface Step4DebugInfo {
  /** AI에게 전달된 프롬프트 */
  prompt: string;
  /** AI 응답 원문 */
  response: string;
  /** 처리 시간 (ms) */
  processingTime: number;
  /** 검증 결과 */
  validationResults: ValidationResult;
  /** 생성 시각 */
  generatedAt: Date;
  /** 오류 로그 */
  errors?: string[];
  /** 경고 로그 */
  warnings?: string[];
}

/** 검증 결과 */
export interface ValidationResult {
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

// =============================================================================
// 에러 타입
// =============================================================================

/** Step4 생성 오류 */
export class Step4GenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'Step4GenerationError';
  }
}

/** Step4 검증 오류 */
export class Step4ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'Step4ValidationError';
  }
}

/** Step4 파싱 오류 */
export class Step4ParsingError extends Error {
  constructor(
    message: string,
    public readonly rawContent: string,
    public readonly line?: number
  ) {
    super(message);
    this.name = 'Step4ParsingError';
  }
}

// =============================================================================
// 유틸리티 타입
// =============================================================================

/** 위치 정보 */
export type Position = { x: number; y: number };

/** 크기 정보 */
export type Dimensions = { width: number; height: number | 'auto' };

/** 여백 정보 */
export type Padding = { top: number; right: number; bottom: number; left: number };

/** 색상 값 (HEX 형식) */
export type ColorValue = string;

/** CSS 크기 단위 */
export type CSSSize = string;

/** CSS 시간 단위 */
export type CSSTime = string;