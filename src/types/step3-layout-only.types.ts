import { Step2NewResult } from './step2-new.types';

// Step3 새로운 출력 인터페이스 (레이아웃 설계 전용)
export interface Step3LayoutOnlyResult {
  layoutMode: 'fixed' | 'scrollable';
  pages: PageLayoutResult[];
  designTokens: LayoutDesignTokens;
  generatedAt: Date;
  processingTime?: number;
}

// 페이지별 레이아웃 설계 결과
export interface PageLayoutResult {
  pageId: string;
  pageTitle: string;
  pageNumber: number;

  // Step2에서 받은 텍스트 콘텐츠 (수정 없이 사용)
  textContent: PageTextContent;

  // 레이아웃 설계
  layoutStructure: {
    concept: string;           // 전체 레이아웃 컨셉
    sections: LayoutSection[]; // 섹션별 구성
    gridSystem: string;        // 그리드 시스템 설명
    spacingStrategy: string;   // 간격 체계
  };

  // 이미지 배치 설계
  imageLayout: {
    placement: string;    // 이미지 위치 및 배치
    sizing: string;       // 크기 가이드
    integration: string;  // 텍스트와의 통합 방법
  };

  // 세부 디자인 가이드
  designGuide: {
    typography: string;      // 타이포그래피 적용
    colorApplication: string; // 색상 적용 방법
    spacingDetails: string;  // 간격 세부 사항
    visualEmphasis: string;  // 시각적 강조 방법
  };

  // 구현 가이드라인
  implementationGuide: {
    cssStructure: string;      // CSS 클래스 구조
    responsiveStrategy: string; // 반응형 전략
    accessibilityNotes: string; // 접근성 고려사항
  };

  generatedAt: Date;
}

// Step2에서 받은 텍스트 콘텐츠 (변경 없이 사용)
export interface PageTextContent {
  fullTextContent: string;
  learningGoal: string;
  keyMessage: string;
  imageDescription: string;
  interactionHint: string;
}

// 레이아웃 섹션 정의
export interface LayoutSection {
  id: string;
  name: string;
  gridSpan: string;      // 예: "1-12", "8+4", "2-11"
  height: string;        // 예: "200px", "auto"
  purpose: string;       // 섹션의 역할 설명
  content: string;       // 배치될 콘텐츠 설명
  styling: string;       // 스타일링 가이드
}

// 레이아웃 전용 디자인 토큰 (기본 토큰 + 레이아웃 특화)
export interface LayoutDesignTokens {
  viewport: {
    width: number;
    height?: number;
  };
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  grid: {
    columns: number;
    gap: number;
    breakpoints?: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    section: number;  // 섹션 간 간격
    component: number; // 컴포넌트 간 간격
  };
  typography: {
    scale: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      caption: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  layout: {
    maxContentWidth: number;
    imageAspectRatios: string[];
    buttonSizes: string[];
  };
}

// Step3 입력 인터페이스
export interface Step3LayoutInput {
  step2Result: Step2NewResult;
  layoutMode: 'fixed' | 'scrollable';
  pageIndex: number; // 단일 페이지 처리
}

// AI 응답 파싱을 위한 인터페이스
export interface Step3LayoutRawResponse {
  layoutConcept: string;
  sections: string;        // 텍스트로 받아서 파싱
  imageLayout: string;
  designGuide: string;
  implementationGuide: string;
}

// 파싱된 레이아웃 응답
export interface ParsedLayoutResponse {
  layoutConcept: string;
  sections: LayoutSection[];
  imageLayout: {
    placement: string;
    sizing: string;
    integration: string;
  };
  designGuide: {
    typography: string;
    colorApplication: string;
    spacingDetails: string;
    visualEmphasis: string;
  };
  implementationGuide: {
    cssStructure: string;
    responsiveStrategy: string;
    accessibilityNotes: string;
  };
}