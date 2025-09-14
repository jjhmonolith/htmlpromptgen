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
  Step4ValidationError,
  ValidationResult
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
  private styleEngine: StyleSpecificationEngine;
  private validationEngine: ValidationEngine;
  private interactionEngine: InteractionDesignEngine;
  private educationalEngine: EducationalFeatureEngine;

  constructor(private openAIService: OpenAIService) {
    this.promptEngine = new PromptEngine();
    this.parsingEngine = new ParsingEngine();
    this.layoutEngine = new LayoutRefinementEngine();
    this.styleEngine = new StyleSpecificationEngine();
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
      // AI 프롬프트 생성
      const prompt = this.buildPrompt(step3PageData, projectData, visualIdentity);

      // AI 호출 (Step2/Step3 방식 참고)
      const response = await this.openAIService.createCompletion({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Step4는 정확성이 중요하므로 낮은 temperature
        top_p: 1,
        max_tokens: 2000, // 정밀한 명세를 위해 더 많은 토큰
        stop: [] // stop 파라미터는 필수이므로 빈 배열로 설정
      });

      // 응답 검증
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error(`페이지 ${step3PageData.pageNumber}: AI 응답이 비어있습니다`);
      }

      const rawContent = response.choices[0].message.content;
      console.log(`🔄 Step4 Page${step3PageData.pageNumber} 원시 응답:`, rawContent.substring(0, 200) + '...');

      // 응답 파싱
      const parsed = this.parseResponse(rawContent, projectData.layoutMode);

      // Phase 3: 상호작용 및 교육적 기능 강화
      const enhancedInteractions = this.enhanceInteractions(
        parsed.interactions,
        parsed.componentStyles,
        projectData.layoutMode,
        step3PageData.pageNumber,
        projectData.pages.length
      );

      const enhancedEducationalFeatures = this.enhanceEducationalFeatures(
        parsed.educationalFeatures,
        parsed.componentStyles,
        projectData.layoutMode,
        step3PageData.pageNumber,
        projectData.pages.length
      );

      // 검증 (ValidationEngine 사용)
      const tempPageResult: Step4PageResult = {
        pageId: step3PageData.pageId,
        pageTitle: step3PageData.pageTitle,
        pageNumber: step3PageData.pageNumber,
        layout: parsed.layout,
        componentStyles: parsed.componentStyles,
        imagePlacements: parsed.imagePlacements,
        interactions: enhancedInteractions,
        educationalFeatures: enhancedEducationalFeatures,
        isGenerating: false,
        isComplete: true,
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
        generatedAt: new Date()
      } : undefined;

      return {
        pageId: step3PageData.pageId,
        pageTitle: step3PageData.pageTitle,
        pageNumber: step3PageData.pageNumber,
        layout: parsed.layout,
        componentStyles: parsed.componentStyles,
        imagePlacements: parsed.imagePlacements,
        interactions: enhancedInteractions,
        educationalFeatures: enhancedEducationalFeatures,
        isGenerating: false,
        isComplete: true,
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
   * AI 프롬프트 생성
   */
  private buildPrompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): string {
    return this.promptEngine.generatePagePrompt(step3PageData, projectData, visualIdentity);
  }

  /**
   * AI 응답 파싱
   */
  private parseResponse(content: string, layoutMode: 'fixed' | 'scrollable'): any {
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
      generatedAt: new Date()
    };
  }
}