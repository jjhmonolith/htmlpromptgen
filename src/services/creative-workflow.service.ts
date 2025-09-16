import { OpenAIService } from './openai.service';
import { Step2VisualIdentityService } from './step2-visual-identity.service';
import { CreativeContentStorytellerService } from './creative-content-storyteller.service';
import { CreativeBriefGeneratorService } from './creative-brief-generator.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';
import { CreativeBrief } from './creative-brief-generator.service';

export interface CreativeWorkflowResult {
  // Step 1: 프로젝트 데이터 (기존 그대로)
  projectData: ProjectData;

  // Step 2: 감성 무드 (간소화됨)
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;

  // Step 3-4 통합: 창의적 콘텐츠 (새로운 접근)
  // 기존의 복잡한 구조화 데이터 대신 창의적 스토리

  // Step 5: 최종 창작 브리프 (혁신적 변화)
  creativeBrief: CreativeBrief;

  // 메타데이터
  generatedAt: Date;
  processingTime: number;
}

/**
 * 🎨 Creative Workflow Service
 *
 * 기존의 복잡한 5단계 기술 명세 생성을
 * 3단계 창작 브리프 생성으로 완전히 전환
 *
 * 철학: "파싱보다는 영감을, 명세보다는 창작을"
 */
export class CreativeWorkflowService {
  private step2Service: Step2VisualIdentityService;
  private storytellerService: CreativeContentStorytellerService;
  private briefGeneratorService: CreativeBriefGeneratorService;

  constructor(private openAIService: OpenAIService) {
    this.step2Service = new Step2VisualIdentityService(openAIService);
    this.storytellerService = new CreativeContentStorytellerService(openAIService);
    this.briefGeneratorService = new CreativeBriefGeneratorService();
  }

  async generateCreativeWorkflow(projectData: ProjectData): Promise<CreativeWorkflowResult> {
    const startTime = Date.now();
    console.log('🎪 Creative Workflow: 창작 워크플로우 시작');
    console.log(`📋 프로젝트: ${projectData.projectTitle} (${projectData.layoutMode} 모드)`);

    try {
      // Step 2: 감성 무드 생성 (기존 구조 유지하되 창의적 프롬프트로 변경)
      console.log('🎨 Step 2: 감성 무드 오케스트레이터 실행...');
      const { visualIdentity, designTokens } = await this.step2Service.generateVisualIdentity(projectData);
      console.log('✅ Step 2 완료: 감성적 무드 가이드 생성됨');

      // Step 3: 창의적 콘텐츠 스토리텔러 (기존 Step3+4 통합)
      console.log('🎭 Step 3: 창의적 콘텐츠 스토리텔러 실행...');
      const creativeContent = await this.storytellerService.generateCreativeContent(
        projectData,
        visualIdentity
      );
      console.log('✅ Step 3 완료: 창의적 페이지 스토리 생성됨');

      // Step 5: 최종 창작 브리프 생성
      console.log('📋 Step 5: 창작 브리프 제너레이터 실행...');
      const creativeBrief = this.briefGeneratorService.generateFinalCreativeBrief(
        projectData,
        visualIdentity,
        creativeContent
      );
      console.log('✅ Step 5 완료: 최종 창작 브리프 생성됨');

      const processingTime = Date.now() - startTime;

      const result: CreativeWorkflowResult = {
        projectData,
        visualIdentity,
        designTokens,
        creativeBrief,
        generatedAt: new Date(),
        processingTime
      };

      console.log(`🎉 Creative Workflow 완료! (${processingTime}ms)`);
      console.log(`📊 결과물: ${creativeBrief.briefLength}자 브리프, 예상 토큰 ${creativeBrief.estimatedTokens}`);

      return result;

    } catch (error) {
      console.error('❌ Creative Workflow 실패:', error);
      throw new Error(`창작 워크플로우 실행 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 개발자에게 제공할 최종 마크다운 브리프 생성
   */
  getMarkdownBrief(result: CreativeWorkflowResult): string {
    return this.briefGeneratorService.generateMarkdownBrief(result.creativeBrief);
  }

  /**
   * 브리프 품질 평가
   */
  evaluateBriefQuality(result: CreativeWorkflowResult): {
    creativityScore: number;    // 창의성 점수 (0-100)
    clarityScore: number;       // 명확성 점수 (0-100)
    feasibilityScore: number;   // 구현 가능성 점수 (0-100)
    inspirationLevel: number;   // 영감 수준 (0-100)
    overallScore: number;       // 종합 점수
    feedback: string[];         // 개선 피드백
  } {
    const brief = result.creativeBrief;

    // 간단한 품질 평가 알고리즘
    const creativityScore = this.evaluateCreativity(brief);
    const clarityScore = this.evaluateClarity(brief);
    const feasibilityScore = this.evaluateFeasibility(result);
    const inspirationLevel = this.evaluateInspiration(brief);

    const overallScore = Math.round(
      (creativityScore * 0.3) +
      (clarityScore * 0.25) +
      (feasibilityScore * 0.25) +
      (inspirationLevel * 0.2)
    );

    const feedback = this.generateQualityFeedback({
      creativityScore,
      clarityScore,
      feasibilityScore,
      inspirationLevel,
      overallScore
    });

    return {
      creativityScore,
      clarityScore,
      feasibilityScore,
      inspirationLevel,
      overallScore,
      feedback
    };
  }

  private evaluateCreativity(brief: CreativeBrief): number {
    let score = 60; // 기본 점수

    // 창의적 키워드 사용 정도
    const creativeKeywords = ['창의적', '독창적', '마법', '스토리', '감동', '영감', '아름다운'];
    const keywordCount = creativeKeywords.filter(keyword =>
      brief.projectVision.includes(keyword) ||
      brief.emotionalTone.includes(keyword)
    ).length;

    score += Math.min(keywordCount * 5, 25);

    // 페이지별 다양성
    const uniqueIdeas = new Set(brief.pageStories.map(page => page.fullCreativeBrief.substring(0, 100)));
    if (uniqueIdeas.size === brief.pageStories.length) {
      score += 15; // 모든 페이지가 고유한 아이디어
    }

    return Math.min(score, 100);
  }

  private evaluateClarity(brief: CreativeBrief): number {
    let score = 70; // 기본 점수

    // 브리프 길이 적정성
    if (brief.briefLength >= 1000 && brief.briefLength <= 3000) {
      score += 20;
    } else if (brief.briefLength < 500) {
      score -= 30; // 너무 짧음
    } else if (brief.briefLength > 5000) {
      score -= 20; // 너무 김
    }

    // 구조화 정도
    if (brief.pageStories.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private evaluateFeasibility(result: CreativeWorkflowResult): number {
    let score = 80; // 기본적으로 구현 가능

    // 공간 제약 인식도
    if (result.creativeBrief.spaceConstraintReminder.includes('1600') &&
        result.creativeBrief.spaceConstraintReminder.includes('1000')) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private evaluateInspiration(brief: CreativeBrief): number {
    let score = 60; // 기본 점수

    // 감정적 표현 정도
    const emotionalWords = ['느낄', '경험', '감동', '즐거움', '놀라움', '성취감', '호기심'];
    const emotionalCount = emotionalWords.filter(word =>
      brief.projectVision.includes(word) || brief.emotionalTone.includes(word)
    ).length;

    score += Math.min(emotionalCount * 6, 30);

    // 개발자 격려 표현
    if (brief.developerGuidance.includes('창의') || brief.developerGuidance.includes('자유')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private generateQualityFeedback(scores: {
    creativityScore: number;
    clarityScore: number;
    feasibilityScore: number;
    inspirationLevel: number;
    overallScore: number;
  }): string[] {
    const feedback: string[] = [];

    if (scores.overallScore >= 90) {
      feedback.push('🎉 탁월한 창작 브리프! 개발자가 정말 만들고 싶어할 것 같습니다.');
    } else if (scores.overallScore >= 80) {
      feedback.push('👍 좋은 품질의 브리프입니다. 몇 가지만 보완하면 완벽할 것 같아요.');
    } else if (scores.overallScore >= 70) {
      feedback.push('✅ 기본적인 요구사항은 만족하지만, 더 창의적인 요소가 필요할 수 있습니다.');
    } else {
      feedback.push('🔧 브리프 품질 개선이 필요합니다. 더 구체적이고 영감을 주는 내용을 추가해보세요.');
    }

    if (scores.creativityScore < 70) {
      feedback.push('💡 창의성 부족: 더 독창적이고 혁신적인 아이디어를 포함해보세요.');
    }

    if (scores.clarityScore < 70) {
      feedback.push('📝 명확성 부족: 브리프를 더 구체적이고 이해하기 쉽게 작성해보세요.');
    }

    if (scores.inspirationLevel < 70) {
      feedback.push('🌟 영감 부족: 개발자의 창작 욕구를 더 자극할 수 있는 표현을 사용해보세요.');
    }

    return feedback;
  }
}