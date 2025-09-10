import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { 
  ProjectData, 
  VisualIdentity, 
  LayoutProposal, 
  PageEnhancement, 
  FinalPrompt 
} from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class FinalPromptService {
  private openaiService = OpenAIService.getInstance();

  async generateFinalPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): Promise<FinalPrompt> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    try {
      const prompt = this.buildPrompt(projectData, visualIdentity, layoutProposals, pageEnhancements);
      const response = await this.openaiService.generateCompletion(prompt);
      
      // JSON 파싱 시도
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      const finalPrompt: FinalPrompt = {
        htmlPrompt: parsedResponse.htmlPrompt || '',
        imagePrompts: parsedResponse.imagePrompts || [],
        metadata: {
          generatedAt: new Date(),
          totalTokens: parsedResponse.metadata?.estimatedTokens || 0,
          version: '1.0'
        }
      };

      return finalPrompt;

    } catch (error) {
      console.error('최종 프롬프트 생성 실패:', error);
      throw new Error(`최종 프롬프트 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private buildPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): string {
    const layoutRules = LayoutPromptService.getLayoutRules(projectData.layoutMode);
    const layoutContext = LayoutPromptService.getLayoutContext(projectData);
    
    return `
당신은 교육 콘텐츠 개발 전문가입니다.
모든 설계 정보를 종합하여 최종 HTML/CSS 구현 프롬프트와 이미지 생성 프롬프트를 작성해주세요.

${layoutContext}

## 1. 비주얼 아이덴티티
- **무드 & 톤**: ${visualIdentity.moodAndTone}
- **색상 팔레트**: 
  - Primary: ${visualIdentity.colorPalette.primary}
  - Secondary: ${visualIdentity.colorPalette.secondary} 
  - Accent: ${visualIdentity.colorPalette.accent}
  - Text: ${visualIdentity.colorPalette.text}
  - Background: ${visualIdentity.colorPalette.background}
- **타이포그래피**: ${visualIdentity.typography.headingFont} / ${visualIdentity.typography.bodyFont} (${visualIdentity.typography.baseSize})
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}

${layoutRules}

## 2. 페이지별 레이아웃 정보
${layoutProposals.map((layout, index) => `
### 페이지 ${index + 1}: ${layout.pageTitle}
**레이아웃 구조**: ${layout.layout.structure}
**메인 콘텐츠**: ${layout.layout.mainContent}  
**시각적 요소**: ${layout.layout.visualElements}
**이미지**: ${layout.images.map(img => `${img.filename} - ${img.description}`).join(', ')}
**콘텐츠 블록**: ${layout.contentBlocks.length}개 블록
`).join('')}

## 3. 애니메이션 및 상호작용
${pageEnhancements.map((enhancement, index) => `
### 페이지 ${index + 1} 애니메이션
**애니메이션**: ${enhancement.animations.map(anim => `${anim.element}: ${anim.type} (${anim.trigger})`).join(', ')}
**상호작용**: ${enhancement.interactions.map(inter => `${inter.element} ${inter.action} → ${inter.response}`).join(', ')}
**게이미피케이션**: ${enhancement.gamification.type} - ${enhancement.gamification.description}
**전환 효과**: ${enhancement.transitions.pageEntry}
`).join('')}

다음 JSON 형식으로 응답해주세요:

{
  "htmlPrompt": "# ${projectData.projectTitle} - ${projectData.layoutMode === 'scrollable' ? '스크롤 가능' : '고정 크기'} 교육 콘텐츠\\n\\n## 프로젝트 개요\\n- 대상: ${projectData.targetAudience}\\n- 레이아웃: ${projectData.layoutMode === 'scrollable' ? '📜 스크롤 가능 (1600px 고정폭, 자유 높이)' : '📐 고정 크기 (1600x1000px)'}\\n- 콘텐츠: ${projectData.contentMode === 'enhanced' ? '✨ AI 보강 모드' : '📝 원본 유지 모드'}\\n\\n## 디자인 시스템\\n### 색상 팔레트\\n- Primary: ${visualIdentity.colorPalette.primary}\\n- Secondary: ${visualIdentity.colorPalette.secondary}\\n- Accent: ${visualIdentity.colorPalette.accent}\\n- Text: ${visualIdentity.colorPalette.text}\\n- Background: ${visualIdentity.colorPalette.background}\\n\\n### 타이포그래피\\n- 제목: ${visualIdentity.typography.headingFont}\\n- 본문: ${visualIdentity.typography.bodyFont}\\n- 기본 크기: ${visualIdentity.typography.baseSize}\\n\\n${layoutRules}\\n\\n## 공통 개발 규칙\\n1. **반응형 설계**: 1600px 기준, 모바일 대응\\n2. **접근성**: WCAG 2.1 AA 준수\\n3. **성능**: 최적화된 이미지, 효율적 CSS\\n4. **SEO**: 의미론적 HTML 구조\\n5. **브라우저 호환**: 모던 브라우저 지원\\n\\n## 페이지별 상세 구현\\n${this.buildPageImplementations(projectData, layoutProposals, pageEnhancements)}",
  
  "imagePrompts": [
    ${layoutProposals.flatMap(layout => 
      layout.images.map(img => `{
        "pageId": "${layout.pageId}",
        "imageName": "${img.filename}",
        "prompt": "${projectData.targetAudience}를 위한 교육 콘텐츠용 이미지. ${img.description}. 스타일: ${visualIdentity.moodAndTone}, 색상: ${visualIdentity.colorPalette.primary} 계열, ${projectData.layoutMode === 'scrollable' ? '부드럽고 친근한' : '선명하고 임팩트 있는'} 비주얼, 고품질 교육 자료"
      }`).join(',\n    ')
    )}
  ],
  
  "metadata": {
    "layoutMode": "${projectData.layoutMode}",
    "contentMode": "${projectData.contentMode}", 
    "totalPages": ${projectData.pages.length},
    "estimatedTokens": ${this.estimateTokenCount(projectData, layoutProposals)},
    "generatedAt": "${new Date().toISOString()}",
    "designPrinciples": [
      "${projectData.layoutMode === 'scrollable' ? '콘텐츠 우선 접근' : '공간 효율 극대화'}",
      "${projectData.layoutMode === 'scrollable' ? '자연스러운 흐름' : '즉시 이해 가능'}",
      "${projectData.layoutMode === 'scrollable' ? '충분한 여백' : '압축적 표현'}",
      "접근성 최우선",
      "교육적 효과 극대화"
    ]
  }
}

**${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'} 최종 통합 요구사항:**
${projectData.layoutMode === 'scrollable' ? `
1. **자유로운 세로 확장** - 콘텐츠 양에 따라 높이 조정
2. **자연스러운 스크롤 경험** - 부드러운 애니메이션과 진행 표시
3. **점진적 정보 공개** - Intersection Observer 활용
4. **충분한 여백과 간격** - 피로감 없는 읽기 환경
5. **모바일 최적화** - 터치 스크롤 친화적 설계
` : `
1. **엄격한 1600x1000px 준수** - overflow: hidden 적용
2. **최대 정보 밀도** - 여백 최소화, 콘텐츠 압축
3. **즉시 완결된 경험** - 스크롤 없이 모든 정보 제공  
4. **강력한 시각적 임팩트** - 첫인상으로 완전 이해
5. **픽셀 퍼펙트 정밀도** - 모든 요소의 정확한 배치
`}

JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요.
    `;
  }

  private buildPageImplementations(
    projectData: ProjectData,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): string {
    return layoutProposals.map((layout, index) => {
      const enhancement = pageEnhancements[index];
      const page = projectData.pages[index];
      
      return `
### 페이지 ${page.pageNumber}: ${layout.pageTitle}

**HTML 구조:**
\`\`\`html
<section class="page-${page.pageNumber} ${projectData.layoutMode}-layout">
  <header class="page-header">
    <h1>${layout.pageTitle}</h1>
  </header>
  
  ${layout.contentBlocks.map(block => `
  <div class="content-block content-${block.type}" data-order="${block.order}">
    ${block.content}
  </div>`).join('')}
  
  ${layout.images.map(img => `
  <figure class="page-image" data-position="${img.position}">
    <img src="${img.filename}" alt="${img.description}" />
  </figure>`).join('')}
</section>
\`\`\`

**CSS 스타일:**
- 레이아웃: ${layout.layout.structure}
- 메인 콘텐츠: ${layout.layout.mainContent}
- 시각적 요소: ${layout.layout.visualElements}

**애니메이션:**
${enhancement?.animations.map(anim => `- ${anim.element}: ${anim.type} (${anim.duration})`).join('\n') || '- 기본 fade-in 애니메이션'}

**상호작용:**
${enhancement?.interactions.map(inter => `- ${inter.action} → ${inter.response}`).join('\n') || '- 기본 호버 효과'}
`;
    }).join('\n');
  }

  private estimateTokenCount(projectData: ProjectData, layoutProposals: LayoutProposal[]): number {
    // 기본 프롬프트 + 페이지당 평균 토큰 수 추정
    const baseTokens = 2000;
    const tokensPerPage = projectData.layoutMode === 'scrollable' ? 800 : 600;
    return baseTokens + (layoutProposals.length * tokensPerPage);
  }
}

export const finalPromptService = new FinalPromptService();