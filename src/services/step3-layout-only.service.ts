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
      const layoutNarrative = [
        `${pageContent.pageTitle} 페이지는 ${layoutMode === 'fixed' ? '한 화면 안에서' : '세로 스크롤 흐름을 따라'} ${pageContent.keyMessage}를 자연스럽게 강조하도록 구성합니다.`,
        `학습자는 ${pageContent.learningGoal} 목표를 따라가며 핵심 문장을 단계적으로 확인할 수 있도록 본문과 이미지, 참여 요소를 분명하게 구분합니다.`
      ].join(' ');

      const visualGuidelines = [
        `${visual.moodAndTone.join(', ')} 분위기를 유지하면서 ${visual.componentStyle} 특징을 반영해 헤더와 본문을 분리하고,`,
        `주요 색상 ${visual.colorPalette.primary}는 제목과 구분선에, ${visual.colorPalette.accent}는 체크포인트 강조에 사용합니다.`
      ].join(' ');

      const implementationNotes = [
        `${layoutMode === 'fixed' ? '12컬럼 기준 8:4 분할로 본문과 이미지를 병렬 배치하고,' : '본문은 전체 폭을 활용하고 이미지와 상호작용 영역을 분리하여 순차적으로 배치합니다.'}`,
        `${pageContent.imageDescription} 이미지는 본문과 24px 이상 떨어뜨리고, ${pageContent.interactionHint} 활동을 하단에 배치해 학습 흐름을 마무리합니다.`,
        '모바일에서는 단일 컬럼으로 재배치하고 주요 텍스트 블록 간에는 24px 간격을 유지합니다.'
      ].join(' ');

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
        layoutNarrative,
        visualGuidelines,
        implementationNotes,
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
            reasoningEffort: 'low',
            maxOutputTokens: 4000,
            temperature: layoutMode === 'fixed' ? 0.5 : 0.6
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

    const layoutDescriptor = layoutMode === 'fixed'
      ? '1600×1000px 고정 화면, 스크롤 금지, 한 화면 내에서 모든 정보 제공'
      : '1600px 너비, 세로 스크롤 허용, 자연스러운 위에서 아래로 흐름';

    const prevPage = pageIndex > 0
      ? `${step2Result.pageContents[pageIndex - 1].pageTitle} 이후에 이어지는 페이지`
      : '이 프로젝트의 첫 페이지';

    const nextPage = pageIndex < pageCount - 1
      ? `${step2Result.pageContents[pageIndex + 1].pageTitle}로 이어집니다`
      : '이후에 이어지는 페이지가 없습니다';

    return `당신은 교육용 디지털 교안을 설계하는 시니어 레이아웃 디자이너입니다.
Step2에서 작성된 교안 텍스트를 수정하지 않고, 해당 페이지가 어떤 화면 구성으로 구현되어야 할지 서술형으로 설명하세요.

[페이지 메타 정보]
- 전체 페이지 수: ${pageCount}
- 현재 페이지: ${pageIndex + 1} (${currentPage.pageTitle})
- 이전 흐름: ${prevPage}
- 다음 흐름: ${nextPage}
- 레이아웃 모드: ${layoutDescriptor}

[비주얼 아이덴티티 가이드]
- 분위기 키워드: ${visual.moodAndTone.join(', ')}
- 주요 색상: ${visual.colorPalette.primary}, 보조 색상: ${visual.colorPalette.secondary}, 강조 색상: ${visual.colorPalette.accent}
- 타이포그래피: 제목 ${visual.typography.headingFont}, 본문 ${visual.typography.bodyFont}
- 컴포넌트 스타일: ${visual.componentStyle}

[페이지 학습 정보]
- 학습 목표: ${currentPage.learningGoal}
- 핵심 메시지: ${currentPage.keyMessage}
- 이미지 설명: ${currentPage.imageDescription}
- 상호작용 아이디어: ${currentPage.interactionHint}

[교안 본문]
"""
${currentPage.fullTextContent}
"""

[작성 규칙]
- Step2 텍스트를 그대로 복사하지 말고, 화면 배치와 구조, 흐름을 설명하는 서술형 문단을 작성하세요.
- 불릿 리스트, 표, 코드 블록을 사용하지 말고 문장 단위로 작성하세요.
- 학습자의 시선 흐름, 주요 영역의 역할, 이미지와 상호작용 배치까지 언급하세요.
- 레이아웃 모드가 fixed이면 한 화면에 들어오도록 배치 전략을, scrollable이면 스크롤 흐름을 명확히 설명하세요.
- 모바일 대응과 접근성 관련 고려 사항도 간단히 포함하세요.

[출력 형식]
레이아웃_스토리: [2-3문단으로 전체 화면 흐름과 배치를 설명]
비주얼_가이드: [1-2문단으로 색상, 타이포그래피, 이미지 사용법 설명]
구현_노트: [1-2문단으로 CSS/그리드 전략, 반응형, 접근성을 정리]
`
      .trim();
  }

  private buildPageLayoutResult(pageContent: Step2PageContent, rawContent: string): PageLayoutResult {
    const segments = this.extractNarrativeSegments(rawContent);

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
      layoutNarrative: segments.layoutNarrative,
      visualGuidelines: segments.visualGuidelines,
      implementationNotes: segments.implementationNotes,
      generatedAt: new Date()
    };
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
