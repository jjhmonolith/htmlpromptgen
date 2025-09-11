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
  layoutDescription: string;
  detailedElements: DetailedElement[];
  designSpecs: DesignSpecs;
  images: ImageSpec[];
  metadata: PageMetadata;
}

export interface DetailedElement {
  elementType: 'header' | 'content' | 'sidebar' | 'footer' | 'media' | 'static_interactive';
  elementName: string;
  position: ElementPosition;
  styling: ElementStyling;
  content: string;
  purpose: string;
  interactionPlaceholder: string; // Step4에서 추가될 인터랙션 유형
}

export interface ElementPosition {
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface ElementStyling {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  [key: string]: any;
}

export interface DesignSpecs {
  primaryLayout: string;
  colorScheme: string;
  typography: string;
  spacing: string;
  visualFlow: string;
  educationalStrategy: string;
  interactionReadiness: string; // Step4 준비 상태
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
  tokensUsed?: number;
  fallback?: boolean;
}

// Step 4: 애니메이션/상호작용 (요소 중심)
export interface PageEnhancement {
  pageId: string;
  pageTitle: string;
  elementInteractions: ElementInteraction[];
  pageTransitions: PageTransitions;
  globalAnimations: GlobalAnimations;
}

export interface ElementInteraction {
  elementId: string;
  elementType: string;
  staticState: StaticState;
  loadAnimation: LoadAnimation;
  interactionStates: InteractionStates;
  feedbackAnimations: FeedbackAnimations;
  educationalEnhancements: EducationalEnhancements;
  technicalSpecs: TechnicalSpecs;
}

export interface StaticState {
  description: string;
  initialStyling: { [key: string]: any };
}

export interface LoadAnimation {
  type: string;
  duration: string;
  delay: string;
  timing: string;
  keyframes: string;
  educationalPurpose: string;
}

export interface InteractionStates {
  hover?: InteractionState;
  focus?: InteractionState;
  active?: InteractionState;
  disabled?: InteractionState;
  [key: string]: InteractionState | undefined;
}

export interface InteractionState {
  description: string;
  styling: { [key: string]: any };
  additionalEffects: string;
}

export interface FeedbackAnimations {
  success?: FeedbackAnimation;
  error?: FeedbackAnimation;
  loading?: FeedbackAnimation;
  [key: string]: FeedbackAnimation | undefined;
}

export interface FeedbackAnimation {
  trigger: string;
  animation: string;
  duration: string;
}

export interface EducationalEnhancements {
  learningSupport: string;
  specialInteractions: SpecialInteraction[];
}

export interface SpecialInteraction {
  name: string;
  description: string;
  trigger: string;
  effect: string;
  purpose: string;
}

export interface TechnicalSpecs {
  cssClasses: string[];
  jsEvents: string[];
  accessibility: AccessibilitySpecs;
}

export interface AccessibilitySpecs {
  ariaLabels: string;
  keyboardSupport: string;
  screenReader: string;
}

export interface PageTransitions {
  pageLoad: PageLoadSequence;
  pageExit: PageExitAnimation;
}

export interface PageLoadSequence {
  sequence: LoadSequenceStep[];
}

export interface LoadSequenceStep {
  elements: string[];
  delay: string;
  description: string;
}

export interface PageExitAnimation {
  description: string;
  animation: string;
}

export interface GlobalAnimations {
  scrollBehavior: string;
  responsiveAnimations: string;
  performanceOptimizations: string;
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