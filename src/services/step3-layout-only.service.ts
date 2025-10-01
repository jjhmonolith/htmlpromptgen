import { OpenAIService } from './openai.service';
import { Step2NewResult } from '../types/step2-new.types';
import {
  Step3LayoutOnlyResult,
  Step3LayoutInput,
  PageLayoutResult,
  LayoutDesignTokens
} from '../types/step3-layout-only.types';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

const STEP_NAME = 'Step3LayoutOnly';

type Step2PageContent = Step2NewResult['pageContents'][number];

type NarrativeSegments = {
  layoutNarrative: string;
  visualGuidelines: string;
  implementationNotes: string;
};

class Step3LayoutFallbackProvider implements FallbackProvider<Step3LayoutOnlyResult> {
  constructor(private input: Step3LayoutInput) {}

  createFallback(): Step3LayoutOnlyResult {
    const { step2Result, layoutMode } = this.input;
    const visual = step2Result.visualIdentity;

    const pages: PageLayoutResult[] = step2Result.pageContents.map((pageContent) => {
      // 더 창의적이고 구체적인 폴백 레이아웃 설계
      const creativeLayoutDescription = `
${pageContent.pageTitle} 페이지는 "${pageContent.keyMessage}"라는 핵심 메시지를 중심으로 ${layoutMode === 'fixed' ? '1600×1000px 고정 화면에서 모든 요소가 조화롭게 배치되어' : '자연스러운 세로 스크롤을 통해 단계적으로 정보가 전개되어'} 학습자의 시선을 효과적으로 유도합니다.

화면 상단에는 "${pageContent.pageTitle}"이라는 제목이 ${visual.typography.headingFont} 폰트로 32px 크기에 ${visual.colorPalette.primary} 색상을 사용하여 강력한 첫인상을 만들어냅니다. 이어서 "${pageContent.learningGoal}"라는 학습 목표가 작은 배지 형태로 제목 하단에 배치되어 학습자가 명확한 방향성을 가질 수 있도록 안내합니다.

메인 콘텐츠 영역은 ${visual.moodAndTone.join(', ')} 분위기를 반영한 ${visual.componentStyle} 스타일로 디자인되어, 교안 본문인 "${pageContent.fullTextContent}"이 ${visual.typography.bodyFont} 폰트 18px 크기로 가독성 높게 표현됩니다. 텍스트는 단순한 나열이 아니라 중요도에 따라 시각적 계층을 만들어, 핵심 키워드는 ${visual.colorPalette.accent} 색상으로 강조하고, 부연 설명은 ${visual.colorPalette.secondary} 색상을 활용하여 정보의 우선순위를 명확히 구분합니다.

"${pageContent.imageDescription}"에 해당하는 시각 자료는 ${layoutMode === 'fixed' ? '화면 우측 30% 영역에 배치되어 텍스트와 균형을 이루며' : '본문 중간중간에 적절히 삽입되어 이해를 돕는 역할을 하며'}, 단순한 장식이 아닌 학습 내용과 직접적으로 연결된 교육적 목적을 가진 비주얼로 구성됩니다. 이미지 주변에는 24px 이상의 여백을 확보하여 시각적 답답함을 해소하고, 필요한 경우 간단한 캡션을 추가하여 학습 효과를 극대화합니다.

"${pageContent.interactionHint}"라는 상호작용 요소는 ${layoutMode === 'fixed' ? '화면 하단 중앙에' : '콘텐츠 마지막 부분에'} 배치되어 학습자의 능동적 참여를 유도합니다. 이 영역은 ${visual.colorPalette.primary} 색상의 미묘한 그라데이션 배경과 함께 약간의 그림자 효과를 적용하여 클릭 가능함을 직관적으로 알려주며, 호버 시에는 ${visual.colorPalette.accent} 색상으로 변화하여 반응성을 표현합니다.

전체적인 레이아웃은 F-패턴 시선 흐름을 고려하여 설계되었으며, ${layoutMode === 'fixed' ? '한 화면 내에서 모든 정보가 효율적으로 전달되도록 공간 활용을 최적화하고' : '스크롤하면서 자연스럽게 정보를 흡수할 수 있도록 적절한 섹션 구분과 여백을 적용하며'}, 모바일 환경에서는 단일 컬럼으로 재배치되어 어떤 기기에서도 일관된 학습 경험을 제공합니다. 접근성을 위해 모든 텍스트는 최소 18pt 이상의 크기를 유지하고, 색상 대비는 WCAG 기준을 만족하도록 설계되어 모든 학습자가 편안하게 콘텐츠를 소비할 수 있도록 배려했습니다.
      `.trim();

      return {
        pageId: pageContent.pageId,
        pageTitle: pageContent.pageTitle,
        pageNumber: pageContent.pageNumber,
        textContent: {
          fullTextContent: pageContent.fullTextContent,
          learningGoal: pageContent.learningGoal,
          keyMessage: pageContent.keyMessage,
          imageDescription: pageContent.imageDescription,
          interactionHint: pageContent.interactionHint
        },
        layoutNarrative: creativeLayoutDescription,
        visualGuidelines: creativeLayoutDescription,
        implementationNotes: creativeLayoutDescription,
        generatedAt: new Date()
      };
    });

    return {
      layoutMode,
      pages,
      designTokens: createDesignTokens(layoutMode),
      generatedAt: new Date(),
      processingTime: 0
    };
  }
}

export class Step3LayoutOnlyService {
  private errorHandler = createStepErrorHandler(STEP_NAME);

  constructor(private openAIService: OpenAIService) {}

  async generatePageLayout(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable',
    pageIndex: number
  ): Promise<PageLayoutResult> {
    const input: Step3LayoutInput = { step2Result, layoutMode, pageIndex };

    this.errorHandler.validateInput('step2Result', step2Result, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('pageContents', step2Result.pageContents, (pages) => Array.isArray(pages) && pages.length > 0);
    this.errorHandler.validateInput('pageIndex', pageIndex, (idx) => typeof idx === 'number' && idx >= 0 && idx < step2Result.pageContents.length);

    const fallbackProvider: FallbackProvider<PageLayoutResult> = {
      createFallback: () => {
        const fallback = new Step3LayoutFallbackProvider(input).createFallback();
        return fallback.pages.find((page) => page.pageNumber === step2Result.pageContents[pageIndex].pageNumber) || fallback.pages[0];
      }
    };

    const startTime = Date.now();

    return this.errorHandler.handle(
      async () => {
        console.log(`🎨 Step3 레이아웃: 페이지 ${pageIndex + 1} 서술 생성 시작`);
        const currentPage = step2Result.pageContents[pageIndex];
        console.log('📋 대상 페이지:', currentPage.pageTitle);

        const prompt = this.createStep3LayoutPrompt(step2Result, layoutMode, pageIndex);
        console.log('📝 Step3 레이아웃 프롬프트 생성 완료');

        console.log('🚀 OpenAI API 호출 시작...');
        const response = await this.openAIService.generateCompletion(
          prompt,
          STEP_NAME,
          {
            model: 'gpt-5',
            reasoningEffort: 'medium',
            maxOutputTokens: 6000,
            temperature: layoutMode === 'fixed' ? 0.6 : 0.8
          }
        );

        console.log('✅ OpenAI API 응답 수신');
        this.errorHandler.validateApiResponse(response);

        const pageLayout = this.buildPageLayoutResult(currentPage, response.content);
        const processingTime = Date.now() - startTime;
        console.log(`🎯 페이지 ${pageIndex + 1} 레이아웃 서술 생성 완료 (${processingTime}ms)`);

        return pageLayout;
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );
  }

  async generateAllPagesLayout(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable'
  ): Promise<Step3LayoutOnlyResult> {
    console.log('🎨 Step3 레이아웃: 전체 페이지 서술 생성 시작');
    const startTime = Date.now();

    const fallbackProvider = new Step3LayoutFallbackProvider({ step2Result, layoutMode, pageIndex: 0 });

    return this.errorHandler.handle(
      async () => {
        const pages: PageLayoutResult[] = [];

        for (let i = 0; i < step2Result.pageContents.length; i += 1) {
          try {
            const pageLayout = await this.generatePageLayout(step2Result, layoutMode, i);
            pages.push({ ...pageLayout, generatedAt: new Date() });
            console.log(`✅ 페이지 ${i + 1}/${step2Result.pageContents.length} 완료`);
          } catch (error) {
            console.error(`⚠️ 페이지 ${i + 1} 서술 생성 실패, 폴백 사용:`, error);
            const fallback = fallbackProvider.createFallback();
            pages.push(fallback.pages[i] ?? fallback.pages[0]);
          }
        }

        const processingTime = Date.now() - startTime;

        return {
          layoutMode,
          pages,
          designTokens: createDesignTokens(layoutMode),
          generatedAt: new Date(),
          processingTime
        };
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );
  }

  private createStep3LayoutPrompt(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable',
    pageIndex: number
  ): string {
    const pageCount = step2Result.pageContents.length;
    const currentPage = step2Result.pageContents[pageIndex];
    const visual = step2Result.visualIdentity;

    // 전체 프로젝트 구성 정보 생성
    const projectOverview = step2Result.pageContents.map((p, idx) =>
      `페이지 ${p.pageNumber}: ${p.pageTitle}${p.keyMessage ? ` - ${p.keyMessage}` : ''}`
    ).join('\n');

    // 페이지 컨텍스트 정보
    const pageContext = pageIndex === 0
      ? '첫 페이지입니다'
      : `이전 페이지: ${step2Result.pageContents[pageIndex - 1]?.pageTitle || '없음'}`;

    const nextPageInfo = pageIndex < pageCount - 1
      ? `다음 페이지: ${step2Result.pageContents[pageIndex + 1]?.pageTitle || '없음'}`
      : '마지막 페이지입니다';

    // 콘텐츠 생성 방침 설정
    const contentPolicy = '제공된 Step2 교안 콘텐츠를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠 레이아웃을 만드세요. 학습자의 이해를 돕는 시각적 배치, 정보 구조화, 상호작용 요소 등을 자유롭게 제안하세요.';

    // 이전 커밋의 프롬프트 방식을 기반으로 수정
    if (layoutMode === 'fixed') {
      return this.createNewFixedLayoutPrompt(step2Result, visual, currentPage, pageIndex, pageCount);
    } else {
      return this.createNewScrollableLayoutPrompt(step2Result, visual, currentPage, pageIndex, pageCount);
    }
  }

  // 새로운 Fixed Layout 프롬프트 (이전 커밋 기반)
  private createNewFixedLayoutPrompt(
    step2Result: Step2NewResult,
    visual: any,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    const contentPolicy = '제공된 Step2 교안 콘텐츠를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠를 만드세요. 학습자의 이해를 돕는 추가 설명, 예시, 시각 자료 등을 자유롭게 제안하세요.';

    return `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 구성해주세요.

### 📌 콘텐츠 생성 방침
${contentPolicy}

${this.formatNewVisualIdentitySection(visual)}

${this.formatNewProjectContextSection(step2Result, page, pageIndex, totalPages)}

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

### 📖 Step2에서 생성된 교안 콘텐츠
**학습 목표**: ${page.learningGoal}
**핵심 메시지**: ${page.keyMessage}
**교안 본문**:
"""
${page.fullTextContent}
"""

**필요한 이미지**: ${page.imageDescription}
**상호작용 아이디어**: ${page.interactionHint}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 상세히 서술해주세요. 반드시 레이아웃 구조와 디자인을 구체적으로 설명해야 합니다.

⚠️ **파일명 규칙 재확인**: 이미지 파일명은 절대 "1.png", "2.png", "3.png" 외에는 사용하지 마세요.
  - ✅ 올바른 예: "1.png", "2.png"
  - ❌ 잘못된 예: "hero.png", "diagram.png", "main-image.png", "icon.png"`;
  }

  // 새로운 Scrollable Layout 프롬프트 (이전 커밋 기반)
  private createNewScrollableLayoutPrompt(
    step2Result: Step2NewResult,
    visual: any,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    const contentPolicy = '제공된 Step2 교안 콘텐츠를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠를 만드세요. 학습자의 이해를 돕는 추가 설명, 예시, 시각 자료 등을 자유롭게 제안하세요.';

    return `당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 가로 1600px 고정, 세로는 콘텐츠에 맞게 자유롭게 확장되는 스크롤 가능한 레이아웃을 구성해주세요.

### 📌 콘텐츠 생성 방침
${contentPolicy}

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visual.moodAndTone.join(', ')}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.

${this.formatNewProjectContextSection(step2Result, page, pageIndex, totalPages)}

### 📏 핵심 규칙
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

### 🚫 절대 금지 사항
- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.
- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.
- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.
- **이미지 파일명 규칙**: 이미지 파일명은 "1.png", "2.png", "3.png"만 사용하세요. hero.png, diagram.png, icon.png 같은 설명적 이름은 금지입니다!

### 📖 Step2에서 생성된 교안 콘텐츠
**학습 목표**: ${page.learningGoal}
**핵심 메시지**: ${page.keyMessage}
**교안 본문**:
"""
${page.fullTextContent}
"""

**필요한 이미지**: ${page.imageDescription}
**상호작용 아이디어**: ${page.interactionHint}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 상세히 서술해주세요. 반드시 레이아웃 구조와 디자인을 구체적으로 설명해야 합니다.

⚠️ **파일명 규칙 재확인**: 이미지 파일명은 절대 "1.png", "2.png", "3.png" 외에는 사용하지 마세요.
   - ✅ 올바른 예: "1.png", "2.png"
   - ❌ 잘못된 예: "hero.png", "diagram.png", "main-image.png", "icon.png"`;
  }

  // 새로운 비주얼 아이덴티티 섹션 포맷터
  private formatNewVisualIdentitySection(visual: any): string {
    return `### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visual.moodAndTone.join(', ')}
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 흐르도록 유도하고, 콘텐츠를 단순히 박스에 넣는 것이 아니라 콘텐츠 자체의 형태에 맞는 맞춤형 디자인을 하세요.`;
  }

  // 새로운 프로젝트 컨텍스트 섹션 포맷터
  private formatNewProjectContextSection(
    step2Result: Step2NewResult,
    page: any,
    pageIndex: number,
    totalPages: number
  ): string {
    // 전체 프로젝트 구성 정보 생성
    const projectOverview = step2Result.pageContents.map((p, idx) =>
      `페이지 ${p.pageNumber}: ${p.pageTitle}${p.keyMessage ? ` - ${p.keyMessage}` : ''}`
    ).join('\n');

    // 페이지 컨텍스트 정보
    const pageContext = pageIndex === 0
      ? '첫 페이지입니다'
      : `이전 페이지: ${step2Result.pageContents[pageIndex - 1]?.pageTitle || '없음'}`;

    const nextPageInfo = pageIndex < totalPages - 1
      ? `다음 페이지: ${step2Result.pageContents[pageIndex + 1]?.pageTitle || '없음'}`
      : '마지막 페이지입니다';

    return `### 📚 전체 프로젝트 구성
${projectOverview}

### 📍 페이지 컨텍스트
- ${pageContext}
- **현재 페이지 ${page.pageNumber}: ${page.pageTitle}**
- ${nextPageInfo}`;
  }

  private buildPageLayoutResult(pageContent: Step2PageContent, rawContent: string): PageLayoutResult {
    console.log('🎓 Step3 AI 원문 응답 처리');
    console.log(`📋 대상 페이지: ${pageContent.pageTitle}`);
    console.log(`📝 AI 응답 길이: ${rawContent?.length || 0}자`);

    // AI 원문 응답을 그대로 사용 (파싱하지 않음)
    const aiRawResponse = (rawContent || '').trim();

    console.log(`✅ 페이지 ${pageContent.pageNumber} AI 원문 처리 완료`);

    return {
      pageId: pageContent.pageId,
      pageTitle: pageContent.pageTitle,
      pageNumber: pageContent.pageNumber,
      textContent: {
        fullTextContent: pageContent.fullTextContent,
        learningGoal: pageContent.learningGoal,
        keyMessage: pageContent.keyMessage,
        imageDescription: pageContent.imageDescription,
        interactionHint: pageContent.interactionHint
      },
      // AI 생성 원문 응답을 그대로 표시 (파싱 없음)
      layoutNarrative: aiRawResponse || 'AI 응답을 받지 못했습니다.',
      visualGuidelines: aiRawResponse || 'AI 응답을 받지 못했습니다.',
      implementationNotes: aiRawResponse || 'AI 응답을 받지 못했습니다.',
      generatedAt: new Date()
    };
  }

  // 이전 커밋의 educational design 파싱 방식 (간소화 버전)
  private parseEducationalDesign(response: string, pageContent: Step2PageContent): any {
    console.log(`✅ 페이지 ${pageContent.pageNumber} 간소화된 파싱 시작`);

    // 전체 응답을 fullDescription으로 저장하고 기본 구조만 제공
    return {
      pageId: pageContent.pageId,
      pageTitle: pageContent.pageTitle,
      pageNumber: pageContent.pageNumber,

      // 📋 AI의 전체 창의적 레이아웃 설명 (새 프롬프트 결과)
      fullDescription: response.trim(),

      // 📋 기본 구조 (안정성 보장)
      learningObjectives: [`${pageContent.pageTitle} 이해`, '핵심 개념 파악', '실용적 적용'],
      educationalStrategy: '창의적 레이아웃 기반 학습',

      layoutStructure: {
        areas: [
          {
            id: 'creative-layout',
            description: 'AI가 제안한 창의적 레이아웃',
            purpose: '비주얼 아이덴티티 기반 교육 콘텐츠',
            sizeGuide: '1600×1000px 또는 1600×가변px'
          }
        ]
      },

      content: {
        heading: pageContent.pageTitle,
        bodyText: pageContent.fullTextContent || `${pageContent.pageTitle}에 대한 창의적 교육 콘텐츠`,
        keyPoints: ['시각적 계층', '창의적 디자인', '교육 효과']
      },

      // 새로운 구조화된 이미지 섹션 파싱 (=== REQUIRED IMAGES === 형식)
      mediaAssets: this.parseAndGenerateImages(response, pageContent),

      designRationale: '비주얼 아이덴티티 기반 창의적 교육 설계',
      implementationHints: 'AI 제안 레이아웃을 그대로 구현',
      uxConsiderations: '자유로운 창의적 사용자 경험',

      isComplete: true,
      generatedAt: new Date()
    };
  }

  // 새로운 구조화된 이미지 섹션 파싱 (=== REQUIRED IMAGES === 형식)
  private parseAndGenerateImages(response: string, pageContent: Step2PageContent): any[] {
    console.log(`🖼️ 페이지 ${pageContent.pageNumber} 이미지 파싱 시작 (구조화된 형식)`);

    // 구조화된 이미지 섹션 추출
    const imageMatches = this.extractStructuredImages(response);

    if (imageMatches.length === 0) {
      console.log(`✅ 구조화된 이미지 섹션 없음 - 텍스트 기반 설계`);
      return [];
    }

    console.log(`🎉 총 ${imageMatches.length}개 이미지 파싱 완료`);

    // 이미지 객체 생성 (최대 3개 제한)
    return imageMatches.map((match, index) =>
      this.createImageObjectWithDescription(match.filename, match.description, match.placement, pageContent, index + 1)
    ).slice(0, 3);
  }

  // 구조화된 이미지 섹션 파싱 메서드
  private extractStructuredImages(response: string): Array<{filename: string, description: string, placement: string}> {
    // === REQUIRED IMAGES === 섹션 찾기
    const imageSection = response.match(/=== REQUIRED IMAGES ===(.*?)=== END IMAGES ===/s);

    if (!imageSection) {
      return [];
    }

    const sectionContent = imageSection[1];
    const matches = [];

    // 표준 형식 파싱 (숫자. filename: "파일명" description: "설명" placement: "위치")
    let pattern = /(\d+)\.\s*filename:\s*"([^"]+)"\s*description:\s*"([^"]+)"\s*placement:\s*"([^"]+)"/gi;
    let match;
    while ((match = pattern.exec(sectionContent)) !== null) {
      const [, number, filename, description, placement] = match;
      matches.push({
        filename: this.normalizeFilename(filename, matches.length + 1),
        description: description.trim(),
        placement: placement.trim()
      });
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

  // 파싱된 설명을 사용하는 이미지 객체 생성 메서드
  private createImageObjectWithDescription(filename: string, description: string, placement: string, pageContent: Step2PageContent, index: number) {
    return {
      id: `page-${pageContent.pageNumber}-${index}`,
      fileName: filename.startsWith('page') ? filename : `page${pageContent.pageNumber}/${filename}`,
      path: `~/image/page${pageContent.pageNumber}/${filename}`,
      type: 'image',
      category: '교육 시각화',
      purpose: `교육 시각 자료 ${index}`,
      description: description || `${pageContent.pageTitle} 관련 교육 이미지`,
      sizeGuide: '600×400px',
      placement: {
        section: placement || '메인 영역',
        position: index === 1 ? '중앙' : `위치${index}`,
        size: '600×400px'
      },
      accessibility: {
        altText: `${pageContent.pageTitle} 관련 교육 이미지`,
        caption: `${pageContent.pageTitle} 시각 자료`
      },
      aiPrompt: this.extractAIPromptFromDescription(description, pageContent.pageTitle)
    };
  }

  // 이미지 설명에서 AI 프롬프트 추출 또는 생성
  private extractAIPromptFromDescription(description: string, topic: string): string {
    // 설명이 영어로 시작하면 그대로 사용
    if (/^[A-Za-z]/.test(description.trim())) {
      return description.trim();
    }

    // 한국어 설명을 기반으로 영문 프롬프트 생성
    return `Educational illustration for ${topic}, detailed and clear visual representation with bright blue, soft green, and warm orange colors and simple design elements, suitable for students`;
  }

  private extractNarrativeSegments(content: string): NarrativeSegments {
    const normalized = (content || '').replace(/\r\n/g, '\n').trim();

    const narrative = this.extractSection(normalized, '레이아웃_스토리');
    const visual = this.extractSection(normalized, '비주얼_가이드');
    const implementation = this.extractSection(normalized, '구현_노트');

    const fallbackParagraphs = normalized
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return {
      layoutNarrative: narrative || fallbackParagraphs[0] || normalized || '레이아웃 설명을 생성하지 못했습니다.',
      visualGuidelines: visual || fallbackParagraphs[1] || '비주얼 가이드를 생성하지 못했습니다.',
      implementationNotes: implementation || fallbackParagraphs[2] || '구현 시 고려 사항을 생성하지 못했습니다.'
    };
  }

  private extractSection(content: string, key: string): string {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternText = String.raw`${escapedKey}:\s*([^]+?)(?=\n[^:\n]+:|$)`;
    const match = content.match(new RegExp(patternText, 'i'));
    if (!match || !match[1]) {
      return '';
    }

    return match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }
}

function createDesignTokens(layoutMode: 'fixed' | 'scrollable'): LayoutDesignTokens {
  return {
    viewport: layoutMode === 'fixed' ? { width: 1600, height: 1000 } : { width: 1600 },
    safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
    grid: {
      columns: 12,
      gap: 24,
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
    },
    spacing: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
      section: 32,
      component: 16
    },
    typography: {
      scale: {
        h1: '32px',
        h2: '24px',
        h3: '20px',
        body: '18px',
        caption: '14px'
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    layout: {
      maxContentWidth: 1200,
      imageAspectRatios: ['16:9', '4:3', '1:1'],
      buttonSizes: ['sm', 'md', 'lg']
    }
  };
}
