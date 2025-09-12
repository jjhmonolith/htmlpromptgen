import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';

// 페이지별 레이아웃 제안 타입
export interface PageLayoutProposal {
  pageId: string;
  pageTitle: string;
  pageNumber: number;
  layoutDescription: string; // 단순 텍스트 설명
  generatedAt: Date;
}

// Step3 결과 타입 - 페이지 배열로 단순화
export interface LayoutWireframe {
  layoutMode: 'scrollable' | 'fixed';
  pages: PageLayoutProposal[];
  generatedAt: Date;
}

export class Step3LayoutWireframeService {
  constructor(private openAIService: OpenAIService) {}

  async generateLayoutWireframe(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens
  ): Promise<LayoutWireframe> {
    try {
      console.log('📐 Step3: 레이아웃 와이어프레임 병렬 생성 시작');
      console.log('📋 프로젝트 데이터:', projectData);
      console.log('🚀 병렬 처리로 속도 개선 중...');
      
      // 모든 페이지를 병렬로 처리
      const pagePromises = projectData.pages.map(async (page, index) => {
        console.log(`📄 페이지 ${page.pageNumber} 병렬 생성 시작: ${page.topic}`);
        
        try {
          const prompt = this.createPageLayoutPrompt(page, projectData, visualIdentity, index);
          const response = await this.openAIService.generateCompletion(prompt, `Step3-Page${page.pageNumber}`);
          
          const pageProposal: PageLayoutProposal = {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: response.content.trim(),
            generatedAt: new Date()
          };
          
          console.log(`✅ 페이지 ${page.pageNumber} 병렬 생성 완료`);
          return pageProposal;
          
        } catch (error) {
          console.error(`❌ 페이지 ${page.pageNumber} 생성 실패:`, error);
          
          // 개별 페이지 실패 시 폴백
          return {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: `페이지 상단에 제목 "${page.topic}"을 큰 폰트로 배치하고, 중앙 영역에 주요 콘텐츠를 설명하는 텍스트와 함께 관련 이미지나 다이어그램을 좌우 또는 상하로 배치합니다. 하단에는 학습자의 이해를 돕는 요약 정보나 다음 단계로의 연결고리를 제공합니다.`,
            generatedAt: new Date()
          };
        }
      });
      
      console.log(`⏰ ${projectData.pages.length}개 페이지 병렬 처리 대기 중...`);
      const pageProposals = await Promise.all(pagePromises);
      
      // 페이지 번호순으로 정렬
      pageProposals.sort((a, b) => a.pageNumber - b.pageNumber);
      
      const result: LayoutWireframe = {
        layoutMode: projectData.layoutMode,
        pages: pageProposals,
        generatedAt: new Date()
      };
      
      console.log('🎯 Step3 병렬 생성 완료:', result);
      console.log(`⚡ 성능 개선: ${projectData.pages.length}개 페이지를 병렬 처리로 빠르게 완료`);
      return result;
      
    } catch (error) {
      console.error('❌ Step3 병렬 생성 실패:', error);
      
      const fallbackResult = this.createFallbackResult(projectData);
      console.log('🔄 Step3 폴백 결과 적용');
      return fallbackResult;
    }
  }

  private createPageLayoutPrompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): string {
    // 전체 페이지 흐름 정보 생성
    const allPages = projectData.pages.map((p, idx) => 
      `${p.pageNumber}. ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    // 이전/다음 페이지 정보
    const prevPage = pageIndex > 0 ? projectData.pages[pageIndex - 1] : null;
    const nextPage = pageIndex < projectData.pages.length - 1 ? projectData.pages[pageIndex + 1] : null;

    // 페이지 위치에 따른 역할 정의
    const getPageRole = (index: number, total: number) => {
      if (index === 0) return '도입페이지 (학습 동기 부여 및 전체 개요)';
      if (index === total - 1) return '마무리페이지 (요약 및 후속 학습 연결)';
      if (index === 1) return '핵심 개념 페이지 (주요 내용 설명)';
      return '전개페이지 (구체적 내용 및 예시)';
    };

    const pageRole = getPageRole(pageIndex, projectData.pages.length);

    return `교육용 페이지의 레이아웃을 전체 학습 흐름을 고려하여 설계해주세요.

**프로젝트 정보:**
- 제목: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 레이아웃 모드: ${projectData.layoutMode}
- 콘텐츠 모드: ${projectData.contentMode}

**전체 페이지 흐름 (총 ${projectData.pages.length}개):**
${allPages}

**현재 설계할 페이지:**
- 페이지 번호: ${page.pageNumber}/${projectData.pages.length}
- 주제: ${page.topic}
- 설명: ${page.description || ''}
- 페이지 역할: ${pageRole}

**페이지 연결 맥락:**
${prevPage ? `- 이전 페이지: "${prevPage.topic}" - 이 내용을 받아서 시작` : '- 첫 번째 페이지 - 학습자의 관심을 끌고 동기를 부여'}
${nextPage ? `- 다음 페이지: "${nextPage.topic}" - 이 내용으로 자연스럽게 연결` : '- 마지막 페이지 - 학습 내용을 정리하고 마무리'}

**디자인 스타일:**
- 분위기: ${visualIdentity.moodAndTone.join(', ')}
- 주색상: ${visualIdentity.colorPalette.primary}
- 컴포넌트 스타일: ${visualIdentity.componentStyle}

이 페이지의 레이아웃을 전체 학습 흐름과 맥락을 고려하여 자연스러운 문장으로 설명해주세요:

1. **페이지 구조**: 상단, 중간, 하단 영역의 역할
2. **콘텐츠 배치**: 텍스트, 이미지, 다이어그램의 효과적 배치
3. **학습 연결**: 이전 페이지와의 연결점, 다음 페이지로의 전환 방법
4. **교육적 고려사항**: 대상 연령에 맞는 시각적 요소와 상호작용
5. **페이지 역할 반영**: ${pageRole}에 맞는 특별한 레이아웃 특징

설명은 구체적이고 실행 가능하게 작성해주세요 (250-350자 내외).`;
  }

  private createFallbackResult(projectData: ProjectData): LayoutWireframe {
    const fallbackPages: PageLayoutProposal[] = projectData.pages.map(page => ({
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,
      layoutDescription: `페이지 상단에 제목 "${page.topic}"을 큰 폰트로 배치하고, 중앙 영역에 주요 콘텐츠를 설명하는 텍스트와 함께 관련 이미지나 다이어그램을 좌우 또는 상하로 배치합니다. 하단에는 학습자의 이해를 돕는 요약 정보나 다음 단계로의 연결고리를 제공합니다.`,
      generatedAt: new Date()
    }));

    return {
      layoutMode: projectData.layoutMode,
      pages: fallbackPages,
      generatedAt: new Date()
    };
  }
}