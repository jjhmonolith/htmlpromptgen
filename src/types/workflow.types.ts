// Step 1: 기본 정보
export interface ProjectData {
  id: string;
  projectTitle: string;
  targetAudience: string;
  pages: PageInfo[];
  suggestions?: string;
  layoutMode: 'fixed' | 'scrollable';
  contentMode: 'enhanced' | 'restricted';
  createdAt: Date;
  updatedAt: Date;
}

export interface PageInfo {
  id: string;
  pageNumber: number;
  topic: string;
  description?: string;
}

// Step 2: 비주얼 아이덴티티
export interface VisualIdentity {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: string;
  tone: 'professional' | 'friendly' | 'playful';
  moodBoard: string;
  colorPalette: ColorPalette;
  typography: Typography;
  moodAndTone: string;
  componentStyle: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  baseSize: string;
}

// Step 3: 레이아웃 제안
export interface LayoutProposal {
  pageId: string;
  pageTitle: string;
  layout: LayoutStructure;
  images: ImageSpec[];
  contentBlocks: ContentBlock[];
  metadata: PageMetadata;
}

export interface LayoutStructure {
  structure: string;
  mainContent: string;
  visualElements: string;
}

export interface ImageSpec {
  filename: string;
  description: string;
  position?: string;
}

export interface ContentBlock {
  type: 'heading' | 'body' | 'point' | 'activity';
  content: string;
  order: number;
}

export interface PageMetadata {
  pageNumber: number;
  totalPages: number;
  generatedAt: string;
}

// Step 4: 애니메이션/상호작용
export interface PageEnhancement {
  pageId: string;
  animations: Animation[];
  interactions: Interaction[];
  gamification: Gamification;
  microAnimations: MicroAnimation[];
  transitions: Transitions;
}

export interface Animation {
  element: string;
  type: string;
  trigger: string;
  duration: string;
}

export interface Interaction {
  element: string;
  action: string;
  response: string;
}

export interface Gamification {
  type: string;
  description: string;
  rewards: string;
}

export interface MicroAnimation {
  trigger: string;
  effect: string;
}

export interface Transitions {
  pageEntry: string;
  pageExit: string;
  elementTransitions: string;
}

// Step 5: 최종 프롬프트
export interface FinalPrompt {
  htmlPrompt: string;
  imagePrompts: ImagePrompt[];
  metadata: GenerationMetadata;
}

export interface ImagePrompt {
  pageId: string;
  imageName: string;
  prompt: string;
}

export interface GenerationMetadata {
  generatedAt: Date;
  totalTokens?: number;
  version: string;
}

// 워크플로우 상태 관리
export interface WorkflowState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  projectData: ProjectData | null;
  visualIdentity: VisualIdentity | null;
  layoutProposals: LayoutProposal[];
  pageEnhancements: PageEnhancement[];
  finalPrompt: FinalPrompt | null;
  
  // 단계별 완료 상태
  stepCompletion: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
  };
  
  // 수정 추적
  modifications: {
    [key: string]: boolean;
  };
  
  // 이전 상태 저장
  previousStates: {
    [stepNumber: number]: any;
  };
}

// 프로젝트 전체 상태 (기존 Project 타입 확장)
export interface WorkflowProject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  apiKey?: string;
  workflowState: WorkflowState;
  currentStep: 'workflow' | 'result';
}