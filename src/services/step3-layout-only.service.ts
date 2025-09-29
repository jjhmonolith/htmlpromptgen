import { OpenAIService } from './openai.service';
import { Step2NewResult } from '../types/step2-new.types';
import {
  Step3LayoutOnlyResult,
  Step3LayoutInput,
  PageLayoutResult,
  LayoutSection,
  PageTextContent
} from '../types/step3-layout-only.types';
import { Step3LayoutResponseParser } from './step3-layout-response-parser';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

class Step3LayoutFallbackProvider implements FallbackProvider<Step3LayoutOnlyResult> {
  constructor(private input: Step3LayoutInput) {}

  createFallback(): Step3LayoutOnlyResult {
    const { step2Result, layoutMode } = this.input;

    const fallbackPages: PageLayoutResult[] = step2Result.pageContents.map((pageContent, index) => ({
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

      layoutStructure: {
        concept: `${pageContent.pageTitle}을 위한 클린하고 교육적인 레이아웃`,
        sections: [
          {
            id: 'header',
            name: '헤더 영역',
            gridSpan: '1-12',
            height: '120px',
            purpose: '학습목표와 핵심메시지 제시',
            content: '학습목표 + 핵심메시지',
            styling: '간결하고 명확한 스타일'
          },
          {
            id: 'main-content',
            name: '메인 콘텐츠 영역',
            gridSpan: layoutMode === 'fixed' ? '1-8' : '1-12',
            height: layoutMode === 'fixed' ? '600px' : 'auto',
            purpose: '교안 본문 텍스트 표시',
            content: '교안 본문',
            styling: '가독성 중심의 타이포그래피'
          },
          {
            id: 'image',
            name: '이미지 영역',
            gridSpan: layoutMode === 'fixed' ? '9-12' : '1-12',
            height: layoutMode === 'fixed' ? '400px' : '300px',
            purpose: '시각적 자료 표시',
            content: '교육용 이미지',
            styling: '적절한 여백과 캡션'
          },
          {
            id: 'interaction',
            name: '상호작용 영역',
            gridSpan: '1-12',
            height: '100px',
            purpose: '상호작용 요소 제공',
            content: '상호작용 요소',
            styling: '참여를 유도하는 디자인'
          }
        ],
        gridSystem: '12컬럼 그리드 시스템 활용',
        spacingStrategy: '섹션 간 일정한 간격 유지'
      },

      imageLayout: {
        placement: layoutMode === 'fixed' ? '우측 사이드바 형태' : '콘텐츠 하단 중앙',
        sizing: layoutMode === 'fixed' ? '400×300px' : '600×400px',
        integration: '텍스트와 자연스러운 연결'
      },

      designGuide: {
        typography: '제목은 24px, 본문은 18px, 적절한 줄간격',
        colorApplication: '주요 색상은 제목과 강조, 보조 색상은 배경',
        spacingDetails: '섹션 간 32px, 컴포넌트 간 16px',
        visualEmphasis: '핵심 메시지는 배경색으로 강조'
      },

      implementationGuide: {
        cssStructure: 'container > section > component 구조',
        responsiveStrategy: '모바일에서는 단일 컬럼으로 재배치',
        accessibilityNotes: 'ARIA 라벨과 키보드 네비게이션 지원'
      },

      generatedAt: new Date()
    }));

    return {
      layoutMode,
      pages: fallbackPages,
      designTokens: {
        viewport: layoutMode === 'fixed' ? { width: 1600, height: 1000 } : { width: 1600 },
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
        grid: {
          columns: 12,
          gap: 24,
          breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
        },
        spacing: {
          xs: 8, sm: 16, md: 24, lg: 32, xl: 48,
          section: 32, component: 16
        },
        typography: {
          scale: {
            h1: '32px', h2: '24px', h3: '20px',
            body: '18px', caption: '14px'
          },
          lineHeight: { tight: 1.2, normal: 1.6, relaxed: 1.8 }
        },
        layout: {
          maxContentWidth: 1200,
          imageAspectRatios: ['16:9', '4:3', '1:1'],
          buttonSizes: ['sm', 'md', 'lg']
        }
      },
      generatedAt: new Date(),
      processingTime: 0
    };
  }
}

export class Step3LayoutOnlyService {
  private errorHandler = createStepErrorHandler('Step3LayoutOnly');
  private parser = new Step3LayoutResponseParser();

  constructor(private openAIService: OpenAIService) {}

  async generatePageLayout(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable',
    pageIndex: number
  ): Promise<PageLayoutResult> {
    const input: Step3LayoutInput = { step2Result, layoutMode, pageIndex };

    // 입력 검증
    this.errorHandler.validateInput('step2Result', step2Result, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('pageContents', step2Result.pageContents, (pages) => Array.isArray(pages) && pages.length > 0);
    this.errorHandler.validateInput('pageIndex', pageIndex, (idx) => typeof idx === 'number' && idx >= 0 && idx < step2Result.pageContents.length);

    const fallbackProvider = new Step3LayoutFallbackProvider(input);
    const startTime = Date.now();

    const fullResult = await this.errorHandler.handle(
      async () => {
        console.log(`🎨 Step3 레이아웃: 페이지 ${pageIndex + 1} 레이아웃 설계 시작`);
        const currentPage = step2Result.pageContents[pageIndex];
        console.log('📋 대상 페이지:', currentPage.pageTitle);

        const prompt = this.createStep3LayoutPrompt(step2Result, layoutMode, pageIndex);
        console.log('📝 Step3 레이아웃 프롬프트 생성 완료');

        console.log('🚀 OpenAI API 호출 시작...');
        const response = await this.openAIService.generateCompletion(
          prompt,
          'Step3LayoutOnly',
          'gpt-4o-mini'
        );

        console.log('✅ OpenAI API 응답 수신');

        // API 응답 검증
        this.errorHandler.validateApiResponse(response);

        // 텍스트 파싱
        const parsedLayout = this.parser.parseLayoutResponse(response.content, pageIndex);
        console.log('✅ Step3 레이아웃 파싱 완료');

        // 최종 페이지 레이아웃 결과 조립
        const pageLayoutResult = this.assemblePageLayoutResult(
          currentPage,
          parsedLayout,
          step2Result,
          layoutMode
        );

        const processingTime = Date.now() - startTime;
        console.log(`🎯 페이지 ${pageIndex + 1} 레이아웃 설계 완료 (${processingTime}ms)`);

        return {
          layoutMode,
          pages: [pageLayoutResult],
          designTokens: fallbackProvider.createFallback().designTokens,
          generatedAt: new Date(),
          processingTime
        };
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );

    return fullResult.pages[0];
  }

  async generateAllPagesLayout(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable'
  ): Promise<Step3LayoutOnlyResult> {
    console.log('🎨 Step3 레이아웃: 전체 페이지 레이아웃 설계 시작');
    const startTime = Date.now();

    const pageResults: PageLayoutResult[] = [];

    // 각 페이지별로 레이아웃 생성
    for (let i = 0; i < step2Result.pageContents.length; i++) {
      try {
        const pageLayout = await this.generatePageLayout(step2Result, layoutMode, i);
        pageResults.push(pageLayout);
        console.log(`✅ 페이지 ${i + 1}/${step2Result.pageContents.length} 완료`);
      } catch (error) {
        console.error(`❌ 페이지 ${i + 1} 레이아웃 생성 실패:`, error);
        // 실패한 페이지는 폴백으로 처리
        const fallback = new Step3LayoutFallbackProvider({ step2Result, layoutMode, pageIndex: i });
        const fallbackResult = fallback.createFallback();
        pageResults.push(fallbackResult.pages[0]);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      layoutMode,
      pages: pageResults,
      designTokens: {
        viewport: layoutMode === 'fixed' ? { width: 1600, height: 1000 } : { width: 1600 },
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
        grid: {
          columns: 12,
          gap: 24,
          breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
        },
        spacing: {
          xs: 8, sm: 16, md: 24, lg: 32, xl: 48,
          section: 32, component: 16
        },
        typography: {
          scale: {
            h1: '32px', h2: '24px', h3: '20px',
            body: '18px', caption: '14px'
          },
          lineHeight: { tight: 1.2, normal: 1.6, relaxed: 1.8 }
        },
        layout: {
          maxContentWidth: 1200,
          imageAspectRatios: ['16:9', '4:3', '1:1'],
          buttonSizes: ['sm', 'md', 'lg']
        }
      },
      generatedAt: new Date(),
      processingTime
    };
  }

  private createStep3LayoutPrompt(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable',
    pageIndex: number
  ): string {
    const currentPage = step2Result.pageContents[pageIndex];
    const totalPages = step2Result.pageContents.length;

    // 페이지 컨텍스트 생성
    const prevPageContext = pageIndex > 0
      ? `이전 페이지: ${step2Result.pageContents[pageIndex - 1].pageTitle}`
      : '첫 번째 페이지입니다';

    const nextPageContext = pageIndex < totalPages - 1
      ? `다음 페이지: ${step2Result.pageContents[pageIndex + 1].pageTitle}`
      : '마지막 페이지입니다';

    // 레이아웃 모드별 기본 설정
    const layoutConstraints = layoutMode === 'fixed'
      ? {
          dimensions: '1600×1000px 고정 화면',
          scrollPolicy: '스크롤 없이 모든 내용이 한 화면에 들어가야 함',
          contentStrategy: '공간 효율성을 최우선으로 콘텐츠를 배치하세요'
        }
      : {
          dimensions: '1600px 너비, 세로 자유 확장',
          scrollPolicy: '자연스러운 세로 스크롤을 고려한 콘텐츠 배치',
          contentStrategy: '세로 흐름을 고려하여 읽기 편한 구조로 배치하세요'
        };

    return `당신은 레이아웃 설계 전문가입니다.
Step2에서 완성된 교안 텍스트와 비주얼 아이덴티티를 바탕으로 최적의 레이아웃을 설계해주세요.

## 🎨 적용할 비주얼 아이덴티티
- **분위기**: ${step2Result.visualIdentity.moodAndTone.join(', ')}
- **주요 색상**: ${step2Result.visualIdentity.colorPalette.primary}
- **보조 색상**: ${step2Result.visualIdentity.colorPalette.secondary}
- **강조 색상**: ${step2Result.visualIdentity.colorPalette.accent}
- **제목 폰트**: ${step2Result.visualIdentity.typography.headingFont}
- **본문 폰트**: ${step2Result.visualIdentity.typography.bodyFont}
- **컴포넌트 스타일**: ${step2Result.visualIdentity.componentStyle}

## 📐 레이아웃 제약사항
- **크기**: ${layoutConstraints.dimensions}
- **스크롤**: ${layoutConstraints.scrollPolicy}
- **전략**: ${layoutConstraints.contentStrategy}

## 📄 배치할 페이지 정보
**현재 페이지**: ${pageIndex + 1}/${totalPages} - ${currentPage.pageTitle}
- ${prevPageContext}
- ${nextPageContext}

### 페이지 콘텐츠
**학습목표**: ${currentPage.learningGoal}
**핵심메시지**: ${currentPage.keyMessage}

**교안 본문** (${currentPage.fullTextContent.length}자):
"""
${currentPage.fullTextContent}
"""

**필요한 이미지**: ${currentPage.imageDescription}
**상호작용 요소**: ${currentPage.interactionHint}

## 🎯 레이아웃 설계 가이드라인

### 1. 콘텐츠 배치 원칙
- **기존 텍스트 보존**: Step2에서 생성된 교안 텍스트를 수정하지 말고 그대로 사용
- **시각적 계층**: 학습목표 → 핵심메시지 → 본문 → 상호작용 순으로 중요도 표현
- **가독성 우선**: 텍스트 블록을 적절히 나누어 읽기 편하게 구성
- **이미지 통합**: 교안 텍스트와 자연스럽게 연결되는 이미지 배치

### 2. 레이아웃 구조 설계
${layoutMode === 'fixed' ? `
**고정 레이아웃 전략**:
- 화면을 효율적으로 분할하여 모든 콘텐츠를 배치
- 여백과 콘텐츠의 균형을 고려
- 시선의 자연스러운 흐름 설계 (Z-패턴 또는 F-패턴)
` : `
**스크롤 레이아웃 전략**:
- 세로 흐름에 맞는 자연스러운 콘텐츠 배치
- 섹션별 명확한 구분과 연결
- 스크롤 인터랙션을 고려한 콘텐츠 그루핑
`}

### 3. 구체적 설계 요구사항
- **섹션 구조**: 논리적 블록으로 콘텐츠를 나누고 각 섹션의 역할 명시
- **그리드 시스템**: 12컬럼 그리드 기준으로 요소 배치 (예: 8+4, 2-11, 1-12)
- **간격 체계**: 요소 간 여백과 패딩을 체계적으로 설계
- **반응형 고려**: 다양한 화면 크기에서의 적응 방안

## 📝 출력 형식

다음 형식으로 레이아웃을 설계해주세요:

### 페이지 구조 설계
**전체 레이아웃 개념**: [이 페이지의 전체적인 레이아웃 컨셉을 2-3줄로 설명]

**섹션별 구성**:
1. **헤더 영역** (그리드: 1-12, 높이: XXXpx)
   - 배치 요소: 학습목표 + 핵심메시지
   - 스타일링: [구체적인 디자인 설명]

2. **메인 콘텐츠 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: 교안 본문 텍스트
   - 텍스트 분할: [몇 개 문단으로 나눌지, 어떻게 배치할지]
   - 스타일링: [구체적인 디자인 설명]

3. **이미지 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: ${currentPage.imageDescription}
   - 위치: [왼쪽/오른쪽/중앙/삽입 위치]
   - 스타일링: [구체적인 디자인 설명]

4. **상호작용 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: ${currentPage.interactionHint}
   - 스타일링: [구체적인 디자인 설명]

### 세부 디자인 가이드
**타이포그래피**: [폰트 크기, 라인 높이, 색상 적용]
**색상 적용**: [어떤 요소에 어떤 색상을 사용할지]
**간격 체계**: [섹션 간 여백, 요소 간 패딩]
**시각적 강조**: [중요한 부분을 어떻게 강조할지]

### 구현 가이드라인
**CSS 클래스 구조**: [예상되는 주요 CSS 클래스명과 역할]
**반응형 전략**: [화면 크기별 적응 방안]
**접근성 고려사항**: [스크린 리더, 키보드 네비게이션 등]

---

**중요**: Step2에서 생성된 텍스트 내용은 절대 수정하지 마세요. 오직 레이아웃과 배치, 스타일링만 설계해주세요.`;
  }

  private assemblePageLayoutResult(
    pageContent: any,
    parsedLayout: any,
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable'
  ): PageLayoutResult {
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

      layoutStructure: {
        concept: parsedLayout.layoutConcept || `${pageContent.pageTitle}을 위한 교육적 레이아웃`,
        sections: parsedLayout.sections || [],
        gridSystem: '12컬럼 그리드 시스템',
        spacingStrategy: '일관된 간격 체계'
      },

      imageLayout: parsedLayout.imageLayout || {
        placement: layoutMode === 'fixed' ? '우측 배치' : '하단 중앙',
        sizing: '적절한 크기',
        integration: '텍스트와 조화'
      },

      designGuide: parsedLayout.designGuide || {
        typography: '계층적 폰트 사이즈',
        colorApplication: '브랜드 색상 활용',
        spacingDetails: '일정한 여백',
        visualEmphasis: '핵심 내용 강조'
      },

      implementationGuide: parsedLayout.implementationGuide || {
        cssStructure: '모듈화된 CSS',
        responsiveStrategy: '모바일 친화적',
        accessibilityNotes: '접근성 준수'
      },

      generatedAt: new Date()
    };
  }
}