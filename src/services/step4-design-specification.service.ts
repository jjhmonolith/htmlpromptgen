import { OpenAIService } from './openai.service';
import {
  ProjectData,
  VisualIdentity,
  Step3IntegratedResult
} from '../types/workflow.types';
import {
  Step4DesignResult,
  Step4PageResult
} from '../types/step4.types';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

class Step4FallbackProvider implements FallbackProvider<Step4PageResult> {
  constructor(
    private pageId: string,
    private pageTitle: string,
    private pageNumber: number,
    private layoutMode: 'fixed' | 'scrollable'
  ) {}

  createFallback(): Step4PageResult {
    return {
      pageId: this.pageId,
      pageTitle: this.pageTitle,
      pageNumber: this.pageNumber,
      layout: {
        pageWidth: 1600,
        pageHeight: this.layoutMode === 'fixed' ? 1000 : 'auto',
        sections: [{
          id: 'main',
          gridType: '1-12',
          position: { x: 0, y: 0 },
          dimensions: { width: 1600, height: 'auto' },
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
          backgroundColor: '#FFFFFF',
          gap: 24,
          marginBottom: 24
        }],
        backgroundColor: '#FFFFFF',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 }
      },
      componentStyles: [{
        id: 'comp1',
        type: 'paragraph',
        section: 'main',
        position: { x: 100, y: 100 },
        dimensions: { width: 300, height: 'auto' },
        font: {
          family: 'Noto Sans KR',
          weight: 400,
          size: '18px',
          lineHeight: 1.6
        },
        colors: {
          text: '#1F2937',
          background: 'transparent'
        },
        visual: {
          borderRadius: 8,
          opacity: 1
        },
        zIndex: 1,
        display: 'block'
      }],
      imagePlacements: [{
        id: 'img1',
        filename: '1.png',
        section: 'main',
        position: { x: 400, y: 100 },
        dimensions: { width: 200, height: 150 },
        objectFit: 'cover',
        borderRadius: 8,
        loading: 'lazy',
        priority: 'normal',
        alt: '기본 이미지',
        zIndex: 10
      }],
      interactions: [{
        id: 'basic',
        target: '*',
        trigger: 'hover',
        effect: 'scale',
        duration: '200ms',
        delay: '0ms',
        easing: 'ease-in-out'
      }],
      educationalFeatures: [{
        id: 'basic',
        type: 'scrollIndicator',
        position: 'bottom',
        dimensions: { width: 100, height: 4 },
        styling: {
          primaryColor: '#3B82F6',
          secondaryColor: '#E5E7EB',
          backgroundColor: 'transparent',
          opacity: 0.8
        },
        behavior: {
          autoUpdate: true,
          userControl: false,
          persistence: false
        }
      }],
      isGenerating: false,
      isComplete: true,
      animationDescription: '기본 애니메이션: 요소들이 부드럽게 나타납니다.',
      interactionDescription: '기본 인터랙션: 호버 시 요소들이 반응합니다.',
      generatedAt: new Date()
    };
  }
}

/**
 * Step4 디자인 명세 생성 서비스
 *
 * Step3의 컴포넌트/이미지 계획을 실제 구현 가능한 구체적 디자인 명세로 변환합니다.
 * 교육용 HTML 교안의 최종 구체화 단계를 담당합니다.
 */
export class Step4DesignSpecificationService {
  private errorHandler = createStepErrorHandler('Step4');
  constructor(private openAIService: OpenAIService) {}

  /**
   * Step3 결과를 받아 정밀한 디자인 명세 생성
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param step3Result Step3 통합 디자인 결과
   * @returns 구현 가능한 디자인 명세
   * @throws Step4GenerationError 생성 실패 시
   */
  async generateDesignSpecification(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3Result: Step3IntegratedResult
  ): Promise<Step4DesignResult> {
    console.log('🎯 Step4: 디자인 명세 생성 시작');

    // 입력 검증
    this.validateInputs(projectData, visualIdentity, step3Result);

    // 페이지별 순차 처리
    const processedPages = await this.processAllPages(step3Result.pages, projectData, visualIdentity);

    // 글로벌 기능 생성
    const globalFeatures = this.generateGlobalFeatures(projectData.layoutMode);

    const result: Step4DesignResult = {
      layoutMode: projectData.layoutMode,
      pages: processedPages,
      globalFeatures,
      generatedAt: new Date()
    };

    console.log('✅ Step4: 디자인 명세 생성 완료');
    return result;
  }

  /**
   * 개별 페이지 재생성
   */
  async regeneratePage(
    result: Step4DesignResult,
    pageIndex: number,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3PageData: any
  ): Promise<void> {
    const page = result.pages[pageIndex];
    const pageNumber = pageIndex + 1;

    try {
      console.log(`🔄 Step4: 페이지 ${pageNumber} 재생성 시작`);

      page.isGenerating = true;
      page.error = undefined;

      const regeneratedPage = await this.processPage(step3PageData, projectData, visualIdentity);

      // 기존 페이지 데이터를 새로운 데이터로 교체
      Object.assign(page, regeneratedPage);

      console.log(`✅ 페이지 ${pageNumber} 재생성 완료`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 페이지 ${pageNumber} 재생성 실패:`, errorMessage);
      page.error = errorMessage;
    } finally {
      page.isGenerating = false;
    }
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * 입력 데이터 검증
   */
  private validateInputs(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3Result: Step3IntegratedResult
  ): void {
    this.errorHandler.validateInput('projectData.pages', projectData?.pages, (pages) => Array.isArray(pages) && pages.length > 0);
    this.errorHandler.validateInput('visualIdentity.colorPalette', visualIdentity?.colorPalette, (palette) => palette && typeof palette === 'object');
    this.errorHandler.validateInput('step3Result.pages', step3Result?.pages, (pages) => Array.isArray(pages) && pages.length > 0);

    const completedPages = step3Result.pages.filter(p => p.phase2Complete);
    this.errorHandler.validateInput('completedPages', completedPages, (pages) => pages.length > 0);

    console.log('✅ Step4: 입력 데이터 검증 완료');
  }

  /**
   * 모든 페이지 처리
   */
  private async processAllPages(
    step3Pages: any[],
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<Step4PageResult[]> {
    console.log(`⚡ Step4: ${step3Pages.length}개 페이지 처리 시작`);

    const results: Step4PageResult[] = [];

    for (let i = 0; i < step3Pages.length; i++) {
      const page = step3Pages[i];

      try {
        if (!page.phase2Complete) {
          console.log(`⏭️ 페이지 ${page.pageNumber}: Step3 Phase2 미완료로 건너뜀`);
          results.push(this.createEmptyPageResult(page));
          continue;
        }

        console.log(`🔄 페이지 ${page.pageNumber} 처리 시작`);
        const result = await this.processPage(page, projectData, visualIdentity);
        results.push(result);
        console.log(`✅ 페이지 ${page.pageNumber} 처리 완료`);

      } catch (error) {
        console.error(`❌ 페이지 ${page.pageNumber} 처리 실패:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push(this.createErrorPageResult(page, errorMessage));
      }
    }

    console.log(`✅ Step4: ${step3Pages.length}개 페이지 처리 완료`);
    return results;
  }

  /**
   * 개별 페이지 처리 (JSON 스키마 기반)
   */
  private async processPage(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<Step4PageResult> {
    // 입력 검증
    this.errorHandler.validateInput('step3PageData', step3PageData, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('projectData', projectData, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('visualIdentity', visualIdentity, (vi) => vi && typeof vi === 'object');

    const fallbackProvider = new Step4FallbackProvider(
      step3PageData.pageId || 'fallback',
      step3PageData.pageTitle || '기본 페이지',
      step3PageData.pageNumber || 1,
      projectData.layoutMode
    );

    return this.errorHandler.handle(
      async () => {
        console.log('🎯 텍스트 기반 Step4 페이지 생성 시작');

        // AI 프롬프트 생성
        const prompt = this.createStep4Prompt(step3PageData, projectData, visualIdentity);

        // AI 호출 (텍스트 기반 응답)
        const response = await this.openAIService.generateCompletion(
          prompt,
          `Step4 Page ${step3PageData.pageNumber}`,
          'gpt-5'
        );

        // API 응답 검증
        this.errorHandler.validateApiResponse(response);

        const parsedData = this.parseJsonResponse(response.content);
        console.log('✅ Step4 파싱 완료:', parsedData);

        // 결과 어셈블리
        const result = this.assembleStep4FromJson(parsedData, step3PageData, projectData.layoutMode);
        console.log('🎯 Step4 최종 결과 조립 완료');

        return result;
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );
  }


  private createStep4Prompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): string {
    const moodAndTone = Array.isArray(visualIdentity.moodAndTone)
      ? visualIdentity.moodAndTone.join(', ')
      : visualIdentity.moodAndTone;

    // 전체 프로젝트 구성
    const allPages = projectData.pages.map((p, index) =>
      `페이지 ${p.pageNumber} (${p.topic}${p.description ? ` - ${p.description}` : ''}): ${step3PageData.pageNumber === p.pageNumber ? step3PageData.structure?.sections?.[0]?.hint || '현재 페이지' : '...'}`
    ).join('\n');

    // 페이지 구성안 설명
    const pageContent = this.buildPageContentSummary(step3PageData);

    // 레이아웃 모드에 따른 프롬프트 분기
    if (projectData.layoutMode === 'fixed') {
      // 스크롤 금지 + 내용 제한 모드
      return `당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ⚠️ 원본 유지 모드
이 프로젝트는 사용자가 제공한 내용만을 사용합니다. 하지만 애니메이션과 상호작용은 반드시 제안해야 합니다! 기존 내용을 효과적으로 전달하기 위한 애니메이션과 인터랙션을 상세히 설명하세요. 추가 콘텐츠 생성은 제한되지만, 시각적 효과와 상호작용은 풍부하게 제안하세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${moodAndTone}
- **색상**: Primary-${visualIdentity.colorPalette?.primary || '#3B82F6'}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📍 전체 페이지 구성 개요
${allPages}

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 전체적인 분위기 및 스타일 제안: ${projectData.additionalRequirements || '기본적인 교육용 디자인'}
- 현재 페이지 ${step3PageData.pageNumber}: ${step3PageData.pageTitle}

### 페이지 구성안:
${pageContent}

### 제안 가이드라인
- **목적 지향적 제안**: "애니메이션을 추가하라"가 아니라, "콘텐츠의 스토리를 강화하고, 사용자의 이해를 돕는 점진적 정보 공개(Progressive Disclosure)를 위한 애니메이션을 제안하라."
- **미세 상호작용**: 버튼 호버 효과와 같은 미세 상호작용(Micro-interaction)으로 페이지에 생동감을 불어넣는 아이디어를 포함하세요.
- **분위기 일관성**: 제안하는 모든 효과는 정의된 '분위기'(${moodAndTone})와 일치해야 합니다.
- **전체 일관성**: 다른 페이지들과 일관된 애니메이션 스타일을 유지하되, 각 페이지의 특색을 살려주세요.

### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.

### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}`;

    } else {
      // 스크롤 허용 + AI 내용 보강 모드
      return `당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ✨ AI 보강 모드
창의적인 애니메이션과 상호작용을 자유롭게 제안하세요. 학습 효과를 높이는 추가적인 시각 효과나 인터랙션을 적극적으로 제안할 수 있습니다.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${moodAndTone}
- **색상**: Primary-${visualIdentity.colorPalette?.primary || '#3B82F6'}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📍 전체 페이지 구성 개요
${allPages}

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 전체적인 분위기 및 스타일 제안: ${projectData.additionalRequirements || '기본적인 교육용 디자인'}
- 현재 페이지 ${step3PageData.pageNumber}: ${step3PageData.pageTitle}

### 페이지 구성안:
${pageContent}

### 제안 가이드라인
- **목적 지향적 제안**: "애니메이션을 추가하라"가 아니라, "콘텐츠의 스토리를 강화하고, 사용자의 이해를 돕는 점진적 정보 공개(Progressive Disclosure)를 위한 애니메이션을 제안하라."
- **미세 상호작용**: 버튼 호버 효과와 같은 미세 상호작용(Micro-interaction)으로 페이지에 생동감을 불어넣는 아이디어를 포함하세요.
- **분위기 일관성**: 제안하는 모든 효과는 정의된 '분위기'(${moodAndTone})와 일치해야 합니다.
- **전체 일관성**: 다른 페이지들과 일관된 애니메이션 스타일을 유지하되, 각 페이지의 특색을 살려주세요.

### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.

### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}`;
    }
  }



  private buildPageContentSummary(step3PageData: any): string {
    // Step3 구조 정보를 요약
    const sections = step3PageData.structure?.sections || [];
    const components = step3PageData.content?.components || [];
    const images = step3PageData.content?.images || [];

    let summary = `**페이지 구조:**\n`;
    sections.forEach((section: any) => {
      summary += `- ${section.id}: ${section.hint} (${section.grid})\n`;
    });

    summary += `\n**컴포넌트 (${components.length}개):**\n`;
    components.slice(0, 5).forEach((comp: any) => {
      summary += `- ${comp.id}: ${comp.type} - "${comp.text || '내용 없음'}"\n`;
    });

    summary += `\n**이미지 (${images.length}개):**\n`;
    images.forEach((img: any) => {
      summary += `- ${img.id}: ${img.desc} (${img.secRef})\n`;
    });

    return summary;
  }

  private parseJsonResponse(textContent: string): any {
    try {
      // JSON 부분만 추출
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // 전체를 JSON으로 파싱 시도
      return JSON.parse(textContent.trim());
    } catch (error) {
      console.error('JSON 파싱 실패:', error);
      // 기본 JSON 구조 반환
      return {
        animationDescription: '기본 애니메이션: 요소들이 부드럽게 나타납니다.',
        interactionDescription: '기본 인터랙션: 호버 시 요소들이 반응합니다.'
      };
    }
  }

  private assembleStep4FromJson(parsedData: any, step3PageData: any, layoutMode: 'fixed' | 'scrollable'): Step4PageResult {
    return {
      pageId: step3PageData.pageId,
      pageTitle: step3PageData.pageTitle,
      pageNumber: step3PageData.pageNumber,
      layout: {
        pageWidth: 1600,
        pageHeight: layoutMode === 'fixed' ? 1000 : 'auto',
        sections: step3PageData.structure?.sections?.map((section: any, index: number) => ({
          id: section.id || `section_${index}`,
          gridType: (section.grid as '1-12' | '8+4' | '2-11' | '3-10') || '1-12',
          position: { x: 0, y: index * 200 },
          dimensions: { width: 1600, height: section.height || 'auto' },
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
          backgroundColor: section.background || '#FFFFFF',
          gap: 24,
          marginBottom: 24
        })) || [{
          id: 'main',
          gridType: '1-12',
          position: { x: 0, y: 0 },
          dimensions: { width: 1600, height: 'auto' },
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
          backgroundColor: '#FFFFFF',
          gap: 24,
          marginBottom: 24
        }],
        backgroundColor: '#FFFFFF',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 }
      },
      componentStyles: step3PageData.content?.components?.map((comp: any, index: number) => ({
        id: comp.id,
        type: comp.type === 'text' ? 'paragraph' : (comp.type as 'heading' | 'paragraph' | 'card' | 'image'),
        section: 'main',
        position: { x: 100 + (index % 2) * 300, y: 100 + Math.floor(index / 2) * 100 },
        dimensions: { width: 300, height: 'auto' },
        font: {
          family: 'Noto Sans KR',
          weight: 400,
          size: '18px',
          lineHeight: 1.6
        },
        colors: {
          text: '#1F2937',
          background: 'transparent'
        },
        visual: {
          borderRadius: 8,
          opacity: 1
        },
        zIndex: 1,
        display: 'block'
      })) || [],
      imagePlacements: step3PageData.content?.images?.map((img: any, index: number) => ({
        id: img.id,
        filename: img.filename || `${index + 1}.png`,
        section: 'main',
        position: { x: 400 + (index % 2) * 300, y: 100 + Math.floor(index / 2) * 200 },
        dimensions: { width: 200, height: 150 },
        objectFit: 'cover' as const,
        borderRadius: 8,
        loading: 'lazy' as const,
        priority: 'normal' as const,
        alt: img.desc || '이미지',
        zIndex: 10
      })) || [],
      interactions: [{
        id: 'hover_effect',
        target: '.interactive',
        trigger: 'hover',
        effect: 'scale',
        duration: '200ms',
        delay: '0ms',
        easing: 'ease-in-out'
      }],
      educationalFeatures: [{
        id: 'scroll_reveal',
        type: 'scrollIndicator',
        position: 'bottom',
        dimensions: { width: 100, height: 4 },
        styling: {
          primaryColor: '#3B82F6',
          secondaryColor: '#E5E7EB',
          backgroundColor: 'transparent',
          opacity: 0.8
        },
        behavior: {
          autoUpdate: true,
          userControl: false,
          persistence: false
        }
      }],
      isGenerating: false,
      isComplete: true,
      animationDescription: parsedData.animationDescription || '기본 애니메이션: 요소들이 부드럽게 나타납니다.',
      interactionDescription: parsedData.interactionDescription || '기본 인터랙션: 호버 시 요소들이 반응합니다.',
      generatedAt: new Date()
    };
  }

  private generateGlobalFeatures(layoutMode: 'fixed' | 'scrollable'): any[] {
    return [
      {
        type: 'accessibility',
        specifications: {
          focusVisible: true,
          keyboardNav: false
        },
        enabled: true
      },
      {
        type: 'performance',
        specifications: {
          animationOptimization: true
        },
        enabled: layoutMode === 'scrollable'
      }
    ];
  }

  private createEmptyPageResult(step3PageData: any): Step4PageResult {
    return {
      pageId: step3PageData.pageId,
      pageTitle: step3PageData.pageTitle,
      pageNumber: step3PageData.pageNumber,
      layout: {
        pageWidth: 1600,
        pageHeight: 'auto',
        sections: [],
        backgroundColor: '#FFFFFF',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 }
      },
      componentStyles: [],
      imagePlacements: [],
      interactions: [],
      educationalFeatures: [],
      isGenerating: false,
      isComplete: false,
      error: 'Step3에서 아직 완료되지 않음',
      animationDescription: '',
      interactionDescription: '',
      generatedAt: new Date()
    };
  }

  private createErrorPageResult(step3PageData: any, errorMessage: string): Step4PageResult {
    return {
      pageId: step3PageData.pageId,
      pageTitle: step3PageData.pageTitle,
      pageNumber: step3PageData.pageNumber,
      layout: {
        pageWidth: 1600,
        pageHeight: 'auto',
        sections: [],
        backgroundColor: '#FFFFFF',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 }
      },
      componentStyles: [],
      imagePlacements: [],
      interactions: [],
      educationalFeatures: [],
      isGenerating: false,
      isComplete: false,
      error: errorMessage,
      animationDescription: '',
      interactionDescription: '',
      generatedAt: new Date()
    };
  }

  // 텍스트 기반 JSON 응답 파싱
}