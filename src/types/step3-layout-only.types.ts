import { Step2NewResult } from './step2-new.types';

export interface Step3LayoutOnlyResult {
  layoutMode: 'fixed' | 'scrollable';
  pages: PageLayoutResult[];
  designTokens: LayoutDesignTokens;
  generatedAt: Date;
  processingTime?: number;
}

export interface PageLayoutResult {
  pageId: string;
  pageTitle: string;
  pageNumber: number;
  textContent: PageTextContent;
  layoutNarrative: string;        // 페이지 전반의 레이아웃 스토리텔링
  visualGuidelines: string;      // 시각적 구성과 톤을 설명하는 문단
  implementationNotes: string;   // 구현 시 고려할 사항을 정리한 문단
  generatedAt: Date;
}

export interface PageTextContent {
  fullTextContent: string;
  learningGoal: string;
  keyMessage: string;
  imageDescription: string;
  interactionHint: string;
}

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
