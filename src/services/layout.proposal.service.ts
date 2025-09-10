import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity, LayoutProposal } from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class LayoutProposalService {
  private openaiService = OpenAIService.getInstance();

  async generateLayoutProposals(
    projectData: ProjectData, 
    visualIdentity: VisualIdentity
  ): Promise<LayoutProposal[]> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    try {
      const prompt = this.buildPrompt(projectData, visualIdentity);
      const response = await this.openaiService.generateCompletion(prompt);
      
      // JSON 파싱 시도
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      // 페이지별 레이아웃 제안으로 변환
      const layoutProposals: LayoutProposal[] = projectData.pages.map((page, index) => {
        const pageProposal = parsedResponse.pages[index] || parsedResponse.pages[0];
        
        return {
          pageId: page.id,
          pageTitle: page.topic,
          layout: {
            structure: pageProposal.layout.structure || '',
            mainContent: pageProposal.layout.mainContent || '',
            visualElements: pageProposal.layout.visualElements || ''
          },
          images: pageProposal.images || [],
          contentBlocks: pageProposal.contentBlocks || [],
          metadata: {
            pageNumber: page.pageNumber,
            totalPages: projectData.pages.length,
            generatedAt: new Date().toISOString()
          }
        };
      });

      return layoutProposals;

    } catch (error) {
      console.error('레이아웃 제안 생성 실패:', error);
      throw new Error(`레이아웃 제안 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private buildPrompt(projectData: ProjectData, visualIdentity: VisualIdentity): string {
    const layoutRules = LayoutPromptService.getLayoutRules(projectData.layoutMode);
    const layoutContext = LayoutPromptService.getLayoutContext(projectData);
    
    return `
당신은 교육 콘텐츠 레이아웃 전문가입니다.
다음 프로젝트의 페이지별 레이아웃을 설계해주세요.

${layoutContext}

## 비주얼 아이덴티티 정보
- 무드 & 톤: ${visualIdentity.moodAndTone}
- 색상 팔레트: Primary ${visualIdentity.colorPalette.primary}, Secondary ${visualIdentity.colorPalette.secondary}
- 타이포그래피: ${visualIdentity.typography.headingFont} / ${visualIdentity.typography.bodyFont}
- 컴포넌트 스타일: ${visualIdentity.componentStyle}

${layoutRules}

## 페이지별 상세 정보
${projectData.pages.map((page, index) => `
**페이지 ${page.pageNumber}: ${page.topic}**
- 설명: ${page.description || '상세 설명 없음'}
`).join('')}

다음 JSON 형식으로 응답해주세요:

{
  "pages": [
    {
      "pageNumber": 1,
      "layout": {
        "structure": "${projectData.layoutMode === 'scrollable' ? '스크롤형 섹션 구조 (8-10개 섹션, 여유로운 간격)' : '고정형 그리드 구조 (5-6개 섹션, 압축 배치)'}",
        "mainContent": "주요 콘텐츠 배치 방법",
        "visualElements": "시각적 요소 배치 계획"
      },
      "images": [
        {
          "filename": "이미지파일명.jpg",
          "description": "이미지 설명 및 목적",
          "position": "배치 위치"
        }
      ],
      "contentBlocks": [
        {
          "type": "heading|body|point|activity",
          "content": "블록 내용",
          "order": 1
        }
      ]
    }
  ],
  "designPrinciples": {
    "layoutApproach": "${projectData.layoutMode === 'scrollable' ? '콘텐츠 우선 접근' : '공간 효율 극대화'}",
    "visualHierarchy": "시각적 계층 구조 설명",
    "userFlow": "사용자 경험 흐름"
  }
}

**${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'} 특화 요구사항:**
${projectData.layoutMode === 'scrollable' ? `
1. 콘텐츠 양에 따라 **자유롭게 확장**되는 구조
2. 섹션 간 **충분한 간격** (60-80px) 확보
3. **자연스러운 읽기 흐름** 유지
4. 스크롤 진행 상황 **시각적 안내**
5. **길이 제한 없이** 상세한 정보 제공
` : `
1. **정확히 1600x1000px** 프레임 내 완결
2. **여백 최소화**로 콘텐츠 밀도 극대화
3. **즉시 이해** 가능한 직관적 레이아웃
4. **픽셀 단위 정확도**로 최적화
5. 모든 정보가 **한 화면에 완결**
`}

JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요.
    `;
  }
}

export const layoutProposalService = new LayoutProposalService();