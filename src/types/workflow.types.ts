// 간단한 워크플로우 타입 정의
import { LayoutWireframe } from '../services/step3-layout-wireframe.service';

export interface ProjectData {
  id: string;
  projectTitle: string;
  targetAudience: string;
  layoutMode: 'fixed' | 'scrollable';
  contentMode: 'original' | 'enhanced' | 'restricted';
  pages: PageData[];
  suggestions?: string[];
  createdAt: Date;
}

export interface PageData {
  id: string;
  pageNumber: number;
  topic: string;
  description?: string;
}

export interface PageInfo {
  id: string;
  pageNumber: number;
  topic: string;
  description?: string;
}

export interface VisualIdentity {
  moodAndTone: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: string;
  };
  componentStyle: string;
}

export interface Step2RawResponse {
  version: string;
  mood: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  baseSizePt: number;
  componentStyle: string;
}

export interface DesignTokens {
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
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  elevation: {
    low: string;
    medium: string;
    high: string;
  };
  zIndex: {
    base: number;
    image: number;
    card: number;
    text: number;
  };
}

export interface LayoutProposal {
  pageId: string;
  pageTitle: string;
  layoutDescription: string;
  images?: Array<{
    filename: string;
    alt: string;
    purpose: string;
    placement: string;
    width?: number;
    height?: number;
    size?: string;
    position?: string;
    caption?: string;
    aiPrompt?: string;
  }>;
  metadata: {
    pageNumber: number;
    totalPages: number;
    generatedAt: Date;
    tokensUsed?: number;
    fallback?: boolean;
  };
}

export interface PageEnhancement {
  pageId: string;
  pageTitle: string;
  elementInteractions: Array<{
    elementId: string;
    staticState?: {
      description: string;
      initialStyling: any;
    };
    loadAnimation?: {
      type: string;
      duration: string;
      delay: string;
      timing: string;
      educationalPurpose: string;
      keyframes: string;
    };
    interactionStates?: Record<string, {
      description: string;
      styling: any;
      additionalEffects?: string;
    }>;
    feedbackAnimations?: Record<string, {
      trigger: string;
      animation: string;
      duration: string;
    }>;
    educationalEnhancements?: {
      learningSupport: string;
      specialInteractions: Array<{
        name: string;
        description: string;
        trigger: string;
        effect: string;
        purpose: string;
      }>;
    };
    technicalSpecs?: {
      cssClasses?: string[];
      jsEvents?: string[];
      accessibility?: {
        ariaLabels?: string;
        keyboardSupport?: string;
        screenReader?: string;
      };
    };
  }>;
  pageTransitions?: {
    pageLoad?: {
      sequence?: Array<{
        description: string;
        elements: string[];
        delay: string;
      }>;
    };
  };
  globalAnimations?: {
    scrollBehavior?: string;
    responsiveAnimations?: string;
    performanceOptimizations?: string;
  };
}

export interface FinalPrompt {
  htmlPrompt: string;
  system?: string;
  context?: string;
  task?: string;
}


export interface WorkflowState {
  step1?: ProjectData;
  step2?: { visualIdentity: VisualIdentity; designTokens: DesignTokens };
  step3?: Step3IntegratedResult;
  step5?: FinalPrompt;
  currentStep: number;
  lastSaved?: Date;
  stepCompletion?: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step5: boolean;
  };
}

// Step3 통합 결과 타입 추가
export interface Step3IntegratedResult {
  layoutMode: 'scrollable' | 'fixed';
  pages: Array<{
    pageId: string;
    pageTitle: string;
    pageNumber: number;

    // Phase1: 구조 설계 (내부 사용)
    structure?: {
      sections: Step3Section[];
      flow: string;
      imgBudget: number;
    };

    // Phase2: 콘텐츠 상세 (사용자 표시)
    content?: {
      components: ComponentLine[];
      images: ImageLine[];
      generatedAt: Date;
    };

    isGenerating: boolean;
    phase1Complete: boolean;
    phase2Complete: boolean;
    rawResponse?: string;      // 디버깅용
    parseError?: string;
    generatedAt: Date;
  }>;
  generatedAt: Date;
}

export interface Step3Section {
  id: string;
  role: "title" | "content";  // summary 제거 - 페이지별 마무리 콘텐츠 방지
  grid: "1-12" | "8+4" | "2-11" | "3-10";
  height: string;
  hint: string;
  gapBelow: number;
}