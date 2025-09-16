import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity } from '../types/workflow.types';
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

    const startTime = Date.now();

    // 감성 컨텍스트 준비
    const emotionalContext = this.createEmotionalContext(visualIdentity);

    // 전체 프로젝트 개요 생성
    const projectOverview = {
      title: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      layoutMode: projectData.layoutMode,
      overallLearningGoals: this.inferLearningGoals(projectData),
      educationalApproach: this.determineEducationalApproach(projectData, emotionalContext)
    };

    // 공간 제약 정보
    const spaceConstraints = {
      mode: projectData.layoutMode,
      dimensions: projectData.layoutMode === 'fixed' ? '1600×1000px' : '1600×∞px',
      criticalReminders: this.getSpaceConstraintReminders(projectData.layoutMode)
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

    // 레이아웃 제약 검증 수행
    const layoutValidation = this.validateLayoutConstraints(response.content, projectData.layoutMode);

    if (!layoutValidation.isValid) {
      console.warn(`⚠️ 페이지 ${page.pageNumber} 레이아웃 제약 위반:`, layoutValidation.errorType);
      console.warn('제안 사항:', layoutValidation.suggestions);
    }

    return this.parseEducationalDesign(response.content, page, projectData, emotionalContext, prompt, response.content, layoutValidation);
  }

  private createEducationalDesignPrompt(
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    pageIndex: number,
    totalPages: number
  ): string {
    const constraintInfo = this.getDetailedConstraints(projectData.layoutMode);
    const audienceInfo = this.getAudienceCharacteristics(projectData.targetAudience);
    const pageContext = this.getPageContext(pageIndex, totalPages);
    const layoutConstraints = this.getLayoutConstraints(projectData.layoutMode);

    return `🎓 교육 콘텐츠 UI/UX 설계 전문가

당신은 개발자가 바로 구현할 수 있는 수준의 정밀하고 구체적인 교육 콘텐츠 UI를 설계하는 전문가입니다. 픽셀 단위의 정확한 레이아웃과 완전한 디자인 시스템을 제공해야 합니다.

## 📋 프로젝트 정보
**주제**: ${projectData.projectTitle}
**학습자**: ${projectData.targetAudience}
${audienceInfo}
**이 페이지**: ${page.topic}
**설명**: ${page.description}
${pageContext}

## 🎨 디자인 맥락
**전체 분위기**: ${emotionalContext.overallTone}
**컬러 팔레트**: ${emotionalContext.colorEmotions.primary}, ${emotionalContext.colorEmotions.secondary}, ${emotionalContext.colorEmotions.accent}

## 📐 캔버스 제약
${constraintInfo}

${layoutConstraints}

---

# 🎯 완전한 교육 페이지 설계서

다음 형식으로 개발자가 바로 구현할 수 있는 수준의 상세한 설계를 제공해주세요:

## 페이지 ${page.pageNumber}: [창의적이고 구체적인 페이지 제목]

[페이지 주제에 대한 2-3줄 교육적 설명]

### 1. 페이지 구성 및 내용

다음은 ${projectData.layoutMode === 'fixed' ? '1600x1000px 고정 화면(스크롤 없음)' : '1600px 너비, 세로 스크롤'} 기준, '${page.topic}' 페이지의 교육 콘텐츠 레이아웃 설계안입니다. ${emotionalContext.overallTone} 분위기를 살리면서, 콘텐츠의 중요도에 따른 시각적 계층을 분명히 합니다. ${projectData.targetAudience} 대상이므로 정보량은 부담 없이 핵심이 한눈에 들어오도록 구성합니다.

**1) 캔버스, 그리드, 여백**
- 캔버스: ${projectData.layoutMode === 'fixed' ? '1600x1000px' : '1600x∞px (세로 스크롤)'}
- 안전 여백: 사방 64px
- 그리드: 12컬럼, 컬럼 폭 108px, 거터 24px (콘텐츠 폭 1472px)
- 시선 흐름: [좌상단에서 시작하여 교육적 논리 순서에 따른 시선 흐름 설계]

**2) 타이포그래피 (최소 18pt 필수!)**
- 제목(H1): 28-36pt, SemiBold, 행간 120%, 글자간 -1%
- 부제/리드(H2): 22-24pt, Medium, 행간 140%
- 본문: 18-20pt, Regular, 행간 150%
- 캡션/라벨: 18pt (최소값), Medium, 행간 140%
- **⚠️ 모든 텍스트는 18pt 미만 절대 금지**

**3) 컬러 & 분위기**
- 배경: [교육 주제에 맞는 배경색]
- 주요 포인트: [3-4개 색상 이름으로 표현]
- 구분선/연결선: [색상과 스타일]
- 접근성: 텍스트 대비율 4.5:1 이상 유지

**4) 레이아웃 구조**

🚨 **필수 제약사항**:
- **${projectData.layoutMode === 'scrollable' ? 'Scrollable' : 'Fixed'} 모드**: 제목 포함 최대 ${projectData.layoutMode === 'scrollable' ? '5' : '3'}개 영역 (초과 절대 금지)
- **인터랙션 요소 금지**: 퀴즈, 실습, 아코디언, 카드 뒤집기 등 Step4에서 처리
- **반응형 고려 불필요**: 고정 크기 기준 설계
${projectData.layoutMode === 'fixed' ? '- **총 높이 1000px 절대 초과 금지**' : ''}

📐 **그리드 시스템**:

**${projectData.layoutMode === 'scrollable' ? 'Scrollable' : 'Fixed'} 모드 (1600×${projectData.layoutMode === 'fixed' ? '1000' : '∞'}px)**:
- 가로 12그리드: 컴럼 폭 108px, 거터 24px
- 세로 ${projectData.layoutMode === 'fixed' ? '6그리드: 행 높이 140px, 거터 20px (안전여백 고려)' : '자유: 각 영역별 적절한 높이 설정'}
- 영역 예시: A(풀와이드) → B(8/12+4/12) → C(6/12+6/12)${projectData.layoutMode === 'fixed' ? ' → D(4/12+4/12+4/12)' : ''}
${projectData.layoutMode === 'fixed' ? '- 2D 그리드 활용: 예) A영역(12×2), B영역(8×3), C영역(4×3)' : ''}

⚠️ **창의성 요구사항**:
- 모든 영역이 풀와이드인 단조로운 구성 금지
- 최소 2가지 이상의 그리드 조합 사용
- 교육적 우선순위에 따른 시각적 위계 차등화

[최소 4-6개 영역을 픽셀 단위로 정확히 설계]

A. [영역명] (예: 상단 타이틀 영역)
- 위치/크기: x=64, y=64, 폭=약 XXXpx(컬럼 X–X), 높이=XXXpx
- 구성: [구체적인 UI 요소와 텍스트 내용]
- 시각 강조: [배경, 언더라인, 그라데이션 등 구체적 스타일]

B. [영역명] (예: 메인 비주얼 영역)
- 위치/크기: x=XXX, y=XXX, 폭=XXXpx, 높이=XXXpx
- 콘텐츠 의도: [교육적 목적과 시각적 효과]
- 연결 요소: [다른 영역과의 시각적 연결]

[C, D, E, F... 영역들 계속]

**5) 교육 콘텐츠(문구) 상세**
- 제목: "[실제 사용할 구체적이고 매력적인 제목]"
- 리드 문장: "[2-3줄의 핵심 설명]"
- 학습 목표 (3-4개): "[체크 가능한 구체적 목표들]"
- 핵심 내용: [실제 교육 내용을 구체적으로]

**6) 맞춤형 시각 요소**
- 연결선/화살표: [교육 흐름을 보여주는 시각 요소]
- 강조 카드: [중요 정보의 카드 디자인]
- 인터랙션 힌트: [클릭, 호버 등 상호작용 가이드]

**7) 접근성/가독성 (필수 준수사항)**
- 🔴 **텍스트 최소 18pt 절대 준수** (18pt 미만 절대 금지)
- 색상 대비율 4.5:1 이상 필수
- 스크린리더 대응 및 alt 속성 필수
- 키보드 네비게이션 지원
- **페이지 독립성**: 다른 페이지로의 링크나 네비게이션 요소 절대 금지

**8) 개발 구현 요약(픽셀 가이드)**
- [각 영역별 정확한 CSS 포지션 정보]
- [반응형 고려사항]
- [애니메이션 가이드]

**9) 페이지 교육 효과**
- [이 설계가 달성하는 교육적 목표]
- [인지 부하 최적화 방법]
- [기억과 이해를 돕는 시각적 전략]

### 2. 페이지에 사용될 이미지

각 이미지는 반드시 다음 7가지 요소를 모두 포함하여 300-400자로 상세히 설명해주세요:

**1.png**:
- 🎨 **주요 시각 요소**: [구체적인 객체들과 배치]
- 🌈 **색상 구성**: [색상 이름으로만 표현, hex 코드 절대 금지]
- 🔗 **페이지 내 맥락**: [이 이미지가 페이지의 어느 단계에서 어떤 흐름으로 사용되는지, 앞뒤 콘텐츠와의 연결점]
- 🎭 **스타일과 질감**: [일러스트 스타일, 선의 굵기, 그라데이션 등]
- 👥 **학습자 관점**: [이 연령대가 어떻게 인식할지]
- 🔄 **교육적 기능**: [이 이미지가 달성하는 구체적 학습 목표]
- ⚡ **시각적 역동성**: [움직임, 흐름, 시선 유도 방식]

**2.png**, **3.png** (필요시): 위와 같은 7가지 형식으로 각각 작성

⚠️ **필수 주의사항**:
- 색상은 "밝은 파란색", "따뜻한 주황색" 등 자연어로만 표현
- #000000, rgb() 등 모든 색상 코드 절대 금지
- AI가 텍스트를 이미지에 포함시키는 오류 방지

---

위 형식을 정확히 따라 개발자가 바로 코딩할 수 있을 정도로 구체적이고 정밀한 설계를 제공해주세요. 모호한 표현은 절대 사용하지 말고, 모든 수치와 색상을 정확히 명시하세요.`;
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
    console.log(`✅ 페이지 ${page.pageNumber} 2단위 구조 처리: 전체설명 + 기본구조`);

    // Phase 2 단순화: "2개 큰 덩어리" 시스템
    // 1. 전체 AI 응답 (fullDescription)
    // 2. 항상 보장되는 기본 구조 (3개 컴포넌트 + 1개 이미지)

    return {
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,

      // 📋 덩어리 1: 전체 AI 설계 문서 (모든 정보 보존)
      fullDescription: response.trim(),

      // 📋 덩어리 2: 기본 보장 구조 (파싱 실패 방지)
      learningObjectives: [`${page.topic} 기본 개념 이해`, '핵심 원리 파악', '실용적 적용'],
      educationalStrategy: '단계별 학습 접근법',

      layoutStructure: {
        areas: [
          {
            id: 'main-content',
            description: '메인 콘텐츠 영역',
            purpose: '핵심 학습 내용 제시',
            sizeGuide: '전체 화면의 80%'
          },
          {
            id: 'interaction-area',
            description: '상호작용 영역',
            purpose: '학습자 참여 유도',
            sizeGuide: '전체 화면의 20%'
          }
        ]
      },

      content: {
        heading: page.topic,
        bodyText: page.description || `${page.topic}에 대해 체계적으로 학습합니다.`,
        keyPoints: ['핵심 개념', '주요 원리', '실생활 적용']
      },

      // 항상 3개 기본 컴포넌트 보장 (파싱 실패 없음)
      components: [
        {
          id: 'title-component',
          type: 'heading',
          position: { area: '상단 영역', priority: 1 },
          size: { guideline: '전체 너비', responsive: true },
          content: { primary: page.topic },
          purpose: '페이지 주제 명시'
        },
        {
          id: 'content-component',
          type: 'text',
          position: { area: '메인 영역', priority: 2 },
          size: { guideline: '메인 영역 80%', responsive: true },
          content: { primary: page.description || `${page.topic}의 핵심 내용을 다룹니다.` },
          purpose: '주요 학습 내용 전달'
        },
        {
          id: 'action-component',
          type: 'interactive',
          position: { area: '하단 영역', priority: 3 },
          size: { guideline: '적절한 상호작용 크기', responsive: true },
          content: { primary: '학습 내용을 확인해보세요!' },
          purpose: '학습 참여 유도'
        }
      ],

      interactions: [
        {
          id: 'main-interaction',
          trigger: '컴포넌트 클릭',
          action: '추가 정보 표시',
          purpose: '심화 학습',
          feedback: '시각적 피드백 제공'
        }
      ],

      // Phase 2 개선: AI 응답에서 실제 이미지들 파싱 시도 + 기본 보장 이미지
      mediaAssets: this.parseAndGenerateImages(response, page, projectData, emotionalContext),

      // 품질 관리 시스템 통합
      qualityMetrics: this.calculatePageQuality(response, page, projectData),

      designRationale: '안정적이고 효과적인 교육 구조',
      implementationHints: '사용자 중심의 직관적 인터페이스 구현',
      uxConsiderations: '접근성과 학습 효과 최우선',

      isComplete: true, // 항상 완료 상태 보장
      generatedAt: new Date(),

      // 디버그 정보 저장
      debugInfo: originalPrompt && originalResponse ? {
        originalPrompt,
        originalResponse,
        parsedSections: { fullContent: response.substring(0, 200) + '...' },
        layoutValidation,
        qualityMetrics: this.calculatePageQuality(response, page, projectData)
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
        type: 'heading',
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

  // AI 응답에서 이미지 정보를 파싱하고 기본 이미지들 생성
  private parseAndGenerateImages(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    console.log(`🖼️ 페이지 ${page.pageNumber} 이미지 파싱 시작`);

    // 1. AI 응답에서 이미지 정보 추출 시도
    const parsedImages = this.extractImagesFromResponse(response, page, projectData, emotionalContext);

    // 2. 파싱 성공 시 파싱된 이미지만 사용 (최대 3개)
    if (parsedImages.length > 0) {
      const limitedImages = parsedImages.slice(0, 3); // 최대 3개로 제한
      console.log(`✅ AI 응답에서 ${limitedImages.length}개 이미지 파싱 성공`);
      return limitedImages;
    }

    // 3. 파싱 실패 시에만 기본 이미지 사용
    const fallbackImages = this.generateFallbackImages(page, projectData, emotionalContext);
    console.log(`🔄 파싱 실패, 기본 이미지 ${fallbackImages.length}개 사용`);
    return fallbackImages;
  }

  // AI 응답에서 이미지 정보 추출 (개선된 8가지 메타데이터 파싱)
  private extractImagesFromResponse(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    const images: any[] = [];

    // "### 2. 페이지에 사용될 이미지" 섹션 찾기
    const imageSection = response.match(/### 2\. 페이지에 사용될 이미지(.*?)(?=\n###|\n---|\n##|$)/s);
    if (!imageSection) {
      console.log('❌ 이미지 섹션을 찾을 수 없음');
      return images;
    }

    const imageContent = imageSection[1];
    console.log('🔍 이미지 섹션 내용:', imageContent.substring(0, 300) + '...');

    // 개선된 8가지 메타데이터 파싱:
    // **1.png**:
    // - 🎨 **주요 시각 요소**: [...]
    // - 🌈 **색상 구성**: [...]
    // ...

    // 이미지 항목들을 찾기 (구조화된 형식)
    const imageMatches = imageContent.match(/\*\*(\d+)\.png\*\*:[\s\S]*?(?=\*\*\d+\.png\*\*:|$)/g);

    if (!imageMatches) {
      console.log('❌ 이미지 항목을 찾을 수 없음');
      return images;
    }

    console.log(`🔍 발견된 이미지 항목: ${imageMatches.length}개`);

    imageMatches.forEach((match, index) => {
      console.log(`📝 이미지 항목 ${index + 1} 파싱 시도:`, match.substring(0, 200) + '...');

      // 파일명 추출
      const fileNameMatch = match.match(/\*\*(\d+)\.png\*\*:/);
      if (!fileNameMatch) {
        console.log(`❌ 이미지 ${index + 1} 파일명 추출 실패`);
        return;
      }

      const imageNumber = fileNameMatch[1];
      const imageCounter = parseInt(imageNumber);

      // 8가지 메타데이터 추출
      const structuredMetadata = this.parseStructuredImageMetadata(match, page.topic);

      // 색상 코드 검증
      this.validateNoColorCodes(structuredMetadata.colorScheme || '');

      console.log(`✅ 이미지 ${imageCounter} 구조화된 파싱 성공`);
      console.log(`- 파일명: ${imageNumber}.png`);
      console.log(`- 시각 요소: ${(structuredMetadata.visualElements || '').substring(0, 50)}...`);
      console.log(`- 색상 구성: ${(structuredMetadata.colorScheme || '').substring(0, 50)}...`);

      // 설명에서 크기 정보 추출 시도
      const sizeMatch = match.match(/(\d+)×(\d+)px/);
      const width = sizeMatch ? parseInt(sizeMatch[1]) : 600;
      const height = sizeMatch ? parseInt(sizeMatch[2]) : 400;

      // AI 프롬프트 생성 (8가지 요소 종합, 색상은 자연어만)
      const enhancedAIPrompt = this.generateEnhancedAIPrompt(structuredMetadata, page.topic);

      images.push({
        id: `page-${page.pageNumber}-${imageCounter}`,
        fileName: `${imageCounter}.png`,
        path: `~/image/page${page.pageNumber}/${imageCounter}.png`,
        type: 'image',
        category: '교육 시각화',
        purpose: `교육 시각 자료 ${imageCounter}`,
        description: match.trim(),
        sizeGuide: `${width}×${height}px`,
        placement: {
          section: '메인 영역',
          position: imageCounter === 1 ? '중앙' : `위치${imageCounter}`,
          size: `${width}×${height}px`
        },
        accessibility: {
          altText: `${page.topic} 관련 교육 이미지`,
          caption: `${page.topic} 시각 자료`
        },
        aiPrompt: enhancedAIPrompt,
        // 8가지 구조화된 메타데이터 추가
        structuredMetadata
      });
    });

    return images;
  }

  // 이미지 설명에서 AI 프롬프트 추출 또는 생성
  private extractAIPromptFromDescription(description: string, topic: string): string {
    // 설명이 영어로 시작하면 그대로 사용
    if (/^[A-Za-z]/.test(description.trim())) {
      return description.trim();
    }

    // 한국어 설명을 기반으로 영문 프롬프트 생성
    return `Educational illustration for ${topic}, detailed and clear visual representation with bright colors and simple design elements, suitable for students`;
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
      primary: emotionalContext.colorEmotions.primary,
      secondary: emotionalContext.colorEmotions.secondary,
      accent: emotionalContext.colorEmotions.accent
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
- Color Palette: Use ${colors.primary} as primary color, ${colors.secondary} as secondary, ${colors.accent} for highlights
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
        headings: '명확하고 자신감 있는',
        body: '편안하게 읽히는'
      },
      overallTone: visualIdentity.componentStyle
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
- **색상 코드 금지**: 이미지 설명에서 헥스 코드 사용 절대 금지

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
        // 색상 코드를 자연어로 변환하는 로직 추가 가능
      }
    });
  }

  // 8가지 요소 종합 AI 프롬프트 생성
  private generateEnhancedAIPrompt(metadata: any, topic: string): string {
    return `Educational illustration for "${topic}".

Visual Elements: ${metadata.visualElements || 'Clear educational content'}
Color Composition: ${metadata.colorScheme || 'Natural, readable colors'} (NO hex codes, natural color names only)
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
          '색상 코드 감지됨 - AI 이미지 생성 오류 위험',
          '자연어 색상 표현으로 변경 필요'
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
      imageDetailScore,
      layoutDiversityScore,
      constraintComplianceScore,
      overallQualityScore,
      suggestions,
      warnings
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