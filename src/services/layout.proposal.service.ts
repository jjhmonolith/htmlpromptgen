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
      const response = await this.openaiService.generateCompletion(
        prompt, 
        `Step3 레이아웃 생성 (${projectData.pages.length}페이지)`
      );
      
      // JSON 파싱 시도 - 코드 블록 제거 후 파싱
      let parsedResponse;
      try {
        // GPT-4o가 ```json 코드 블록으로 감쌀 수 있으므로 제거
        let cleanedResponse = response.content.trim();
        
        // 코드 블록 마커 제거
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
        }
        if (cleanedResponse.endsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
        }
        
        // 추가적인 마크다운 제거
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        console.error('원본 응답:', response.content);
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      // 토큰 사용량 상세 정보 로그
      if (response.usage) {
        console.group(`📊 레이아웃 생성 완료 - 상세 분석`);
        console.log(`📄 처리된 페이지 수: ${projectData.pages.length}개`);
        console.log(`🎯 레이아웃 모드: ${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'}`);
        console.log(`📐 페이지당 평균 토큰: ${Math.round(response.usage.total_tokens / projectData.pages.length)}개`);
        
        // 페이지별 예상 토큰 분배
        projectData.pages.forEach((page, index) => {
          const avgTokensPerPage = Math.round(response.usage.total_tokens / projectData.pages.length);
          console.log(`  └ 페이지 ${page.pageNumber} (${page.topic}): ~${avgTokensPerPage} 토큰`);
        });
        console.groupEnd();
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

**중요: 이미지 description은 AI 이미지 생성 도구(DALL-E, Midjourney 등)에서 바로 사용할 수 있도록 매우 구체적으로 작성해주세요:**
- 스타일: 사진, 일러스트, 벡터, 미니멀 등
- 구도: 정면, 측면, 버드아이뷰, 클로즈업 등
- 색상톤: 파스텔, 비비드, 모노톤, 웜톤, 쿨톤 등
- 분위기: 전문적인, 친근한, 모던한, 클래식한 등
- 객체와 배경: 구체적인 사물, 인물, 환경 묘사

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
          "description": "AI 이미지 생성용 상세 프롬프트 (스타일, 구도, 색상, 분위기, 객체 등을 포함한 매우 구체적인 설명으로 작성)",
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