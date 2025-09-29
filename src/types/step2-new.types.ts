import { VisualIdentity, DesignTokens, ProjectData } from './workflow.types';

// Step2 새로운 출력 인터페이스
export interface Step2NewResult {
  // 기존 비주얼 아이덴티티 (변경 없음)
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;

  // 새로 추가: 페이지별 교안 텍스트
  pageContents: PageContentResult[];

  // 전체 구성 정보
  overallFlow: string;          // 전체 페이지 흐름 설명
  educationalStrategy: string;  // 교육 전략 요약

  // 메타데이터
  generatedAt: Date;
  processingTime?: number;
}

// 페이지별 교안 콘텐츠
export interface PageContentResult {
  pageId: string;
  pageNumber: number;
  pageTitle: string;

  // 핵심: 완성된 교안 텍스트
  fullTextContent: string;    // 500-1000자의 완성된 교안

  // 부가 정보
  learningGoal: string;       // 이 페이지의 학습 목표
  keyMessage: string;         // 핵심 메시지 1줄
  imageDescription: string;   // 필요한 이미지 설명
  interactionHint: string;    // 상호작용 아이디어 1줄
}

// Step2 입력 인터페이스 (확장)
export interface Step2IntegratedInput {
  projectData: ProjectData;
  layoutMode: 'fixed' | 'scrollable';
  contentMode: 'enhanced' | 'restricted';
}

// AI 응답 파싱을 위한 인터페이스
export interface Step2RawResponse {
  // 비주얼 아이덴티티 부분
  visualMood: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorText: string;
  colorBackground: string;
  headingFont: string;
  bodyFont: string;
  baseSize: string;
  componentStyle: string;

  // 페이지 콘텐츠 부분 (텍스트 파싱)
  pageContents: string; // 전체 텍스트, 정규식으로 파싱할 예정

  // 전체 구성
  overallFlow: string;
  educationalStrategy: string;
}

// 텍스트 파싱을 위한 유틸리티 타입
export interface ParsedPageContent {
  pageNumber: number;
  pageTitle: string;
  learningGoal: string;
  keyMessage: string;
  fullTextContent: string;
  imageDescription: string;
  interactionHint: string;
}