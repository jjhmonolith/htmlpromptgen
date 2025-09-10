import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity, LayoutProposal, PageEnhancement } from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class PageEnhancementService {
  private openaiService = OpenAIService.getInstance();

  async generatePageEnhancements(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[]
  ): Promise<PageEnhancement[]> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    try {
      const prompt = this.buildPrompt(projectData, visualIdentity, layoutProposals);
      const response = await this.openaiService.generateCompletion(prompt);
      
      // JSON 파싱 시도
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      // 페이지별 애니메이션 제안으로 변환
      const pageEnhancements: PageEnhancement[] = layoutProposals.map((layout, index) => {
        const pageEnhancement = parsedResponse.pages[index] || parsedResponse.pages[0];
        
        return {
          pageId: layout.pageId,
          animations: pageEnhancement.animations || [],
          interactions: pageEnhancement.interactions || [],
          gamification: pageEnhancement.gamification || {
            type: '없음',
            description: '기본 학습 경험',
            rewards: '없음'
          },
          microAnimations: pageEnhancement.microAnimations || [],
          transitions: pageEnhancement.transitions || {
            pageEntry: 'fade-in 0.5s ease-out',
            pageExit: 'fade-out 0.3s ease-in',
            elementTransitions: 'smooth 0.2s'
          }
        };
      });

      return pageEnhancements;

    } catch (error) {
      console.error('페이지 애니메이션 생성 실패:', error);
      throw new Error(`페이지 애니메이션 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private buildPrompt(
    projectData: ProjectData, 
    visualIdentity: VisualIdentity, 
    layoutProposals: LayoutProposal[]
  ): string {
    const animationGuidelines = LayoutPromptService.getAnimationGuidelines(projectData.layoutMode);
    const layoutContext = LayoutPromptService.getLayoutContext(projectData);
    
    return `
당신은 교육 콘텐츠 UX/UI 애니메이션 전문가입니다.
다음 프로젝트의 애니메이션 및 상호작용을 설계해주세요.

${layoutContext}

## 비주얼 아이덴티티 정보
- 무드 & 톤: ${visualIdentity.moodAndTone}
- 색상 팔레트: Primary ${visualIdentity.colorPalette.primary}, Accent ${visualIdentity.colorPalette.accent}
- 컴포넌트 스타일: ${visualIdentity.componentStyle}

${animationGuidelines}

## 레이아웃 정보
${layoutProposals.map((layout, index) => `
**페이지 ${index + 1}: ${layout.pageTitle}**
- 구조: ${layout.layout.structure}
- 메인 콘텐츠: ${layout.layout.mainContent}
- 시각적 요소: ${layout.layout.visualElements}
- 이미지 수: ${layout.images.length}개
- 콘텐츠 블록 수: ${layout.contentBlocks.length}개
`).join('')}

다음 JSON 형식으로 응답해주세요:

{
  "pages": [
    {
      "pageNumber": 1,
      "animations": [
        {
          "element": "대상 요소 선택자",
          "type": "${projectData.layoutMode === 'scrollable' ? 'scroll-triggered|entrance|progressive' : 'entrance|attention|focus'}",
          "trigger": "${projectData.layoutMode === 'scrollable' ? 'intersection|scroll-position' : 'load|hover|click'}",
          "duration": "애니메이션 지속 시간"
        }
      ],
      "interactions": [
        {
          "element": "상호작용 요소",
          "action": "사용자 행동",
          "response": "시스템 반응"
        }
      ],
      "gamification": {
        "type": "게이미피케이션 유형",
        "description": "설명",
        "rewards": "보상 체계"
      },
      "microAnimations": [
        {
          "trigger": "트리거 조건",
          "effect": "미세 애니메이션 효과"
        }
      ],
      "transitions": {
        "pageEntry": "페이지 진입 전환",
        "pageExit": "페이지 종료 전환",
        "elementTransitions": "요소 간 전환"
      }
    }
  ],
  "overallStrategy": {
    "animationPhilosophy": "${projectData.layoutMode === 'scrollable' ? '자연스러운 흐름과 점진적 공개' : '즉시 집중과 효율적 상호작용'}",
    "performanceConsiderations": "성능 최적화 고려사항",
    "accessibilityFeatures": "접근성 지원 기능"
  }
}

**${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'} 애니메이션 특화 요구사항:**
${projectData.layoutMode === 'scrollable' ? `
1. **Intersection Observer** 기반 뷰포트 진입 애니메이션
2. **패럴랙스 효과**로 자연스러운 깊이감 연출
3. **프로그레시브 공개** - 스크롤 진행에 따른 점진적 정보 공개
4. **스크롤 진행 표시기** 포함
5. **부드럽고 자연스러운** 애니메이션 (0.5-1.0초)
6. 긴 스크롤에도 **피로감 없는** 미묘한 효과
` : `
1. **강렬한 entrance** 애니메이션 (페이지 로드 시)
2. **즉시 집중** 유도하는 attention-grabbing 효과
3. **컴팩트한 호버** 및 클릭 피드백
4. **빠른 전환** (0.2-0.5초) - 즉시성 우선
5. **시각적 계층** 강화 애니메이션
6. 제한된 공간에서 **최대 임팩트** 달성
`}

**대상 학습자 (${projectData.targetAudience}) 고려사항:**
- 연령대에 적합한 애니메이션 속도와 복잡도
- 학습 집중도를 높이는 상호작용 설계
- 접근성과 사용성 최우선 고려

JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요.
    `;
  }
}

export const pageEnhancementService = new PageEnhancementService();