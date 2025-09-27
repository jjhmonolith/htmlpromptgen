// Fixed TypeError: not a function error
import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, QualityMetrics } from '../types/workflow.types';
import {
  EducationalDesignResult,
  EducationalPageDesign,
  EmotionalContext,
  ComponentSpec,
  InteractionSpec,
  ContentData,
  LayoutValidation
} from '../types/educational-design.types';

/**
 * 🎓 Educational Design Service
 *
 * 수정된 접근법: AI가 구체적이고 실용적인 교육 설계를 제공하고,
 * 개발자가 시각적 디테일과 사용자 경험을 완성하는 전문 분업 시스템
 */
export class EducationalDesignService {
  constructor(private openAIService: OpenAIService) {}

  async generateEducationalDesign(
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<EducationalDesignResult> {
    console.log('🎓 Educational Design Service: 교육 설계 생성 시작');
    console.log(`📐 레이아웃 모드: ${projectData.layoutMode}`);
    console.log(`🎯 콘텐츠 모드: ${projectData.contentMode}`);

    const startTime = Date.now();

    // 레이아웃 모드 검증 및 처리
    const layoutModeInfo = this.validateAndProcessLayoutMode(projectData);
    console.log(`✅ 레이아웃 검증 완료: ${layoutModeInfo.mode} (${layoutModeInfo.constraints})`);

    // 감성 컨텍스트 준비
    const emotionalContext = this.createEmotionalContext(visualIdentity);

    // 전체 프로젝트 개요 생성
    const projectOverview = {
      title: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      layoutMode: projectData.layoutMode,
      contentMode: projectData.contentMode,
      overallLearningGoals: this.inferLearningGoals(projectData),
      educationalApproach: this.determineEducationalApproach(projectData, emotionalContext),
      layoutConstraints: layoutModeInfo.constraints
    };

    // 공간 제약 정보 (개선된 버전)
    const spaceConstraints = {
      mode: projectData.layoutMode,
      dimensions: layoutModeInfo.dimensions,
      criticalReminders: this.getSpaceConstraintReminders(projectData.layoutMode),
      heightBudget: layoutModeInfo.heightBudget,
      contentStrategy: this.getContentStrategyByMode(projectData.contentMode)
    };

    // 페이지별 설계 생성 (병렬 처리)
    console.log(`🚀 ${projectData.pages.length}개 페이지 병렬 생성 시작`);

    const pagePromises = projectData.pages.map(async (page, i) => {
      console.log(`📐 페이지 ${page.pageNumber} 교육 설계 시작: ${page.topic}`);

      try {
        const pageDesign = await this.generatePageDesign(
          page,
          projectData,
          emotionalContext,
          i,
          projectData.pages.length
        );
        console.log(`✅ 페이지 ${page.pageNumber} 설계 완료: ${page.topic}`);
        return pageDesign;
      } catch (error) {
        console.error(`❌ 페이지 ${page.pageNumber} 설계 실패:`, error);
        return this.createFallbackPageDesign(page);
      }
    });

    const pageDesigns = await Promise.all(pagePromises);
    console.log(`🎉 모든 페이지 병렬 생성 완료: ${pageDesigns.length}개`);

    const result: EducationalDesignResult = {
      projectOverview,
      designPhilosophy: this.generateDesignPhilosophy(projectData, emotionalContext),
      spaceConstraints,
      pageDesigns,
      globalGuidelines: this.generateGlobalGuidelines(emotionalContext, projectData.layoutMode),
      developerResources: this.generateDeveloperResources(projectData.layoutMode),
      generatedAt: new Date(),
      processingTime: Date.now() - startTime
    };

    console.log(`🎉 교육 설계 완료: ${result.pageDesigns.length}개 페이지, ${result.processingTime}ms`);
    return result;
  }

  private async generatePageDesign(
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    pageIndex: number,
    totalPages: number
  ): Promise<EducationalPageDesign> {

    const prompt = this.createEducationalDesignPrompt(
      page,
      projectData,
      emotionalContext,
      pageIndex,
      totalPages
    );

    const response = await this.openAIService.generateCompletion(prompt, 'Educational Design');

    let finalResponse = response.content;
    let layoutValidation = { isValid: true, suggestions: [] };

    return this.parseEducationalDesign(finalResponse, page, projectData, emotionalContext, prompt, finalResponse, layoutValidation);
  }

  private createEducationalDesignPrompt(
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    pageIndex: number,
    totalPages: number
  ): string {
    // 페이지 컨텍스트 생성
    const prevPageContext = pageIndex > 0
      ? `이전 페이지: ${projectData.pages[pageIndex - 1]?.topic || '없음'}`
      : '첫 번째 페이지입니다';

    const nextPageContext = pageIndex < totalPages - 1
      ? `다음 페이지: ${projectData.pages[pageIndex + 1]?.topic || '없음'}`
      : '마지막 페이지입니다';

    const suggestionsText = projectData.additionalRequirements
      ? `\n- 추가 요구사항: ${projectData.additionalRequirements}`
      : '';

    const visualIdentity = {
      moodAndTone: emotionalContext.overallTone,
      layoutPhilosophy: projectData.layoutMode === 'scrollable'
        ? '세로 스크롤을 통한 자연스러운 콘텐츠 전개'
        : '한 화면에 모든 내용을 효과적으로 배치'
    };

    // 콘텐츠 모드별 차별화 전략
    const getContentModeStrategy = (mode: string): string => {
      switch (mode) {
        case 'enhanced':
          return `
### 🎯 Enhanced 모드 (AI 보강)
- **시각적 요소 추가**: 차트, 그래프, 다이어그램을 시각적 설명으로 설계
- 텍스트 요약하고 인포그래픽 형태로 구성 설명
- 여백과 타이포그래피로 시각적 완성도 향상
- 동적 요소와 인터랙션으로 학습 효과 극대화
- **이미지 사용 최소화**: 실제 사진이 아닌 모든 시각화는 설명으로 처리`;
        case 'restricted':
          return `
### 🎯 Restricted 모드 (그대로 사용)
- 주어진 콘텐츠만 사용, 추가 생성 금지
- 레이아웃 최적화에만 집중
- 긴 텍스트는 여러 컬럼으로 분할
- 기존 내용의 가독성 최대화
- **시각적 설명만 사용**: 어떤 시각화도 이미지로 대체하지 않음`;
        default:
          return '';
      }
    };

    // 콘텐츠 모드 전략을 미리 계산
    const contentModeStrategy = getContentModeStrategy(projectData.contentMode);

    // 새로운 사용자 제시 프롬프트 방식 적용
    if (projectData.layoutMode === 'fixed') {
      return this.createNewFixedLayoutPrompt(projectData, emotionalContext.visualIdentity, page, pageIndex, totalPages);
    } else {
      return this.createNewScrollableLayoutPrompt(projectData, emotionalContext.visualIdentity, page, pageIndex, totalPages);
    }
  }

  // 새로운 Fixed Layout 프롬프트 (사용자 제시 방식)
  private createNewFixedLayoutPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    const contentMode = projectData.contentMode === 'enhanced' ? 'original' : 'enhanced';
    const contentPolicy = contentMode === 'original'
      ? '사용자가 제공한 페이지 주제의 내용만을 정확히 사용하여 레이아웃을 구성하세요. 추가적인 내용을 생성하지 마시고, 주어진 주제를 효과적으로 시각화하는 레이아웃과 디자인을 상세히 설명하세요. 레이아웃 구성, 섹션 배치, 시각적 요소의 배열은 자세히 서술하되, 내용은 주제에서 벗어나지 마세요.'
      : '제공된 페이지 주제를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠를 만드세요. 학습자의 이해를 돕는 추가 설명, 예시, 시각 자료 등을 자유롭게 제안하세요.';

    return `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 구성해주세요.

### 📌 콘텐츠 생성 방침
${contentPolicy}

${this.formatNewVisualIdentitySection(visualIdentity)}

${this.formatNewProjectContextSection(projectData, page, pageIndex, totalPages)}

### 📜 핵심 규칙
1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.
2.  **공간 최적화**: 콘텐츠를 화면에 효과적으로 배치하여 어색한 빈 공간이 생기지 않도록 하세요.
3.  **이미지 최소화**: 학습에 필수적인 이미지만 사용하고, 장식용 이미지는 피하세요.
4.  **구조화된 이미지 섹션**: 이미지가 필요한 경우 응답 끝에 다음 형식으로 분리해주세요:

=== REQUIRED IMAGES ===
1. filename: "1.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"

2. filename: "2.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"
=== END IMAGES ===

**중요**: filename은 반드시 "1.png", "2.png", "3.png" 형태의 **숫자.png** 형식만 사용하세요. 다른 이름 (예: hero.png, diagram.png)은 절대 사용하지 마세요!
5.  **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.
6.  **전체 일관성**: 프로젝트 전체의 흐름과 일관성을 유지하면서 현재 페이지의 특색을 살려주세요.

### 🚫 절대 금지 사항
- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.
- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.
- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.
- **이미지 파일명 규칙**: 이미지 파일명은 "1.png", "2.png", "3.png"만 사용하세요. hero.png, diagram.png, icon.png 같은 설명적 이름은 금지입니다!

${this.formatNewProjectInfoSection(projectData)}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 상세히 서술해주세요. 반드시 레이아웃 구조와 디자인을 구체적으로 설명해야 합니다.

⚠️ **파일명 규칙 재확인**: 이미지 파일명은 절대 "1.png", "2.png", "3.png" 외에는 사용하지 마세요.
  - ✅ 올바른 예: "1.png", "2.png"
  - ❌ 잘못된 예: "hero.png", "diagram.png", "main-image.png", "icon.png"`;
  }

  // 새로운 Scrollable Layout 프롬프트 (사용자 제시 방식)
  private createNewScrollableLayoutPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    const contentMode = projectData.contentMode === 'enhanced' ? 'enhanced' : 'original';
    const contentPolicy = contentMode === 'enhanced'
      ? '제공된 페이지 주제를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠를 만드세요. 학습자의 이해를 돕는 추가 설명, 예시, 시각 자료 등을 자유롭게 제안하세요.'
      : '사용자가 제공한 페이지 주제의 내용만을 정확히 사용하여 레이아웃을 구성하세요. 추가적인 내용을 생성하지 마시고, 주어진 주제를 효과적으로 시각화하는 레이아웃과 디자인을 상세히 설명하세요. 레이아웃 구성, 섹션 배치, 시각적 요소의 배열은 자세히 서술하되, 내용은 주제에서 벗어나지 마세요.';

    return `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 가로 1600px 고정, 세로는 콘텐츠에 맞게 자유롭게 확장되는 스크롤 가능한 레이아웃을 구성해주세요.

### :압정: 콘텐츠 생성 방침
${contentPolicy}

### :반짝임: 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone.join(', ')}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.

${this.formatNewProjectContextSection(projectData, page, pageIndex, totalPages)}

### :스크롤: 핵심 규칙
1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.
2.  **콘텐츠 우선**: 콘텐츠의 완전한 전달을 우선시하고, 적절한 여백으로 가독성을 확보하세요.
3.  **이미지 최소화**: 학습에 필수적인 이미지만 사용하고, 장식용 이미지는 피하세요.
4.  **구조화된 이미지 섹션**: 이미지가 필요한 경우 응답 끝에 다음 형식으로 분리해주세요:

=== REQUIRED IMAGES ===
1. filename: "1.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"

2. filename: "2.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"
=== END IMAGES ===

**중요**: filename은 반드시 "1.png", "2.png", "3.png" 형태의 **숫자.png** 형식만 사용하세요. 다른 이름 (예: hero.png, diagram.png)은 절대 사용하지 마세요!
5.  **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.
6.  **전체 일관성**: 프로젝트 전체의 흐름과 일관성을 유지하면서 현재 페이지의 특색을 살려주세요.

### :출입금지_기호: 절대 금지 사항
- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.
- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.
- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.
- **이미지 파일명 규칙**: 이미지 파일명은 "1.png", "2.png", "3.png"만 사용하세요. hero.png, diagram.png, icon.png 같은 설명적 이름은 금지입니다!

### :메모: 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 사용자 추가 제안사항: ${projectData.additionalRequirements || '특별한 요구사항 없음'}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 상세히 서술해주세요. 반드시 레이아웃 구조와 디자인을 구체적으로 설명해야 합니다.

:경고: **파일명 규칙 재확인**: 이미지 파일명은 절대 "1.png", "2.png", "3.png" 외에는 사용하지 마세요.
   - :흰색_확인_표시: 올바른 예: "1.png", "2.png"
   - :x: 잘못된 예: "hero.png", "diagram.png", "main-image.png", "icon.png"`;
  }

  // 새로운 비주얼 아이덴티티 섹션 포맷터
  private formatNewVisualIdentitySection(visualIdentity: VisualIdentity): string {
    return `### :반짝임: 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentity.moodAndTone.join(', ')}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.`;
  }

  // 새로운 프로젝트 컨텍스트 섹션 포맷터 (아하모먼트 제거)
  private formatNewProjectContextSection(
    projectData: ProjectData,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    // 전체 프로젝트 구성 정보 생성
    const projectOverview = projectData.pages.map((p, idx) =>
      `페이지 ${p.pageNumber}: ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    // 페이지 컨텍스트 정보
    const pageContext = pageIndex === 0
      ? '첫 페이지입니다'
      : `이전 페이지: ${projectData.pages[pageIndex - 1]?.topic || '없음'}`;

    const nextPageInfo = pageIndex < totalPages - 1
      ? `다음 페이지: ${projectData.pages[pageIndex + 1]?.topic || '없음'}`
      : '마지막 페이지입니다';

    return `### :둥근_압핀: 전체 프로젝트 구성
${projectOverview}

### :둥근_압핀: 페이지 컨텍스트
- ${pageContext}
- **현재 페이지 ${page.pageNumber}: ${page.topic}**
- ${nextPageInfo}`;
  }

  // 새로운 프로젝트 정보 섹션 포맷터
  private formatNewProjectInfoSection(projectData: ProjectData): string {
    return `### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 사용자 추가 제안사항: ${projectData.additionalRequirements || '특별한 요구사항 없음'}`;
  }

  private parseEducationalDesign(
    response: string,
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    originalPrompt?: string,
    originalResponse?: string,
    layoutValidation?: LayoutValidation
  ): EducationalPageDesign {
    console.log(`✅ 페이지 ${page.pageNumber} 간소화된 파싱 시작`);

    // 새로운 간소화된 접근법: 전체 응답을 fullDescription으로 저장하고 기본 구조만 제공
    return {
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,

      // 📋 AI의 전체 창의적 레이아웃 설명 (새 프롬프트 결과)
      fullDescription: response.trim(),

      // 📋 기본 구조 (안정성 보장)
      learningObjectives: [`${page.topic} 이해`, '핵심 개념 파악', '실용적 적용'],
      educationalStrategy: '창의적 레이아웃 기반 학습',

      layoutStructure: {
        areas: [
          {
            id: 'creative-layout',
            description: 'AI가 제안한 창의적 레이아웃',
            purpose: '비주얼 아이덴티티 기반 교육 콘텐츠',
            sizeGuide: projectData.layoutMode === 'fixed' ? '1600×1000px' : '1600×가변px'
          }
        ]
      },

      content: {
        heading: page.topic,
        bodyText: page.description || `${page.topic}에 대한 창의적 교육 콘텐츠`,
        keyPoints: ['시각적 계층', '창의적 디자인', '교육 효과']
      },

      components: [
        {
          id: 'creative-design',
          type: 'text',
          position: { area: '전체 영역', priority: 1 },
          size: { guideline: '전체 캔버스', responsive: false },
          content: { primary: '비주얼 아이덴티티 기반 창의적 레이아웃' },
          purpose: 'AI 제안 레이아웃 구현'
        }
      ],

      interactions: [
        {
          id: 'layout-interaction',
          trigger: 'AI 제안 기반',
          action: '창의적 상호작용',
          purpose: '교육 효과 극대화',
          feedback: '비주얼 피드백'
        }
      ],

      // 새로운 [IMAGE: filename | prompt] 형식으로 이미지 파싱
      mediaAssets: this.parseAndGenerateImages(response, page, projectData, emotionalContext),

      designRationale: '비주얼 아이덴티티 기반 창의적 교육 설계',
      implementationHints: 'AI 제안 레이아웃을 그대로 구현',
      uxConsiderations: '자유로운 창의적 사용자 경험',

      isComplete: true,
      generatedAt: new Date(),

      // 디버그 정보 (옵션)
      debugInfo: originalPrompt && originalResponse ? {
        originalPrompt,
        originalResponse,
        parsedSections: { fullContent: response.substring(0, 200) + '...' },
        layoutValidation
      } : undefined
    };
  }

  // Phase 2 단순화: 복잡한 파싱 제거
  // 이제 사용하지 않음 - fullDescription + 기본 구조만 사용
  private parseResponseSections(response: string): Record<string, string> {
    // 단순화된 접근: 전체 텍스트만 보존
    return {
      fullContent: response
    };
  }

  // Phase 2 단순화: 복잡한 추출 로직 제거
  private extractLearningObjectives(sections: Record<string, string>): string[] {
    // 항상 기본 3개 학습 목표 보장
    return ['기본 개념 이해', '핵심 원리 파악', '실용적 적용 능력'];
  }

  // Phase 2 단순화: 복잡한 추출 로직 제거
  private extractContent(sections: Record<string, string>): ContentData {
    // 항상 기본 콘텐츠 구조 보장
    return {
      heading: '학습 내용',
      bodyText: '이 섹션에서 핵심 개념을 학습합니다.',
      keyPoints: ['중요 개념 1', '중요 개념 2', '중요 개념 3']
    };
  }

  // Phase 2 단순화: 기본 레이아웃만 제공
  private extractLayoutAreas(sections: Record<string, string>): any[] {
    // 항상 동일한 기본 레이아웃 구조 보장
    return [
      {
        id: 'main-area',
        description: '메인 콘텐츠 영역',
        purpose: '핵심 학습 내용 제시',
        sizeGuide: '전체 화면의 70%'
      },
      {
        id: 'side-area',
        description: '보조 정보 영역',
        purpose: '추가 자료 및 상호작용 요소',
        sizeGuide: '전체 화면의 30%'
      }
    ];
  }

  // Phase 2 단순화: 항상 3개 동일한 기본 컴포넌트 보장
  private extractComponents(sections: Record<string, string>): ComponentSpec[] {
    // 파싱 실패 없이 항상 3개 기본 컴포넌트 제공
    return [
      {
        id: 'basic-title',
        type: 'text',
        position: { area: '상단 영역', priority: 1 },
        size: { guideline: '전체 너비', responsive: true },
        content: { primary: '페이지 제목' },
        purpose: '주제 명시'
      },
      {
        id: 'basic-content',
        type: 'text',
        position: { area: '메인 영역', priority: 2 },
        size: { guideline: '메인 영역 대부분', responsive: true },
        content: { primary: '핵심 학습 내용' },
        purpose: '내용 전달'
      },
      {
        id: 'basic-interaction',
        type: 'interactive',
        position: { area: '하단 영역', priority: 3 },
        size: { guideline: '적절한 크기', responsive: true },
        content: { primary: '상호작용 요소' },
        purpose: '참여 유도'
      }
    ];
  }

  // Phase 2 단순화: 기본 상호작용만 제공
  private extractInteractions(sections: Record<string, string>): InteractionSpec[] {
    // 항상 동일한 기본 상호작용 보장
    return [
      {
        id: 'standard-interaction',
        trigger: '컴포넌트 클릭',
        action: '정보 표시',
        purpose: '학습 참여',
        feedback: '시각적 피드백'
      }
    ];
  }

  // Phase 2 단순화: 항상 1개 기본 이미지 보장
  private extractMediaAssets(sections: Record<string, string>): any[] {
    // 파싱 실패 없이 항상 1개 기본 이미지 제공
    return [{
      id: 'standard-image',
      fileName: 'main_image.png',
      path: `~/image/standard/main_image.png`,
      type: 'image',
      category: '교육 시각화',
      purpose: '핵심 개념 시각화',
      description: '교육 내용 관련 시각 자료',
      sizeGuide: '400×300px',
      placement: {
        section: '메인 영역',
        position: '메인 영역 중앙',
        size: '400×300px'
      },
      accessibility: {
        altText: '교육 내용 관련 이미지',
        caption: '학습 내용을 시각화한 이미지'
      },
      aiPrompt: '교육용 시각 자료. 명확하고 이해하기 쉬운 일러스트.'
    }];
  }

  // 새로운 구조화된 이미지 섹션 파싱 (=== REQUIRED IMAGES === 형식)
  private parseAndGenerateImages(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    console.log(`🖼️ 페이지 ${page.pageNumber} 이미지 파싱 시작 (구조화된 형식)`);

    // 구조화된 이미지 섹션 추출
    const imageMatches = this.extractStructuredImages(response);

    if (imageMatches.length === 0) {
      console.log(`✅ 구조화된 이미지 섹션 없음 - 텍스트 기반 설계`);
      return [];
    }

    console.log(`🎉 총 ${imageMatches.length}개 이미지 파싱 완료`);

    // 이미지 객체 생성 (최대 3개 제한)
    return imageMatches.map((match, index) =>
      this.createImageObjectWithDescription(match.filename, match.description, match.placement, page, index + 1)
    ).slice(0, 3);
  }

  // 새로운 구조화된 이미지 섹션 파싱 메서드 (유연한 버전)
  private extractStructuredImages(response: string): Array<{filename: string, description: string, placement: string}> {
    // === REQUIRED IMAGES === 섹션 찾기
    const imageSection = response.match(/=== REQUIRED IMAGES ===(.*?)=== END IMAGES ===/s);

    if (!imageSection) {
      return [];
    }

    const sectionContent = imageSection[1];
    const matches = [];

    // 다양한 패턴을 시도해서 파싱

    // 패턴 1: 표준 형식 (숫자. filename: "파일명" description: "설명" placement: "위치")
    let pattern1 = /(\d+)\.\s*filename:\s*"([^"]+)"\s*description:\s*"([^"]+)"\s*placement:\s*"([^"]+)"/gi;
    let match;
    while ((match = pattern1.exec(sectionContent)) !== null) {
      const [, number, filename, description, placement] = match;
      matches.push({
        filename: this.normalizeFilename(filename, matches.length + 1),
        description: description.trim(),
        placement: placement.trim()
      });
    }

    // 패턴 2: 줄바꿈이 있는 형식
    if (matches.length === 0) {
      const pattern2 = /(\d+)\.\s*filename:\s*"([^"]+)"\s*\n\s*description:\s*"([^"]+)"\s*\n\s*placement:\s*"([^"]+)"/gi;
      while ((match = pattern2.exec(sectionContent)) !== null) {
        const [, number, filename, description, placement] = match;
        matches.push({
          filename: this.normalizeFilename(filename, matches.length + 1),
          description: description.trim(),
          placement: placement.trim()
        });
      }
    }

    // 패턴 3: 매우 유연한 형식 (filename과 description만 필수)
    if (matches.length === 0) {
      const pattern3 = /filename:\s*"([^"]+)"\s*description:\s*"([^"]+?)"\s*(?:placement:\s*"([^"]*)")?/gi;
      while ((match = pattern3.exec(sectionContent)) !== null) {
        const [, filename, description, placement] = match;
        matches.push({
          filename: this.normalizeFilename(filename, matches.length + 1),
          description: description.trim(),
          placement: placement ? placement.trim() : '메인 영역'
        });
      }
    }

    // 패턴 4: 줄바꿈과 함께 매우 긴 설명이 있는 경우
    if (matches.length === 0) {
      const lines = sectionContent.split('\n');
      let currentImage: any = null;

      for (const line of lines) {
        // filename 찾기
        const filenameMatch = line.match(/filename:\s*"([^"]+)"/i);
        if (filenameMatch) {
          if (currentImage) {
            matches.push(currentImage);
          }
          currentImage = {
            filename: this.normalizeFilename(filenameMatch[1], matches.length + 1),
            description: '',
            placement: '메인 영역'
          };
          continue;
        }

        // description 찾기 (여러 줄에 걸쳐 있을 수 있음)
        const descMatch = line.match(/description:\s*"([^"]*.*?)"/i);
        if (descMatch && currentImage) {
          currentImage.description = descMatch[1].trim();
          continue;
        }

        // placement 찾기
        const placementMatch = line.match(/placement:\s*"([^"]+)"/i);
        if (placementMatch && currentImage) {
          currentImage.placement = placementMatch[1].trim();
        }
      }

      // 마지막 이미지 추가
      if (currentImage && currentImage.description) {
        matches.push(currentImage);
      }
    }

    // 결과 로깅
    for (const image of matches) {
      console.log(`✅ 구조화된 이미지 파싱: ${image.filename} | ${image.description.substring(0, 50)}...`);
    }

    return matches;
  }

  // 파일명을 1.png, 2.png 형식으로 정규화
  private normalizeFilename(filename: string, index: number): string {
    if (this.validateImageFilename(filename)) {
      return filename;
    }

    const normalizedFilename = `${index}.png`;
    console.log(`🔧 파일명 정규화: ${filename} → ${normalizedFilename}`);
    return normalizedFilename;
  }

  // 이미지 파일명 검증 (숫자.png 형식만 허용)
  private validateImageFilename(filename: string): boolean {
    const validPattern = /^\d+\.png$/;
    return validPattern.test(filename);
  }


  private createImageObject(filename: string, aiPrompt: string, page: any, index: number) {
    return {
      id: `page-${page.pageNumber}-${index}`,
      fileName: filename.startsWith('page') ? filename : `page${page.pageNumber}/${filename}`,
      path: `~/image/page${page.pageNumber}/${filename}`,
      type: 'image',
      category: '교육 시각화',
      purpose: `교육 시각 자료 ${index}`,
      description: `${page.topic} 관련 교육 이미지`,
      sizeGuide: '600×400px',
      placement: {
        section: '메인 영역',
        position: index === 1 ? '중앙' : `위치${index}`,
        size: '600×400px'
      },
      accessibility: {
        altText: `${page.topic} 관련 교육 이미지`,
        caption: `${page.topic} 시각 자료`
      },
      aiPrompt: aiPrompt
    };
  }

  // 파싱된 설명을 사용하는 새로운 이미지 객체 생성 메서드
  private createImageObjectWithDescription(filename: string, description: string, placement: string, page: any, index: number) {
    return {
      id: `page-${page.pageNumber}-${index}`,
      fileName: filename.startsWith('page') ? filename : `page${page.pageNumber}/${filename}`,
      path: `~/image/page${page.pageNumber}/${filename}`,
      type: 'image',
      category: '교육 시각화',
      purpose: `교육 시각 자료 ${index}`,
      description: description || `${page.topic} 관련 교육 이미지`,
      sizeGuide: '600×400px',
      placement: {
        section: placement || '메인 영역',
        position: index === 1 ? '중앙' : `위치${index}`,
        size: '600×400px'
      },
      accessibility: {
        altText: `${page.topic} 관련 교육 이미지`,
        caption: `${page.topic} 시각 자료`
      },
      aiPrompt: this.extractAIPromptFromDescription(description, page.topic)
    };
  }

  // 더 이상 사용되지 않는 복잡한 이미지 추출 메서드 (새로운 인라인 방식으로 대체됨)

  // 이미지 설명에서 AI 프롬프트 추출 또는 생성
  private extractAIPromptFromDescription(description: string, topic: string): string {
    // 설명이 영어로 시작하면 그대로 사용
    if (/^[A-Za-z]/.test(description.trim())) {
      return description.trim();
    }

    // 한국어 설명을 기반으로 영문 프롬프트 생성
    return `Educational illustration for ${topic}, detailed and clear visual representation with bright blue, soft green, and warm orange colors and simple design elements, suitable for students`;
  }

  // 상세한 이미지 설명 생성 (3문장 이상, 색상/구조/그림체/맥락 포함)
  private generateDetailedImageDescription(
    imageName: string,
    basicDescription: string,
    aiPrompt: string,
    topic: string,
    index: number
  ): string {
    // 색상 분위기 결정
    const colorMoods = [
      '부드러운 파스텔 톤과 자연스러운 색조',
      '선명하고 교육적인 블루와 그린 계열',
      '따뜻한 오렌지와 옐로우 기반의 밝은 색상',
      '차분한 네이비와 화이트의 깔끔한 조합'
    ];

    // 그림체/구조 스타일
    const visualStyles = [
      '인포그래픽 스타일의 깔끔하고 체계적인 구성',
      '일러스트레이션 형태의 친근하고 이해하기 쉬운 디자인',
      '다이어그램 방식의 논리적이고 단계적인 표현',
      '실사와 그래픽이 조화된 현대적인 스타일'
    ];

    // 맥락과 구조 설명
    const contextDescriptions = [
      `${topic}의 핵심 개념을 중심으로 배치된 메인 구성 요소들`,
      `세부 내용을 보충하는 보조적 시각 요소들`,
      `전체 학습 내용을 정리하는 요약적 구성`,
      `단계별 이해를 돕는 순차적 배열`
    ];

    const selectedColor = colorMoods[index % colorMoods.length];
    const selectedStyle = visualStyles[index % visualStyles.length];
    const selectedContext = contextDescriptions[index % contextDescriptions.length];

    return `이 이미지는 ${imageName}을 중심으로 ${basicDescription}를 시각화한 교육 자료입니다. ${selectedColor}을 기반으로 하여 학습자의 시선을 자연스럽게 유도하며, ${selectedStyle}로 제작되어 정보의 이해도를 높입니다. ${selectedContext}이 포함되어 있어 ${topic} 학습에서 ${index === 0 ? '가장 중요한 기초 개념' : index === 1 ? '심화 이해를 위한 세부 사항' : '학습 정리 및 복습'}을 효과적으로 전달합니다. 전체적으로 교육 환경에 적합한 전문적이면서도 친근한 분위기를 유지하여 학습 동기를 향상시키는 역할을 합니다.`;
  }

  // 기본 보장 이미지들 생성
  private generateFallbackImages(page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    return [
      {
        id: `page-${page.pageNumber}-1`,
        fileName: `1.png`,
        path: `/images/page${page.pageNumber}/1.png`,
        size: '600×400px',
        placement: '메인 영역 중앙',
        description: `메인 이미지 - ${page.topic} 핵심 개념`,
        altText: `${page.topic} 교육용 메인 이미지`,
        prompt: `Educational illustration for ${page.topic}, clear and easy-to-understand style, main concept visualization`
      },
      {
        id: `page-${page.pageNumber}-2`,
        fileName: `2.png`,
        path: `/images/page${page.pageNumber}/2.png`,
        size: '400×300px',
        placement: '보조 영역 우측',
        description: `보조 이미지 - ${page.topic} 세부 설명`,
        altText: `${page.topic} 교육용 보조 이미지`,
        prompt: `Detailed diagram or example image showing specific aspects of ${page.topic}`
      }
    ];
  }


  // 상세한 이미지 AI 프롬프트 생성 메서드 (개선된 버전)
  private generateDetailedImagePrompt(page: any, projectData: ProjectData, emotionalContext: EmotionalContext, specificFocus?: string, imageIndex?: number): string {
    const audience = projectData.targetAudience;
    const topic = page.topic;
    const description = page.description || '';

    const colors = {
      primary: 'professional blue',
      secondary: 'soft gray',
      accent: 'warm orange'
    };

    // 이미지 타입에 따른 크기와 역할 결정
    const imageSpecs = imageIndex === 0
      ? { size: '600×400px', role: 'Primary educational illustration', priority: 'Main concept visualization' }
      : imageIndex === 1
      ? { size: '400×300px', role: 'Supporting educational material', priority: 'Detailed explanation or examples' }
      : { size: '300×200px', role: 'Summary or reference material', priority: 'Key points reinforcement' };

    // 대상 연령에 따른 스타일 조정
    let styleGuide = '';
    if (audience.includes('초등')) {
      styleGuide = '밝고 친근한 색상, 단순하고 명확한 형태, 캐릭터나 마스코트 활용 가능, 재미있고 흥미로운 요소 포함';
    } else if (audience.includes('중학') || audience.includes('고등')) {
      styleGuide = '깔끔하고 체계적인 디자인, 논리적인 정보 구성, 다이어그램과 차트 활용, 전문적이면서도 이해하기 쉬운 스타일';
    } else {
      styleGuide = '전문적이고 세련된 디자인, 명확한 정보 전달, 비즈니스 친화적 색상과 레이아웃';
    }

    return `Create a comprehensive educational illustration for "${topic}"${specificFocus ? ` focusing on "${specificFocus}"` : ''}.

**Topic Details**: ${topic} - ${description}
**Specific Focus**: ${specificFocus || '전체 개념'}
**Target Audience**: ${audience}
**Image Role**: ${imageSpecs.role}
**Educational Priority**: ${imageSpecs.priority}

**Visual Requirements**:
- Style: ${styleGuide}
- Color Palette: Use ${colors.primary} for primary areas, ${colors.secondary} for secondary areas, ${colors.accent} for highlights (using natural color descriptions only)
- Composition: Clear, well-organized layout with logical information flow
- Elements: Include relevant diagrams, icons, illustrations, or infographics
- Text Integration: Minimal, essential text labels in Korean if needed
- Educational Focus: ${specificFocus ? `Emphasize ${specificFocus.toLowerCase()} aspects of ${topic}` : `Make complex concepts easy to understand through visual representation`}

**Technical Specifications**:
- Size: ${imageSpecs.size}, high resolution
- Format: Clean, professional educational material style
- Accessibility: High contrast, clear visual hierarchy
- Cultural Context: Appropriate for Korean educational environment
- Image Priority: ${imageIndex === 0 ? 'Main/Hero image' : imageIndex === 1 ? 'Supporting detail image' : 'Summary/Reference image'}

**Unique Requirements**:
${imageIndex === 0 ? '- Should be the most prominent and comprehensive visual' : ''}
${imageIndex === 1 ? '- Should complement the main image with specific details or examples' : ''}
${imageIndex === 2 ? '- Should summarize key points or provide quick reference' : ''}
${specificFocus ? `- Must clearly distinguish this "${specificFocus}" focus from other images in the same lesson` : ''}

**Mood & Tone**: ${emotionalContext.overallTone}, engaging, trustworthy, conducive to learning

Create an image that serves as an effective educational tool, helping learners grasp ${specificFocus ? `the ${specificFocus.toLowerCase()} aspects of` : 'the key concepts of'} ${topic} through clear, intuitive visual communication.`;
  }

  // 레이아웃 모드 검증 및 처리
  private validateAndProcessLayoutMode(projectData: ProjectData): {
    mode: string;
    dimensions: string;
    constraints: string;
    heightBudget: any;
  } {
    const { layoutMode } = projectData;

    if (layoutMode === 'fixed') {
      return {
        mode: 'Fixed (1600×1000px)',
        dimensions: '1600×1000px',
        constraints: '스크롤 없는 고정 레이아웃',
        heightBudget: {
          total: 900,
          title: 80,
          body: 480,
          images: 300,
          cards: 240,
          margins: 110
        }
      };
    } else {
      return {
        mode: 'Scrollable (1600×∞px)',
        dimensions: '1600×∞px',
        constraints: '세로 스크롤 가능 레이아웃',
        heightBudget: {
          total: '무제한',
          sections: '자유 설정',
          spacing: '충분한 여백 권장'
        }
      };
    }
  }

  // 콘텐츠 모드별 전략 설명
  private getContentStrategyByMode(contentMode: string): string {
    switch (contentMode) {
      case 'enhanced':
        return 'AI 보강 - 시각적 요소와 설명 추가';
      case 'restricted':
        return '그대로 사용 - 기존 콘텐츠만 활용';
      case 'original':
        return '원본 보존 - 내용 변경 없이 레이아웃만 최적화';
      default:
        return '기본 전략';
    }
  }




  // 유틸리티 메서드들
  private createEmotionalContext(visualIdentity: VisualIdentity): EmotionalContext {
    return {
      projectMood: visualIdentity.moodAndTone,
      colorEmotions: {
        primary: `신뢰감을 주는 ${visualIdentity.colorPalette.primary}`,
        secondary: `안정감을 주는 ${visualIdentity.colorPalette.secondary}`,
        accent: `활기찬 ${visualIdentity.colorPalette.accent}`
      },
      typographyPersonality: {
        headings: visualIdentity.typography.headingStyle || '명확하고 자신감 있는',
        body: visualIdentity.typography.bodyStyle || '편안하게 읽히는'
      },
      overallTone: visualIdentity.componentStyle,
      visualIdentity: visualIdentity  // 전체 Visual Identity 추가
    };
  }

  private getDetailedConstraints(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `🚨 Fixed Mode (1600×1000px) 절대 제약:
- 전체 높이 1000px 절대 초과 금지
- 모든 요소가 스크롤 없이 표시되어야 함
- 개발자가 놓치기 쉬운 부분이므로 안전 마진 50px 고려
- 효율적 공간 활용이 핵심`;
    } else {
      return `📜 Scrollable Mode (1600×∞) 제약:
- 가로 1600px 절대 초과 금지 (가로 스크롤 방지)
- 세로는 자유롭지만 각 섹션별 적정 높이 유지
- 스크롤 피로도 고려한 콘텐츠 배치
- 자연스러운 정보 흐름 설계`;
    }
  }

  private inferLearningGoals(projectData: ProjectData): string[] {
    // 프로젝트 제목에서 학습 목표 추론
    return [
      `${projectData.projectTitle}의 기본 개념 이해`,
      '핵심 원리와 적용 방법 파악',
      '실생활 연관성 및 중요성 인식'
    ];
  }

  private determineEducationalApproach(
    projectData: ProjectData,
    emotionalContext: EmotionalContext
  ): string {
    const { targetAudience, projectTitle } = projectData;

    // 대상별 교육 접근법 결정
    if (targetAudience.includes('초등')) {
      return '체험 중심 학습법 - 시각적 자료와 상호작용을 통한 흥미 유발';
    } else if (targetAudience.includes('중학')) {
      return '탐구 기반 학습법 - 질문과 토론을 통한 능동적 학습';
    } else if (targetAudience.includes('고등')) {
      return '분석적 학습법 - 비판적 사고와 심화 분석 중심';
    } else if (targetAudience.includes('대학') || targetAudience.includes('성인')) {
      return '실무 중심 학습법 - 이론과 실제 적용의 균형';
    }

    // 기본값
    return '단계별 학습법 - 기초부터 심화까지 체계적 접근';
  }

  private getAudienceCharacteristics(audience: string): string {
    if (audience.includes('초등')) {
      return '**특성**: 시각적 자료 선호, 단순명확한 설명 필요, 상호작용 요소 중요';
    } else if (audience.includes('중학')) {
      return '**특성**: 논리적 설명 선호, 실생활 연관성 중요, 성취감 제공 필요';
    } else if (audience.includes('고등')) {
      return '**특성**: 심화 학습 지향, 분석적 사고 활용, 진로 연계성 고려';
    }
    return '**특성**: 체계적이고 실용적인 접근 선호';
  }

  private generateDesignPhilosophy(
    projectData: ProjectData,
    emotionalContext: EmotionalContext
  ): any {
    return {
      coreValues: ['명확성', '실용성', '교육 효과성', '접근성'],
      designPrinciples: ['인지 부하 최소화', '점진적 정보 공개', '시각적 계층 구조'],
      userExperienceGoals: ['학습 동기 증진', '이해도 향상', '성취감 제공']
    };
  }

  private generateGlobalGuidelines(
    emotionalContext: EmotionalContext,
    layoutMode: string
  ): any {
    return {
      visualHierarchy: '제목 → 핵심 내용 → 보조 정보 순으로 시각적 중요도 배치',
      colorUsage: '주색상은 중요한 요소에, 강조색은 행동 유도 요소에 사용',
      typographyNotes: '가독성 우선, 계층별 크기 차별화',
      interactionPatterns: '직관적이고 일관된 상호작용 패턴 유지',
      responsiveConsiderations: '다양한 화면 크기에서의 학습 경험 최적화'
    };
  }

  private generateDeveloperResources(layoutMode: string): any {
    return {
      generalHints: [
        '사용자 학습 흐름을 방해하지 않는 자연스러운 애니메이션',
        '접근성 가이드라인 준수 (색상 대비, 키보드 네비게이션 등)',
        '로딩 시간 최적화로 학습 집중도 유지'
      ],
      commonPatterns: [
        'Progressive Disclosure: 필요한 정보를 단계별로 공개',
        'Visual Feedback: 사용자 행동에 대한 즉각적 피드백',
        'Error Prevention: 잘못된 조작을 사전에 방지하는 UI'
      ],
      troubleshootingTips: [
        `${layoutMode} 모드 제약 위반 시 체크포인트`,
        '다양한 디바이스에서의 테스트 방법',
        '성능 최적화 포인트'
      ],
      qualityChecklist: [
        '모든 학습 목표가 UI에 반영되었는가?',
        '정보 전달이 명확하고 직관적인가?',
        '상호작용이 교육 목적에 부합하는가?'
      ]
    };
  }

  private getPageContext(pageIndex: number, totalPages: number): string {
    if (pageIndex === 0) {
      return `**첫 페이지**: 학습자의 관심과 동기를 끌어내는 것이 중요`;
    } else if (pageIndex === totalPages - 1) {
      return `**마지막 페이지**: 학습 내용 정리와 다음 단계 안내`;
    } else {
      return `**중간 페이지**: 이전 내용과 연결하며 새로운 지식 구축`;
    }
  }

  private getLayoutConstraints(layoutMode: 'fixed' | 'scrollable'): string {
    const maxAreas = layoutMode === 'fixed' ? 3 : 5;
    return `
🚨 **절대 준수 사항** (개발 실패 방지):
- **영역 개수 제한**: ${layoutMode} 모드는 제목 포함 최대 ${maxAreas}개 영역만 허용
- **인터랙션 요소 금지**: 퀴즈, 실습, 아코디언, 카드 뒤집기, 애니메이션 등 Step4에서 처리
${layoutMode === 'fixed' ? '- **총 높이 제한**: 1000px 절대 초과 금지' : ''}
- **반응형 고려 불필요**: 고정 크기 기준 설계
- **색상 코드 금지**: 이미지 프롬프트에서 #FF0000, rgb(), hsl() 등 색상 코드 사용 절대 금지 - 대신 "bright red", "soft blue", "warm orange" 등 자연어 색상 표현만 사용

📐 **레이아웃 창의성 가이드**:
- 모든 영역이 풀와이드인 단조로운 구성 금지
- 최소 2가지 이상의 그리드 조합 사용 필수
- 교육적 우선순위에 따른 시각적 위계 차등화 필수
`;
  }

  private getSpaceConstraintReminders(layoutMode: 'fixed' | 'scrollable'): string[] {
    if (layoutMode === 'fixed') {
      return [
        '높이 1000px 절대 초과 금지',
        '모든 중요 정보가 스크롤 없이 보여야 함',
        '개발자 실수 방지를 위한 안전 마진 고려',
        '공간 효율성이 성공의 핵심'
      ];
    } else {
      return [
        '가로 1600px 절대 초과 금지',
        '가로 스크롤바 생성 방지',
        '적절한 섹션 높이로 스크롤 피로도 최소화',
        '자연스러운 세로 흐름 유지'
      ];
    }
  }

  // 8가지 메타데이터 파싱
  private parseStructuredImageMetadata(imageText: string, topic: string): any {
    const metadata: any = {};

    // 8가지 요소 추출
    const patterns = {
      visualElements: /🎨 \*\*주요 시각 요소\*\*:\s*([^\n-]+)/,
      colorScheme: /🌈 \*\*색상 구성\*\*:\s*([^\n-]+)/,
      pageContext: /🔗 \*\*페이지 내 맥락\*\*:\s*([^\n-]+)/,
      styleTexture: /🎭 \*\*스타일과 질감\*\*:\s*([^\n-]+)/,
      learnerPerspective: /👥 \*\*학습자 관점\*\*:\s*([^\n-]+)/,
      educationalFunction: /🔄 \*\*교육적 기능\*\*:\s*([^\n-]+)/,
      visualDynamics: /⚡ \*\*시각적 역동성\*\*:\s*([^\n-]+)/
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = imageText.match(pattern);
      metadata[key] = match ? match[1].trim() : `${topic} 관련 ${key}`;
    });

    return metadata;
  }


  // 색상 코드 검증
  private validateNoColorCodes(colorDescription: string): void {
    const colorCodePatterns = [/#[A-Fa-f0-9]{3,6}/, /rgb\(/, /rgba\(/, /hsl\(/];

    colorCodePatterns.forEach(pattern => {
      if (pattern.test(colorDescription)) {
        console.warn('⚠️ 색상 코드 감지됨 - AI 이미지 생성 오류 위험:', colorDescription);
        console.warn('💡 수정 권장: "bright blue", "soft green", "warm orange" 등 자연어 색상 표현 사용');
      }
    });
  }

  // 8가지 요소 종합 AI 프롬프트 생성
  private generateEnhancedAIPrompt(metadata: any, topic: string): string {
    return `Educational illustration for "${topic}".

Visual Elements: ${metadata.visualElements || 'Clear educational content'}
Color Composition: ${metadata.colorScheme || 'Natural, readable colors such as soft blue, warm green, friendly orange'} (IMPORTANT: Use only natural color names like "bright red", "soft blue", "warm orange" - never use hex codes like #FF0000 or rgb() values as AI cannot process them)
Page Context: ${metadata.pageContext || 'Main content area'}
Style and Texture: ${metadata.styleTexture || 'Clean educational style'}
Learner Perspective: ${metadata.learnerPerspective || 'Age-appropriate design'}
Educational Function: ${metadata.educationalFunction || 'Support learning objectives'}
Visual Dynamics: ${metadata.visualDynamics || 'Clear information flow'}

Create a comprehensive educational image that combines all these elements effectively, using only natural color descriptions without any color codes.`;
  }

  // 레이아웃 제약 검증 시스템
  private validateLayoutConstraints(
    response: string,
    layoutMode: 'fixed' | 'scrollable'
  ): LayoutValidation {
    const layoutSection = response.match(/4\) 레이아웃 구조.*?(?=\n5\)|$)/s);
    if (!layoutSection) {
      return {
        isValid: false,
        errorType: 'AREA_LIMIT_EXCEEDED',
        suggestions: ['레이아웃 구조 섹션을 찾을 수 없음']
      };
    }

    const layoutContent = layoutSection[0];

    // 1. 영역 개수 검증
    const areaMatches = layoutContent.match(/[A-Z]\.\s/g);
    const areaCount = areaMatches ? areaMatches.length : 0;
    const maxAreas = layoutMode === 'fixed' ? 3 : 5;

    if (areaCount > maxAreas) {
      return {
        isValid: false,
        errorType: 'AREA_LIMIT_EXCEEDED',
        areaCount,
        maxAllowed: maxAreas,
        suggestions: [
          `${layoutMode} 모드는 최대 ${maxAreas}개 영역만 허용 (현재: ${areaCount}개)`,
          '영역을 통합하거나 중요도에 따라 제거 필요'
        ]
      };
    }

    // 2. Fixed 모드 높이 검증
    if (layoutMode === 'fixed') {
      const heightMatches = layoutContent.match(/(\d+)px/g);
      if (heightMatches) {
        const totalHeight = heightMatches
          .map(h => parseInt(h.replace('px', '')))
          .reduce((sum, h) => sum + (h > 100 ? h : 0), 0); // 높이값만 합산

        if (totalHeight > 1000) {
          return {
            isValid: false,
            errorType: 'HEIGHT_EXCEEDED',
            suggestions: [
              `총 높이 ${totalHeight}px로 1000px 초과`,
              '각 영역 높이 축소 또는 2D 그리드 시스템 활용 필요'
            ]
          };
        }
      }
    }

    // 3. 인터랙션 요소 검증
    const interactionKeywords = ['퀴즈', '실습', '아코디언', '카드 뒤집기', '애니메이션', '드래그', '클릭'];
    const hasInteraction = interactionKeywords.some(keyword =>
      layoutContent.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasInteraction) {
      return {
        isValid: false,
        errorType: 'INTERACTION_DETECTED',
        suggestions: [
          '인터랙션 요소는 Step4에서 처리 예정',
          '정적 콘텐츠 구조만 설계'
        ]
      };
    }

    // 4. 색상 코드 검증
    const colorCodePattern = /#[A-Fa-f0-9]{3,6}|rgb\(|rgba\(|hsl\(/;
    if (colorCodePattern.test(response)) {
      return {
        isValid: false,
        errorType: 'COLOR_CODE_DETECTED',
        suggestions: [
          '색상 코드 감지됨 - AI 이미지 생성에서 색상 인식 불가',
          '자연어 색상 표현으로 변경 필요 (예: "bright blue", "soft green", "warm orange")'
        ]
      };
    }

    // 5. 창의성 검증
    const isMonotone = this.checkLayoutMonotone(layoutContent);
    const suggestions: string[] = [];

    if (isMonotone) {
      suggestions.push('더 다양한 그리드 조합 사용 권장');
    }

    if (areaCount < 2) {
      suggestions.push('교육적 우선순위에 따른 시각적 위계 적용 권장');
    }

    return {
      isValid: true,
      suggestions,
      warnings: suggestions.length > 0 ? ['레이아웃 창의성 개선 가능'] : undefined
    };
  }

  // 단조로운 레이아웃 검사
  private checkLayoutMonotone(layoutContent: string): boolean {
    const fullWidthCount = (layoutContent.match(/1600px|풀와이드|전체\s*너비/g) || []).length;
    const totalAreas = (layoutContent.match(/[A-Z]\.\s/g) || []).length;

    return totalAreas > 2 && fullWidthCount >= totalAreas - 1;
  }

  // 페이지 전체 품질 계산
  private calculatePageQuality(response: string, page: any, projectData: ProjectData): QualityMetrics {
    const imageSection = response.match(/### 2\. 페이지에 사용될 이미지(.*?)(?=\n###|\n---|\n##|$)/s);
    const layoutSection = response.match(/4\) 레이아웃 구조(.*?)(?=\n\d+\)|$)/s);

    // 이미지 품질 점수 계산
    let imageDetailScore = 50; // 기본값
    if (imageSection) {
      const imageQuality = this.checkImageDescriptionQuality(imageSection[1]);
      imageDetailScore = imageQuality.imageDetailScore;
    }

    // 레이아웃 다양성 점수 계산
    let layoutDiversityScore = 50; // 기본값
    if (layoutSection) {
      layoutDiversityScore = this.calculateLayoutDiversity(layoutSection[1]);
    }

    // 제약 준수 점수 계산
    const layoutValidation = this.validateLayoutConstraints(response, projectData.layoutMode);
    const constraintComplianceScore = layoutValidation.isValid ? 100 : 30;

    // 전체 품질 점수
    const overallQualityScore = Math.round(
      (imageDetailScore * 0.4 + layoutDiversityScore * 0.3 + constraintComplianceScore * 0.3)
    );

    // 제안사항 수집
    const suggestions: string[] = [];
    const warnings: string[] = [];

    if (imageDetailScore < 80) suggestions.push('이미지 설명의 구체성을 향상시키세요');
    if (layoutDiversityScore < 75) suggestions.push('더 다양한 레이아웃 패턴을 사용하세요');
    if (!layoutValidation.isValid) {
      warnings.push(`레이아웃 제약 위반: ${layoutValidation.errorType}`);
      suggestions.push(...layoutValidation.suggestions);
    }

    return {
      completeness: imageDetailScore,
      relevance: layoutDiversityScore,
      clarity: 85,
      structure: 80,
      overall: Math.round((imageDetailScore + layoutDiversityScore) / 2)
    };
  }

  // 이미지 설명 품질 검사
  private checkImageDescriptionQuality(imageSection: string): { imageDetailScore: number } {
    let score = 0;
    const checks = [
      { pattern: /🎨.*주요 시각 요소/s, points: 15, name: '시각 요소' },
      { pattern: /🌈.*색상 구성/s, points: 15, name: '색상 구성' },
      { pattern: /🔗.*페이지 내 맥락/s, points: 15, name: '페이지 맥락' },
      { pattern: /🎭.*스타일과 질감/s, points: 15, name: '스타일' },
      { pattern: /👥.*학습자 관점/s, points: 15, name: '학습자 관점' },
      { pattern: /🔄.*교육적 기능/s, points: 15, name: '교육 기능' },
      { pattern: /⚡.*시각적 역동성/s, points: 10, name: '시각 역동성' }
    ];

    // 8가지 요소 체크
    checks.forEach(check => {
      if (check.pattern.test(imageSection)) {
        score += check.points;
      }
    });

    // 길이 보너스 (300-400자 권장)
    const cleanText = imageSection.replace(/[🎨🌈📐🎭👥🔄⚡\*\-\n]/g, '').trim();
    if (cleanText.length >= 300 && cleanText.length <= 500) {
      score += 10; // 적절한 길이 보너스
    } else if (cleanText.length >= 200) {
      score += 5; // 부분 점수
    }

    return { imageDetailScore: Math.min(score, 100) };
  }

  // 레이아웃 다양성 점수 계산
  private calculateLayoutDiversity(layoutText: string): number {
    const diversityIndicators = [
      { pattern: /풀와이드|1600px|전체.*너비/g, type: 'fullwidth', score: 10 },
      { pattern: /8\/12|67%|2\/3/g, type: 'two-thirds', score: 15 },
      { pattern: /6\/12|50%|1\/2/g, type: 'half', score: 15 },
      { pattern: /4\/12|33%|1\/3/g, type: 'one-third', score: 20 },
      { pattern: /중앙.*정렬|센터/g, type: 'centered', score: 10 },
      { pattern: /좌우.*분할|양쪽/g, type: 'split', score: 15 },
      { pattern: /3분할|tri/g, type: 'triple', score: 20 }
    ];

    const usedPatterns = new Set<string>();
    let totalScore = 0;

    diversityIndicators.forEach(indicator => {
      const matches = layoutText.match(indicator.pattern);
      if (matches && matches.length > 0) {
        usedPatterns.add(indicator.type);
        totalScore += indicator.score;
      }
    });

    // 다양성 보너스
    const uniquePatterns = usedPatterns.size;
    let diversityBonus = 0;
    if (uniquePatterns >= 3) diversityBonus = 20;
    else if (uniquePatterns >= 2) diversityBonus = 10;

    // 창의성 패널티 (모든 영역이 풀와이드인 경우)
    const areaCount = (layoutText.match(/[A-Z]\.\s/g) || []).length;
    const fullwidthCount = (layoutText.match(/풀와이드|1600px|전체.*너비/g) || []).length;
    const monotonePenalty = (areaCount > 2 && fullwidthCount >= areaCount - 1) ? -30 : 0;

    return Math.max(0, Math.min(100, totalScore + diversityBonus + monotonePenalty));
  }

  // 높이 계산 알고리즘

  private createFallbackPageDesign(page: any): EducationalPageDesign {
    return {
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,
      learningObjectives: [`${page.topic} 기본 이해`],
      educationalStrategy: '단계적 학습 접근',
      layoutStructure: { areas: [] },
      content: {
        heading: page.topic,
        bodyText: page.description || '핵심 내용을 학습합니다.',
        keyPoints: ['핵심 포인트 1', '핵심 포인트 2']
      },
      components: [],
      interactions: [],
      mediaAssets: [],
      designRationale: '기본적인 교육 구조 적용',
      implementationHints: '사용자 친화적 구현 권장',
      uxConsiderations: '접근성과 사용성 고려',
      isComplete: false,
      error: 'AI 생성 실패로 기본 설계 적용',
      generatedAt: new Date()
    };
  }
}