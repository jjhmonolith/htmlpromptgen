// Fixed TypeError: not a function error
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

    // Fixed 모드일 때 높이 검증 및 자동 조정
    let finalResponse = response.content;
    let layoutValidation = { isValid: true, suggestions: [] };

    if (projectData.layoutMode === 'fixed') {
      const heightCheck = this.validateContentHeight(finalResponse, page);

      if (!heightCheck.withinBounds) {
        console.log(`⚠️ 페이지 ${page.pageNumber} 높이 초과 감지: ${heightCheck.estimatedHeight}px`);

        // 자동 조정 시도
        finalResponse = this.adjustContentForFixed(finalResponse, heightCheck);
        layoutValidation = {
          isValid: false,
          suggestions: [`높이 ${heightCheck.estimatedHeight}px로 자동 조정됨`]
        };
      }
    }

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

    // Fixed 모드와 Scrollable 모드별 프롬프트
    if (projectData.layoutMode === 'fixed') {
      const visualIdentitySection = this.formatStep2VisualIdentityForPrompt(emotionalContext.visualIdentity);
      const projectContextSection = this.formatProjectContextForPrompt(projectData, page, pageIndex, totalPages);

      const contentAnalysisSection = page.contentAnalysis ?
        `\n\n### 📊 콘텐츠 분석 결과\n` +
        `- **예상 구성**: ${page.contentAnalysis.outline ? page.contentAnalysis.outline.join(', ') : '정보 없음'}\n` +
        `- **예상 섹션 수**: ${page.contentAnalysis.estimatedSections}개\n` +
        `- **콘텐츠 밀도**: ${page.contentAnalysis.densityScore >= 0.8 ? '높음 (분할 권장)' : page.contentAnalysis.densityScore >= 0.6 ? '적정' : '여유'}\n`
        : '';

      return '당신은 주어진 \'비주얼 아이덴티티\'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 **자유롭게, 상세하게, 창의적으로 서술**해주세요.\n\n' +
        '### 🔴 FIXED 레이아웃 필수 준수사항 (절대 위반 금지)\n\n' +
        '1. **전체 높이 제한**: 900px 이내 (여백 100px 제외)\n' +
        '2. **콘텐츠 예산**:\n' +
        '   - 제목: 최대 2줄 (80px)\n' +
        '   - 본문: 최대 20줄 (480px)\n' +
        '   - 이미지: 최대 2개, 각 150px 높이\n' +
        '   - 카드/박스: 최대 3개, 각 80px 높이\n' +
        '   - 여백 및 간격: 총 110px\n\n' +
        '3. **폰트 크기 고려 계산**:\n' +
        '   - 제목: 28pt = 37px + 여백 = 45px/줄\n' +
        '   - 본문: 18pt = 24px + 여백 = 30px/줄\n' +
        '   - 이미지 캡션: 18pt = 24px\n\n' +
        '4. **자동 조정 규칙**:\n' +
        '   - 내용이 많으면: 텍스트 줄이기 → 이미지 크기 축소 → 요소 개수 감소\n' +
        '   - 절대 스크롤 생성하지 않음\n\n' +
        visualIdentitySection + '\n\n' +
        projectContextSection +
        contentAnalysisSection + '\n\n' +
        '### 🖼️ 이미지 사용 가이드라인 (중요!)\n\n' +
        '**이미지가 정말 필요한 경우에만** 다음 **정확한 형식**을 사용하세요:\n\n' +
        '**✅ 올바른 형식**: `[IMAGE: filename.png | Detailed English AI prompt]`\n\n' +
        '**📋 형식 규칙**:\n' +
        '- 대괄호와 IMAGE: 키워드 사용 필수\n' +
        '- 파일명은 영문+숫자+하이픈만 (공백 금지)\n' +
        '- 세로바(|) 구분자 사용 필수\n' +
        '- AI 프롬프트는 영문으로 상세하게 작성\n' +
        '- 한 줄에 하나의 이미지만 지정\n\n' +
        '**📝 예시**:\n' +
        '- `[IMAGE: concept-diagram.png | Educational diagram illustrating the main concepts with clear visual hierarchy using bright blue, soft green, and warm orange tones for educational clarity]`\n' +
        '- `[IMAGE: process-flow.png | Step by step process flowchart with numbered stages and directional arrows in professional blue and friendly green colors]`\n\n' +
        '### 📜 핵심 규칙\n' +
        '1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.\n' +
        '2.  **공간 최적화**: 콘텐츠를 화면에 효과적으로 배치하여 어색한 빈 공간이 생기지 않도록 하세요.\n' +
        '3.  **시각화 설계 우선**: 그래프, 차트, 다이어그램, 인포그래픽, 플로우차트, 표 등은 **구체적인 설명으로만** 설계하세요.\n' +
        '4.  **이미지 최소화**: 이미지는 **실제 사진이나 대체불가능한 일러스트**에만 사용하세요. 데이터 시각화, 구조도, 개념도 등은 설명으로 충분합니다.\n' +
        '5.  **이미지 사용 기준**: 다음 경우에만 이미지 사용 허용\n' +
        '   - 실제 인물/장소/사물 사진\n' +
        '   - 역사적 문서나 예술작품\n' +
        '   - 복잡한 일러스트레이션 (단순 도형/차트 제외)\n' +
        '6.  **🚫 HTML/CSS 코드 작성 절대 금지**:\n' +
        '   ⚠️ **어떤 경우에도 HTML 태그나 CSS 코드를 작성하지 마세요**\n' +
        '   ⚠️ **`<div>`, `<span>`, CSS 속성 등 모든 코드 예시 금지**\n' +
        '   ⚠️ **"div + CSS height"와 같은 구현 방법 제시 금지**\n' +
        '   ✅ **대신 "세로 막대 형태의 그래프"처럼 시각적 설명만 제공**\n' +
        '7.  **이미지 사용 규칙**: 정말 필요한 경우에만 다음 **정확한 형식**을 사용하세요\n' +
        '   - **형식**: `[IMAGE: 파일명.png | AI 이미지 생성 프롬프트]`\n' +
        '   - **예시**: `[IMAGE: diagram1.png | Educational diagram showing the main concept with clear labels using bright blue, soft green, and warm orange colors for clarity]`\n' +
        '   - **중요**: 파일명은 영문과 숫자만 사용, 프롬프트는 영문으로 상세하게 작성, 한 줄에 하나의 이미지만 지정\n' +
        '8.  **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.\n\n' +
        '### 🚫 절대 금지 사항\n' +
        '- **HTML/CSS 코드 작성 절대 금지**: `<div>`, `<span>`, `class=`, `style=`, CSS 속성 등 모든 코드 예시를 절대 작성하지 마세요\n' +
        '- **CSS 기술 용어 금지**: flexbox, grid, position, margin, padding 등 CSS 관련 용어 사용 금지\n' +
        '- **구현 방법 제시 금지**: 기술적 구현 방법 대신 시각적 결과만 설명하세요\n' +
        '- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.\n' +
        '- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.\n' +
        '- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.\n\n' +
        contentModeStrategy + '\n\n' +
        '이제 위의 가이드라인에 맞춰 페이지 레이아웃을 창의적으로 서술해주세요.';
    } else {
      return '당신은 주어진 \'비주얼 아이덴티티\'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. **1600px 너비의 가변 높이 화면**에 들어갈 콘텐츠 레이아웃을 **자유롭게, 상세하게, 창의적으로 서술**해주세요.\n\n' +
        this.formatStep2VisualIdentityForPrompt(emotionalContext.visualIdentity) + '\n\n' +
        '### 📜 레이아웃 철학\n' +
        '- **스크롤 전개**: 세로 스크롤을 통한 자연스러운 콘텐츠 전개\n' +
        '- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요. 사용자의 시선이 자연스럽게 위에서 아래로 흐르도록 유도하고, 각 섹션별로 적절한 여백과 구분을 두어 읽기 편안한 경험을 제공하세요.\n\n' +
        '### 🖼️ 새로운 레이아웃 가능성\n' +
        '- **자유로운 높이**: 1600px 너비는 고정하되, 높이는 콘텐츠에 따라 자유롭게 확장 가능합니다\n' +
        '- **풍부한 콘텐츠**: 더 많은 설명, 예시, 단계별 가이드, 상세한 도표 등을 포함할 수 있습니다\n' +
        '- **창의적 섹션 구성**: 히어로 섹션, 콘텐츠 섹션, 예시 섹션, 실습 섹션, 정리 섹션 등을 자유롭게 조합하세요\n' +
        '- **시각적 여유**: 각 요소 간 충분한 여백을 두어 답답하지 않은 레이아웃을 만드세요\n\n' +
        this.formatProjectContextForPrompt(projectData, page, pageIndex, totalPages) + '\n\n' +
        '### 🖼️ 이미지 사용 가이드라인 (중요!)\n\n' +
        '**이미지가 정말 필요한 경우에만** 다음 **정확한 형식**을 사용하세요:\n\n' +
        '**✅ 올바른 형식**: `[IMAGE: filename.png | Detailed English AI prompt]`\n\n' +
        '**📋 형식 규칙**:\n' +
        '- 대괄호와 IMAGE: 키워드 사용 필수\n' +
        '- 파일명은 영문+숫자+하이픈만 (공백 금지)\n' +
        '- 세로바(|) 구분자 사용 필수\n' +
        '- AI 프롬프트는 영문으로 상세하게 작성\n' +
        '- 한 줄에 하나의 이미지만 지정\n\n' +
        '**📝 예시**:\n' +
        '- `[IMAGE: hero-visual.png | Inspiring hero image that represents the main topic with modern educational design in soft blue and warm green tones]`\n' +
        '- `[IMAGE: detailed-chart.png | Complex data visualization chart with multiple data points and clear legends using professional blue, friendly green, and warm orange colors]`\n\n' +
        '### 📜 핵심 규칙\n' +
        '1. **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.\n' +
        '2. **세로 스크롤 친화적**: 사용자가 세로로 스크롤하며 자연스럽게 콘텐츠를 소비할 수 있도록 구성하세요.\n' +
        '3. **섹션별 구성**: 페이지를 논리적인 섹션들로 나누어 각각의 목적과 내용을 명확히 하세요.\n' +
        '4. **시각화 설계 우선**: 그래프, 차트, 다이어그램, 인포그래픽, 플로우차트, 표, 타임라인 등은 **구체적인 설명으로만** 설계하세요.\n' +
        '5. **이미지 최소화**: 이미지는 **실제 사진이나 대체불가능한 일러스트**에만 사용하세요. 데이터 시각화나 구조도는 설명으로 충분합니다.\n' +
        '6. **이미지 사용 기준**: 다음 경우에만 이미지 사용 허용\n' +
        '   - 실제 인물/장소/사물/자연현상 사진\n' +
        '   - 역사적 문서나 예술작품\n' +
        '   - 복잡한 일러스트레이션 (단순 도형/차트 제외)\n' +
        '7. **🚫 HTML/CSS 코드 작성 절대 금지**:\n' +
        '   ⚠️ **어떤 경우에도 HTML 태그나 CSS 코드를 작성하지 마세요**\n' +
        '   ⚠️ **`<div>`, `<span>`, CSS 속성, 클래스명 등 모든 코드 예시 금지**\n' +
        '   ⚠️ **"flexbox", "grid", "conic-gradient" 등 CSS 기술 용어 금지**\n' +
        '   ⚠️ **구현 방법 제시 대신 시각적 결과만 설명하세요**\n' +
        '   ✅ **예: "3개의 세로 막대가 나란히 배치된 비교 차트"**\n' +
        '8. **이미지 사용 규칙**: 정말 필요한 경우에만 다음 **정확한 형식**을 사용하세요\n' +
        '   - **형식**: `[IMAGE: 파일명.png | AI 이미지 생성 프롬프트]`\n' +
        '   - **예시**: `[IMAGE: timeline1.png | Visual timeline showing historical progression with clear dates and events]`\n' +
        '   - **중요**: 파일명은 영문과 숫자만 사용, 프롬프트는 영문으로 상세하게 작성, 한 줄에 하나의 이미지만 지정\n' +
        '9. **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.\n' +
        '10. **충분한 여백**: 각 섹션과 요소 간 충분한 여백(padding, margin)을 두어 읽기 편안한 경험을 제공하세요.\n\n' +
        '### 🎯 권장 레이아웃 구조\n' +
        '```\n' +
        '[히어로 섹션] - 페이지 제목과 핵심 메시지\n' +
        '↓ (여백)\n' +
        '[도입 섹션] - 학습 목표나 개요 소개\n' +
        '↓ (여백)\n' +
        '[메인 콘텐츠 섹션] - 핵심 학습 내용\n' +
        '↓ (여백)\n' +
        '[예시/실습 섹션] - 구체적 예시나 활동\n' +
        '↓ (여백)\n' +
        '[정리 섹션] - 요약 및 핵심 포인트\n' +
        '```\n\n' +
        '### 🚫 절대 금지 사항\n' +
        '- **HTML/CSS 코드 작성 절대 금지**: `<div>`, `<span>`, `class=`, `style=`, CSS 속성 등 모든 코드 예시를 절대 작성하지 마세요\n' +
        '- **CSS 기술 용어 금지**: flexbox, grid, position, margin, padding, transform 등 CSS 관련 용어 사용 금지\n' +
        '- **구현 방법 제시 금지**: 기술적 구현 방법 대신 시각적 결과만 설명하세요\n' +
        '- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.\n' +
        '- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.\n' +
        '- **최소 폰트 크기**: 모든 텍스트는 반드시 18px 이상으로 설정하세요. 본문은 18-20px, 제목은 24px 이상을 권장합니다.\n' +
        '- **가로 스크롤 금지**: 너비는 1600px를 넘지 않도록 하여 가로 스크롤이 발생하지 않게 하세요.\n\n' +
        getContentModeStrategy(projectData.contentMode) + '\n\n' +
        '이제 위의 가이드라인에 맞춰 **가변 높이를 충분히 활용한** 창의적이고 교육적인 페이지 레이아웃을 상세히 서술해주세요. 각 섹션의 목적, 내용, 시각적 처리 방법을 구체적으로 설명해주세요.';
    }
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
          type: 'layout',
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

  // AI 응답에서 이미지 정보를 파싱하고 기본 이미지들 생성 (구조화된 파싱 방법)
  private parseAndGenerateImages(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    console.log(`🖼️ 페이지 ${page.pageNumber} 이미지 파싱 시작`);

    // Step 1: 빠른 사전 검사
    if (!response.includes('[IMAGE:')) {
      console.log(`✅ 이미지 태그 없음 - HTML/CSS 기반 설계`);
      return [];
    }

    // Step 2: 구조화된 파싱
    const imageMatches = this.extractImageTags(response);

    if (imageMatches.length === 0) {
      console.log(`✅ 유효한 이미지 없음 - HTML/CSS 기반 설계`);
      return [];
    }

    console.log(`🎉 총 ${imageMatches.length}개 이미지 파싱 완료`);

    // Step 3: 이미지 객체 생성 (최대 3개 제한)
    return imageMatches.map((match, index) =>
      this.createImageObject(match.filename, match.prompt, page, index + 1)
    ).slice(0, 3);
  }

  private extractImageTags(response: string): Array<{filename: string, prompt: string}> {
    const pattern = /\[IMAGE:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\]/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(response)) !== null) {
      const filename = match[1].trim();
      const prompt = match[2].trim();

      // 유효성 검사
      if (filename && prompt && prompt.length > 10) {
        matches.push({
          filename: this.sanitizeFilename(filename),
          prompt: prompt
        });
        console.log(`✅ 이미지 파싱: ${filename} | ${prompt.substring(0, 50)}...`);
      }
    }

    return matches;
  }

  private sanitizeFilename(filename: string): string {
    const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return clean.includes('.') ? clean : `${clean}.png`;
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

  // Step2 Visual Identity를 Step3 프롬프트용으로 포맷팅
  private formatStep2VisualIdentityForPrompt(visualIdentity: any): string {
    if (!visualIdentity) {
      return `### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: 교육적이고 친근한
- **핵심 디자인 원칙**: 콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요.`;
    }

    const vi = visualIdentity;

    return `### ✨ 비주얼 아이덴티티 (반드시 준수할 것)

#### 🎭 무드와 톤
- **핵심 감성**: ${vi.moodAndTone ? vi.moodAndTone.join(', ') : '교육적, 친근한'}
- 이 4가지 감성을 레이아웃의 모든 요소(여백, 정렬, 색상 배치, 컴포넌트 형태)에 반영하세요.

#### 🎨 컬러 시스템 (5개 색상)
- **PRIMARY (${vi.colorPalette?.primary || '#2563EB'})**: 주요 제목, 중요한 버튼, 핵심 강조 요소
- **SECONDARY (${vi.colorPalette?.secondary || '#F1F5F9'})**: 카드 배경, 섹션 구분, 보조 영역
- **ACCENT (${vi.colorPalette?.accent || '#F59E0B'})**: 행동 유도, 하이라이트, 주의 집중 요소
- **BACKGROUND (${vi.colorPalette?.background || '#FFFFFF'})**: 전체 페이지 배경색
- **TEXT (${vi.colorPalette?.text || '#0F172A'})**: 모든 텍스트의 기본 색상

#### ✍️ 타이포그래피 시스템
- **헤딩 폰트**: ${vi.typography?.headingFont || 'Pretendard'} (제목, 섹션 헤더에 사용)
- **본문 폰트**: ${vi.typography?.bodyFont || 'Noto Sans KR'} (일반 텍스트, 설명문에 사용)
- **기본 크기**: ${vi.typography?.baseSize || '20pt'} (이를 기준으로 제목은 더 크게, 캡션은 더 작게)

#### 🎪 컴포넌트 스타일 가이드
${vi.componentStyle || '깔끔하고 교육적인 디자인으로 학습자의 집중도를 높이는 컴포넌트 구성을 권장합니다.'}

#### 💡 디자인 적용 지침
1. **색상 일관성**: 위 5가지 색상만 사용하여 통일된 컬러 팔레트 유지
2. **폰트 일관성**: 지정된 2가지 폰트만 사용하여 타이포그래피 시스템 준수
3. **감성 반영**: 4가지 무드를 레이아웃의 전체적인 느낌에 녹여내세요
4. **컴포넌트 가이드 준수**: 위 스타일 가이드에 맞는 UI 요소들로 구성하세요`;
  }

  // Step1 프로젝트 정보와 다른 페이지들의 맥락 정보를 포맷팅
  private formatProjectContextForPrompt(
    projectData: ProjectData,
    currentPage: any,
    pageIndex: number,
    totalPages: number
  ): string {
    const prevPageContext = pageIndex > 0
      ? `이전 페이지: ${projectData.pages[pageIndex - 1]?.topic || '없음'}`
      : '첫 번째 페이지입니다';

    const nextPageContext = pageIndex < totalPages - 1
      ? `다음 페이지: ${projectData.pages[pageIndex + 1]?.topic || '없음'}`
      : '마지막 페이지입니다';

    // Learning Journey Designer 정보 포함
    const learningJourneyInfo = this.formatLearningJourneyInfo(projectData);

    // 전체 페이지 구조 개요 (아하 모먼트 포함)
    const allPagesOverview = projectData.pages.map((page, idx) => {
      const isCurrent = idx === pageIndex;
      const status = idx < pageIndex ? '✅ 완료' : idx === pageIndex ? '🔄 현재' : '⏳ 예정';
      const ahaMoment = projectData.ahaMoments?.[idx] ? ` | 💡 아하 모먼트: ${projectData.ahaMoments[idx]}` : '';
      return `  ${status} 페이지 ${page.pageNumber}: ${page.topic}${page.description ? ` (${page.description})` : ''}${ahaMoment}`;
    }).join('\n');

    return `### 📚 프로젝트 전체 정보

#### 🎯 기본 정보
- **프로젝트 제목**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃 모드**: ${projectData.layoutMode === 'fixed' ? 'Fixed (1600×1000px)' : 'Scrollable (1600px 너비)'}
- **콘텐츠 모드**: ${this.getContentModeDescription(projectData.contentMode)}

${learningJourneyInfo}

#### 📖 전체 페이지 구조 (총 ${totalPages}개 페이지)
${allPagesOverview}

### 📍 현재 페이지 컨텍스트
- ${prevPageContext}
- **🔄 현재 페이지 ${currentPage.pageNumber}: ${currentPage.topic}**
  ${currentPage.description ? `- **상세 설명**: ${currentPage.description}` : ''}
  ${projectData.ahaMoments?.[pageIndex] ? `- **💡 이 페이지의 아하 모먼트**: ${projectData.ahaMoments[pageIndex]}` : ''}`;
  }

  private formatLearningJourneyInfo(projectData: ProjectData): string {
    if (projectData.learningJourneyMode === 'skip') {
      return '';
    }

    let journeyInfo = '#### 🎓 Learning Journey Designer 정보\n';

    if (projectData.emotionalArc) {
      journeyInfo += `- **감정적 여정**: ${projectData.emotionalArc}\n`;
    }

    if (projectData.learnerPersona) {
      journeyInfo += `- **학습자 페르소나**: ${projectData.learnerPersona}\n`;
    }

    // 페이지별 아하 모먼트 매핑
    if (projectData.ahaMoments && projectData.ahaMoments.length > 0) {
      journeyInfo += `- **페이지별 아하 모먼트**:\n`;
      projectData.ahaMoments.forEach((moment, index) => {
        const pageNumber = index + 1;
        const associatedPage = projectData.pages?.[index];
        const pageTopic = associatedPage ? associatedPage.topic : `페이지 ${pageNumber}`;
        journeyInfo += `  - 페이지 ${pageNumber} (${pageTopic}): ${moment}\n`;
      });
    }

    return journeyInfo;
  }

  private getContentModeDescription(mode: string): string {
    switch (mode) {
      case 'enhanced': return 'Enhanced (AI 보강) - HTML/CSS 시각화 추가';
      case 'restricted': return 'Restricted (원본 유지) - 주어진 콘텐츠만 사용';
      case 'original': return 'Original (기본) - 원본 내용 최대한 보존';
      default: return mode;
    }
  }

  private getPageConnectionGuide(page: any, direction: 'prev' | 'next'): string {
    if (!page) {
      return direction === 'prev' ? '시작 페이지로서 강력한 도입부 필요' : '마무리 페이지로서 완결성 있는 정리 필요';
    }

    const verb = direction === 'prev' ? '이어받아' : '준비하여';
    return `"${page.topic}" 내용을 ${verb} 자연스러운 흐름 유지`;
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

  // 높이 계산 알고리즘
  private validateContentHeight(response: string, page: any): {
    withinBounds: boolean;
    estimatedHeight: number;
    breakdown: {
      title: number;
      body: number;
      images: number;
      cards: number;
      margins: number;
    };
    suggestions: string[];
  } {
    // 기본 높이 계산 (텍스트 기반 추정)
    const titleLines = this.estimateTitleLines(response);
    const bodyLines = this.estimateBodyLines(response);
    const imageCount = this.countImages(response);
    const cardCount = this.countCards(response);

    const breakdown = {
      title: titleLines * 45,      // 28pt + 여백 = 45px/줄
      body: bodyLines * 30,        // 18pt + 여백 = 30px/줄
      images: imageCount * 150,    // 각 이미지 150px
      cards: cardCount * 80,       // 각 카드/박스 80px
      margins: 110                 // 기본 여백 및 간격
    };

    const estimatedHeight = Object.values(breakdown).reduce((sum, height) => sum + height, 0);
    const withinBounds = estimatedHeight <= 900; // 900px 제한

    const suggestions: string[] = [];
    if (!withinBounds) {
      if (bodyLines > 20) suggestions.push('본문 텍스트 줄이기');
      if (imageCount > 2) suggestions.push('이미지 개수 감소');
      if (cardCount > 3) suggestions.push('카드/박스 요소 통합');
    }

    return {
      withinBounds,
      estimatedHeight,
      breakdown,
      suggestions
    };
  }

  // 텍스트에서 제목 줄 수 추정
  private estimateTitleLines(response: string): number {
    const titleMatches = response.match(/제목|타이틀|heading|h1|h2/gi);
    return Math.min(titleMatches ? titleMatches.length * 2 : 2, 4); // 최대 4줄
  }

  // 텍스트에서 본문 줄 수 추정
  private estimateBodyLines(response: string): number {
    const textContent = response.replace(/[^\가-힣a-zA-Z\s]/g, '');
    const approximateLines = Math.ceil(textContent.length / 60); // 60자/줄 추정
    return Math.min(approximateLines, 20); // 최대 20줄
  }

  // 이미지 개수 계산
  private countImages(response: string): number {
    const imageMatches = response.match(/\[IMAGE:|이미지|그림/gi);
    return Math.min(imageMatches ? imageMatches.length : 1, 2); // 최대 2개
  }

  // 카드/박스 요소 개수 계산
  private countCards(response: string): number {
    const cardMatches = response.match(/카드|박스|섹션|영역/gi);
    return Math.min(cardMatches ? Math.ceil(cardMatches.length / 3) : 2, 3); // 최대 3개
  }

  // Fixed 모드용 콘텐츠 자동 조정
  private adjustContentForFixed(response: string, heightCheck: any): string {
    let adjustedResponse = response;

    // 1단계: 텍스트 줄이기
    if (heightCheck.breakdown.body > 480) {
      adjustedResponse = this.reduceTextContent(adjustedResponse);
    }

    // 2단계: 이미지 크기 조정
    if (heightCheck.breakdown.images > 300) {
      adjustedResponse = this.optimizeImages(adjustedResponse);
    }

    // 3단계: 요소 병합/제거
    if (heightCheck.breakdown.cards > 240) {
      adjustedResponse = this.consolidateElements(adjustedResponse);
    }

    return adjustedResponse + '\n\n⚠️ 자동 조정: Fixed 레이아웃 제약에 맞춰 콘텐츠가 최적화되었습니다.';
  }

  // 텍스트 내용 줄이기
  private reduceTextContent(response: string): string {
    return response.replace(/([.!?])\s+([가-힣a-zA-Z])/g, (match, punct, nextChar, offset, string) => {
      // 문장 사이의 불필요한 설명 줄이기
      const sentences = string.split(/[.!?]/).filter(s => s.trim());
      if (sentences.length > 5) {
        return `${punct} `;
      }
      return match;
    });
  }

  // 이미지 최적화
  private optimizeImages(response: string): string {
    return response.replace(/150px/g, '120px').replace(/400×300px/g, '320×240px');
  }

  // 요소 통합
  private consolidateElements(response: string): string {
    return response.replace(/(\d+\.\s[^\n]+)\n+(\d+\.\s[^\n]+)/g, '$1, $2');
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