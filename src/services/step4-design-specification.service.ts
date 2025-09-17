import { OpenAIService } from './openai.service';
import {
  ProjectData,
  VisualIdentity,
  Step3IntegratedResult
} from '../types/workflow.types';
import {
  Step4DesignResult,
  Step4PageResult,
  Step4GenerationError,
  Step4ValidationError
} from '../types/step4.types';
import { PromptEngine } from './engines/PromptEngine';
import { ParsingEngine } from './engines/ParsingEngine';
import { LayoutRefinementEngine } from './engines/LayoutRefinementEngine';
import { StyleSpecificationEngine } from './engines/StyleSpecificationEngine';
import { ValidationEngine } from './engines/ValidationEngine';
import { InteractionDesignEngine } from './engines/InteractionDesignEngine';
import { EducationalFeatureEngine } from './engines/EducationalFeatureEngine';

/**
 * Step4 디자인 명세 생성 서비스
 *
 * Step3의 컴포넌트/이미지 계획을 실제 구현 가능한 구체적 디자인 명세로 변환합니다.
 * 교육용 HTML 교안의 최종 구체화 단계를 담당합니다.
 */
export class Step4DesignSpecificationService {
  private promptEngine: PromptEngine;
  private parsingEngine: ParsingEngine;
  private layoutEngine: LayoutRefinementEngine;
  private _styleEngine: StyleSpecificationEngine; // AI 대신 사용하므로 private으로 변경
  private validationEngine: ValidationEngine;
  private interactionEngine: InteractionDesignEngine;
  private educationalEngine: EducationalFeatureEngine;

  constructor(private openAIService: OpenAIService) {
    this.promptEngine = new PromptEngine();
    this.parsingEngine = new ParsingEngine();
    this.layoutEngine = new LayoutRefinementEngine();
    this._styleEngine = new StyleSpecificationEngine();
    this.validationEngine = new ValidationEngine();
    this.interactionEngine = new InteractionDesignEngine();
    this.educationalEngine = new EducationalFeatureEngine();
  }

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
    try {
      console.log('🎯 Step4: 디자인 명세 생성 시작');
      console.log('📊 입력 데이터:', {
        layoutMode: projectData.layoutMode,
        pagesCount: step3Result.pages.length,
        completedPages: step3Result.pages.filter(p => p.phase2Complete).length
      });

      // 입력 검증
      this.validateInputs(projectData, visualIdentity, step3Result);

      // 페이지별 순차 처리 (정밀도 우선)
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
      console.log('📈 결과 요약:', {
        totalPages: result.pages.length,
        successPages: result.pages.filter(p => p.isComplete).length,
        globalFeatures: result.globalFeatures.length
      });

      return result;

    } catch (error) {
      console.error('❌ Step4 생성 실패:', error);
      throw new Step4GenerationError(
        '디자인 명세 생성 실패',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 개별 페이지 재생성
   * @param result Step4 결과 객체
   * @param pageIndex 재생성할 페이지 인덱스
   * @param projectData 프로젝트 데이터
   * @param visualIdentity 비주얼 아이덴티티
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
    if (!projectData?.pages?.length) {
      throw new Step4ValidationError('프로젝트 페이지 데이터가 없습니다', 'projectData.pages', projectData.pages);
    }

    if (!visualIdentity?.colorPalette) {
      throw new Step4ValidationError('비주얼 아이덴티티가 없습니다', 'visualIdentity', visualIdentity);
    }

    if (!step3Result?.pages?.length) {
      throw new Step4ValidationError('Step3 결과 데이터가 없습니다', 'step3Result.pages', step3Result.pages);
    }

    const completedPages = step3Result.pages.filter(p => p.phase2Complete);
    if (completedPages.length === 0) {
      throw new Step4ValidationError('완료된 Step3 페이지가 없습니다', 'step3Result.pages', completedPages.length);
    }

    console.log('✅ Step4: 입력 데이터 검증 완료');
  }

  /**
   * 모든 페이지 병렬 처리 (Step3 방식 참고)
   */
  private async processAllPages(
    step3Pages: any[],
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<Step4PageResult[]> {
    console.log(`⚡ Step4: ${step3Pages.length}개 페이지 병렬 처리 시작`);

    // 빈 결과 배열 초기화
    const results: Step4PageResult[] = step3Pages.map(page => this.createEmptyPageResult(page));

    // Phase2가 완료된 페이지들만 병렬 처리
    const pagePromises = step3Pages.map(async (page, index) => {
      try {
        // Phase2가 완료된 페이지만 처리
        if (!page.phase2Complete) {
          console.log(`⏭️ 페이지 ${page.pageNumber}: Step3 Phase2 미완료로 건너뜀`);
          return {
            pageIndex: index,
            success: false,
            error: 'Step3에서 아직 완료되지 않음'
          };
        }

        console.log(`🔄 페이지 ${page.pageNumber} 병렬 처리 시작`);
        const result = await this.processPage(page, projectData, visualIdentity);

        return {
          pageIndex: index,
          success: true,
          result
        };

      } catch (error) {
        console.error(`❌ 페이지 ${page.pageNumber} 처리 실패:`, error);
        return {
          pageIndex: index,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    console.log(`⏰ Step4: ${pagePromises.length}개 페이지 병렬 처리 대기 중...`);
    const pageResults = await Promise.all(pagePromises);

    // 결과를 results 배열에 반영
    pageResults.forEach((pageResult) => {
      if (pageResult.success && pageResult.result) {
        results[pageResult.pageIndex] = pageResult.result;
      } else {
        // 에러 페이지 결과 생성
        const step3Page = step3Pages[pageResult.pageIndex];
        results[pageResult.pageIndex] = this.createErrorPageResult(step3Page, pageResult.error || '알 수 없는 오류');
      }
    });

    console.log(`✅ Step4: ${step3Pages.length}개 페이지 병렬 처리 완료`);
    return results;
  }

  /**
   * 개별 페이지 처리 (실제 AI 호출 및 파싱)
   */
  private async processPage(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<Step4PageResult> {
    const startTime = Date.now();

    try {
      // AI 프롬프트 생성 (contentMode 추가)
      const contentMode: 'restricted' | 'enhanced' = 'enhanced'; // 기본값 - 추후 UI에서 설정 가능
      const prompt = this.buildPrompt(step3PageData, projectData, visualIdentity, contentMode);

      // AI 호출 (Step2/Step3 방식 참고)
      const response = await this.openAIService.createCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '상세한 애니메이션과 상호작용 설계를 요청받은 대로 정확히 작성해주세요. 요청된 구조와 형식을 정확히 따라 상세한 텍스트로 응답하세요.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4, // 창의적 애니메이션 설계를 위해 약간 높임
        top_p: 1,
        max_tokens: 3000, // 상세한 텍스트 응답을 위해 토큰 수 증가
        stop: [] // stop 파라미터는 필수이므로 빈 배열로 설정
      });

      // 응답 검증
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error(`페이지 ${step3PageData.pageNumber}: AI 응답이 비어있습니다`);
      }

      const rawContent = response.choices[0].message.content;
      console.log(`🔄 Step4 Page${step3PageData.pageNumber} 원시 응답:`, rawContent.substring(0, 200) + '...');

      // 응답 파싱 (새로운 JSON 형식)
      const parsed = this.parseResponse(rawContent);

      // Phase 2: 기본 레이아웃 구성 (Step3 데이터 기반)
      const refinedLayout = this.layoutEngine.refineLayout(
        step3PageData.structure?.sections || [],
        projectData.layoutMode
      );

      // 기본 컴포넌트 스타일 생성 (Step3 데이터와 비주얼 아이덴티티 기반)
      const baseComponentStyles = this.generateBaseComponentStyles(step3PageData, visualIdentity);

      console.log('🎯 새로운 JSON 응답 처리:', {
        animationDescription: parsed.animationDescription.substring(0, 100) + '...',
        interactionDescription: parsed.interactionDescription.substring(0, 100) + '...'
      });

      console.log('🔍 생성된 컴포넌트 스타일 검증:', {
        componentCount: baseComponentStyles.length,
        firstComponent: baseComponentStyles[0],
        hasPositionX: baseComponentStyles.every(comp => comp.position && typeof comp.position.x === 'number')
      });

      // Phase 3: 애니메이션 및 상호작용 생성 (AI 응답 기반)
      const enhancedInteractions = this.createInteractionsFromDescription(
        parsed.interactionDescription,
        baseComponentStyles,
        projectData.layoutMode
      );

      const enhancedEducationalFeatures = this.createAnimationsFromDescription(
        parsed.animationDescription,
        baseComponentStyles,
        projectData.layoutMode
      );

      // 기본 이미지 배치 생성 (Step3 데이터 기반)
      const imagePlacements = this.generateImagePlacements(step3PageData);

      // 검증 (ValidationEngine 사용)
      const tempPageResult: Step4PageResult = {
        pageId: step3PageData.pageId,
        pageTitle: step3PageData.pageTitle,
        pageNumber: step3PageData.pageNumber,
        layout: refinedLayout,
        componentStyles: baseComponentStyles,
        imagePlacements: imagePlacements,
        interactions: enhancedInteractions,
        educationalFeatures: enhancedEducationalFeatures,
        isGenerating: false,
        isComplete: true,
        animationDescription: parsed.animationDescription, // 새로운 필드 추가
        interactionDescription: parsed.interactionDescription, // 새로운 필드 추가
        generatedAt: new Date()
      };
      const validationResult = this.validationEngine.validatePage(tempPageResult, projectData.layoutMode);

      // 디버그 정보 수집
      const processingTime = Date.now() - startTime;
      const debugInfo = process.env.NODE_ENV === 'development' ? {
        prompt,
        response: rawContent,
        processingTime,
        validationResults: validationResult,
        animationDescription: parsed.animationDescription,
        interactionDescription: parsed.interactionDescription,
        generatedAt: new Date()
      } : undefined;

      return {
        pageId: step3PageData.pageId,
        pageTitle: step3PageData.pageTitle,
        pageNumber: step3PageData.pageNumber,
        layout: refinedLayout,
        componentStyles: baseComponentStyles,
        imagePlacements: imagePlacements,
        interactions: enhancedInteractions,
        educationalFeatures: enhancedEducationalFeatures,
        isGenerating: false,
        isComplete: true,
        animationDescription: parsed.animationDescription, // 새로운 필드 추가
        interactionDescription: parsed.interactionDescription, // 새로운 필드 추가
        debugInfo,
        generatedAt: new Date()
      };

    } catch (error) {
      throw new Step4GenerationError(
        `페이지 ${step3PageData.pageNumber} 처리 실패`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * AI 프롬프트 생성 (새로운 4-조합 시스템)
   */
  private buildPrompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    contentMode: 'restricted' | 'enhanced' = 'enhanced'
  ): string {
    return this.promptEngine.generatePagePrompt(
      step3PageData,
      projectData,
      visualIdentity,
      contentMode
    );
  }

  /**
   * AI 응답 파싱 (새로운 JSON 형식)
   */
  private parseResponse(content: string): {
    animationDescription: string;
    interactionDescription: string;
  } {
    return this.parsingEngine.parseStep4Response(content);
  }


  /**
   * Phase 3: 상호작용 강화
   */
  private enhanceInteractions(
    baseInteractions: any[],
    components: any[],
    layoutMode: 'fixed' | 'scrollable',
    pageNumber: number,
    totalPages: number
  ): any[] {
    // 기본 AI 생성 인터랙션에 Phase 3 엔진으로 강화
    const generatedInteractions = this.interactionEngine.generateInteractions(components, layoutMode);

    // 진행 상태 인터랙션 추가
    const progressInteractions = this.interactionEngine.generateProgressInteractions(totalPages, pageNumber);

    // 접근성 인터랙션 추가
    const a11yInteractions = this.interactionEngine.generateA11yInteractions();

    // 모든 인터랙션 결합 및 최적화
    const allInteractions = [
      ...baseInteractions,
      ...generatedInteractions,
      ...progressInteractions,
      ...a11yInteractions
    ];

    return this.interactionEngine.optimizeForLayoutMode(allInteractions, layoutMode);
  }

  /**
   * Phase 3: 교육적 기능 강화
   */
  private enhanceEducationalFeatures(
    baseFeatures: any[],
    components: any[],
    layoutMode: 'fixed' | 'scrollable',
    pageNumber: number,
    totalPages: number
  ): any[] {
    // 기본 AI 생성 교육 기능에 Phase 3 엔진으로 강화
    const generatedFeatures = this.educationalEngine.generateEducationalFeatures(
      pageNumber,
      totalPages,
      layoutMode,
      components
    );

    // 접근성 기능 추가
    const a11yFeatures = this.educationalEngine.generateAccessibilityFeatures(components, layoutMode);

    // 학습 분석 기능 추가
    const analyticsFeatures = this.educationalEngine.generateAnalyticsFeatures();

    // 모든 교육 기능 결합 및 최적화
    const allFeatures = [
      ...baseFeatures,
      ...generatedFeatures,
      ...a11yFeatures,
      ...analyticsFeatures
    ];

    return this.educationalEngine.optimizeForLayoutMode(allFeatures, layoutMode);
  }

  /**
   * 간소화된 글로벌 기능 생성
   */
  private generateGlobalFeatures(layoutMode: 'fixed' | 'scrollable'): any[] {
    // 복잡성을 줄이고 기본 기능만 제공
    return [
      {
        type: 'accessibility',
        specifications: {
          focusVisible: true,
          keyboardNav: false // 복잡성 제거
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

  /**
   * 빈 페이지 결과 생성 (미완료 페이지용)
   */
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

  /**
   * 에러 페이지 결과 생성
   */
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

  /**
   * 기본 컴포넌트 스타일 생성 (Step3 데이터와 비주얼 아이덴티티 기반)
   */
  private generateBaseComponentStyles(step3PageData: any, visualIdentity: VisualIdentity): any[] {
    const sections = step3PageData.structure?.sections || [];

    console.log('🔧 generateBaseComponentStyles 입력 데이터:', {
      step3PageData: JSON.stringify(step3PageData, null, 2),
      sectionsLength: sections.length,
      sections: sections
    });

    return sections.map((section: any, index: number) => ({
      id: `section-${index}`,
      type: section.type || 'content',
      section: `section-${index}`,
      position: {
        x: 100,
        y: 100 + (index * 250)
      },
      dimensions: {
        width: 1400,
        height: 200
      },
      colors: {
        text: '#1a1a1a',
        background: '#ffffff',
        border: visualIdentity.colorPalette.primary || '#2563eb'
      },
      font: {
        family: 'SF Pro Display, system-ui, sans-serif',
        weight: 400,
        size: '18px',
        lineHeight: 1.5
      },
      visual: {
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        opacity: 1
      },
      zIndex: 10,
      display: 'block'
    }));
  }

  /**
   * AI 상호작용 설명을 기반으로 상호작용 객체 생성
   */
  private createInteractionsFromDescription(
    interactionDescription: string,
    components: any[],
    layoutMode: 'fixed' | 'scrollable'
  ): any[] {
    return [{
      type: 'hover',
      description: interactionDescription,
      targets: components.map(c => c.id),
      properties: {
        scale: layoutMode === 'fixed' ? 1.02 : 1.01,
        shadow: 'elevated',
        duration: 200
      },
      accessibility: {
        focusVisible: true,
        keyboardNavigation: false
      }
    }];
  }

  /**
   * AI 애니메이션 설명을 기반으로 교육적 기능 객체 생성
   */
  private createAnimationsFromDescription(
    animationDescription: string,
    components: any[],
    layoutMode: 'fixed' | 'scrollable'
  ): any[] {
    return [{
      id: 'animation-entrance',
      type: 'readingProgress',
      position: 'top',
      dimensions: {
        width: 100,
        height: 4
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        backgroundColor: '#f1f5f9',
        opacity: 0.9
      },
      behavior: {
        autoUpdate: true,
        userControl: false,
        persistence: false
      },
      description: animationDescription,
      properties: {
        trigger: layoutMode === 'scrollable' ? 'inView' : 'pageLoad',
        animation: 'fadeUp',
        duration: layoutMode === 'fixed' ? 300 : 400,
        stagger: layoutMode === 'scrollable' ? 60 : 40
      }
    }];
  }

  /**
   * Step3 데이터를 기반으로 기본 이미지 배치 생성
   */
  private generateImagePlacements(step3PageData: any): any[] {
    const images = step3PageData.images || [];

    return images.map((image: any, index: number) => ({
      id: `image-${index}`,
      filename: image.filename || `placeholder-${index}.jpg`,
      section: `section-0`,
      position: {
        x: 100,
        y: 200 + (index * 250)
      },
      dimensions: {
        width: 400,
        height: 200
      },
      objectFit: 'cover',
      borderRadius: 8,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      loading: 'lazy',
      priority: 'normal',
      alt: image.prompt || `이미지 ${index + 1}`,
      zIndex: 15
    }));
  }
}