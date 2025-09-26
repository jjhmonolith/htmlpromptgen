import { OpenAIService } from './openai.service';
import {
  ProjectData,
  VisualIdentity,
  DesignTokens,
  Step3IntegratedResult,
  FinalPrompt,
  Step4DesignResult
} from '../types/workflow.types';

/**
 * Step 4-5 통합 서비스
 *
 * 기존 Step4와 Step5의 로직을 순차적으로 실행하여
 * UI에서는 하나의 단계로 표시되지만 내부적으로는
 * 모든 기능을 완전히 보존합니다.
 */
export class IntegratedStep4And5Service {
  // private step4Service: Step4DesignSpecificationService;

  constructor(private _openAIService: OpenAIService) {
    // this.step4Service = new Step4DesignSpecificationService(openAIService);
  }

  /**
   * Step 4-5 통합 처리
   *
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param designTokens Step2 디자인 토큰
   * @param step3Result Step3 통합 결과
   * @returns Step4 결과와 Step5 최종 프롬프트를 포함한 통합 결과
   */
  async executeIntegratedProcess(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens,
    step3Result: Step3IntegratedResult
  ): Promise<{
    step4Result: Step4DesignResult;
    step5Result: FinalPrompt;
  }> {
    console.log('🚀 Step 4-5 통합 프로세스 시작');

    try {
      // 1. Step4 로직 실행 - 실제 AI 호출로 디자인 명세 생성
      console.log('🎯 Step 4: 디자인 명세 생성 시작');
      const step4Result = await this.generateStep4DesignSpecification(
        projectData,
        visualIdentity,
        designTokens,
        step3Result
      );
      console.log('✅ Step 4: 디자인 명세 생성 완료');

      // 2. Step5 로직 실행 (기존과 완전히 동일)
      console.log('🎯 Step 5: 최종 프롬프트 생성 시작');
      const step5Result = this.generateFinalPrompt(
        projectData,
        visualIdentity,
        designTokens,
        step3Result,
        step4Result
      );
      console.log('✅ Step 5: 최종 프롬프트 생성 완료');

      console.log('🎉 Step 4-5 통합 프로세스 완료');

      return {
        step4Result,
        step5Result
      };

    } catch (error) {
      console.error('❌ Step 4-5 통합 프로세스 실패:', error);
      throw error;
    }
  }

  /**
   * Step5 로직 (기존 Step5FinalPrompt 컴포넌트의 로직을 그대로 이관)
   */
  private generateFinalPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens,
    step3Result: Step3IntegratedResult,
    step4Result: Step4DesignResult
  ): FinalPrompt {
    const htmlPrompt = this.compileHTMLPrompt(
      projectData,
      visualIdentity,
      designTokens,
      step3Result,
      step4Result
    );

    return {
      htmlPrompt
    };
  }

  /**
   * HTML 프롬프트 컴파일 (기존 Step5 로직 그대로 보존)
   */
  private compileHTMLPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    _designTokens: DesignTokens,
    step3Result: Step3IntegratedResult,
    step4Result: Step4DesignResult
  ): string {
    const sections = [];

    // 레이아웃 및 콘텐츠 모드 조합 결정
    const isScrollable = projectData.layoutMode === 'scrollable';
    const isEnhanced = projectData.contentMode === 'enhanced';

    // 1. 프로젝트 개요
    sections.push(`# 최종 교안 개발 프롬프트

## 1. 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃 모드**: ${isScrollable ? '📜 스크롤 가능 (가로 1600px, 세로 유연)' : '📐 고정 크기 (1600x1000px)'}
- **콘텐츠 모드**: ${isEnhanced ? '✨ AI 보강 모드 - AI가 내용을 창의적으로 확장' : '📝 원본 유지 모드 - 사용자가 입력한 내용만 사용'}
${projectData.suggestions && projectData.suggestions.length > 0
  ? `- **사용자 추가 제안**: ${projectData.suggestions.join(' ')}`
  : ''}`);

    // 2. 디자인 시스템
    sections.push(`## 2. 디자인 시스템
- **분위기 & 톤**: ${visualIdentity.moodAndTone.join(', ')}
- **색상 팔레트 (css/style.css 에 변수로 정의할 것)**:
  --primary-color: ${visualIdentity.colorPalette.primary};
  --secondary-color: ${visualIdentity.colorPalette.secondary};
  --accent-color: ${visualIdentity.colorPalette.accent};
  --text-color: ${visualIdentity.colorPalette.text};
  --background-color: ${visualIdentity.colorPalette.background};
- **타이포그래피 (css/style.css 에 정의할 것)**:
  - Heading Font: ${visualIdentity.typography.headingFont}
  - Body Font: ${visualIdentity.typography.bodyFont}
  - Base Size: ${visualIdentity.typography.baseSize}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}`);

    // 3. 핵심 개발 요구사항
    sections.push(this.generateCoreRequirements(isScrollable, isEnhanced));

    // 4. 콘텐츠 생성 규칙
    sections.push(this.generateContentRules(isEnhanced));

    // 5. 페이지별 상세 구현 가이드
    sections.push(this.generatePageByPageSpecification(projectData, step3Result, step4Result));

    // 6. CSS 및 JavaScript 구현 가이드
    sections.push(this.generateCSSSpecification());

    // 7. 이미지 생성 명세서
    sections.push(this.generateImagePromptSection(projectData, visualIdentity, step3Result));

    // 8. 프로젝트 폴더 구조 및 개발 가이드라인
    sections.push(this.generateProjectStructureGuide(projectData, step3Result));

    // 9. 구현 가이드라인
    sections.push(this.generateImplementationGuidelines());

    return sections.join('\n\n');
  }


  // 나머지 헬퍼 메서드들 (기존 Step5FinalPrompt 로직 그대로)
  private generateCoreRequirements(isScrollable: boolean, isEnhanced: boolean): string {
    if (isScrollable && isEnhanced) {
      return `## 3. 핵심 개발 요구사항

### 📜 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1. **가로 고정, 세로 유연**
   * 가로: 1600px 고정
   * 세로: 콘텐츠 양에 따라 자유롭게 확장
   * \`overflow-x: hidden; overflow-y: auto;\` 적용
   * 최소 높이 1000px 유지

2. **🔴 최소 폰트 크기 규칙 (매우 중요!) 🔴**
   * **모든 텍스트는 최소 18pt(24px) 이상**
   * 본문: 18-20pt (24-27px)
   * 부제목: 22-24pt (29-32px)
   * 제목: 28-36pt (37-48px)
   * **가독성을 위해 절대 18pt 미만 사용 금지**

3. **🚫 페이지 독립성 규칙 (절대 위반 금지!) 🚫**
   * **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호 등 절대 금지
   * **각 페이지는 완전히 독립적**: 다른 페이지 존재 암시 금지`;
    } else {
      return `## 3. 핵심 개발 요구사항

### 📐 고정 크기 레이아웃 규칙
**1600x1000px 고정 크기 내에서 모든 콘텐츠를 완벽히 배치합니다.**

1. **🚫 스크롤 절대 금지**
   * \`overflow: hidden !important;\` 필수 적용
   * 모든 콘텐츠는 1600x1000px 안에 완벽히 수납

2. **🔴 최소 폰트 크기 규칙**
   * **모든 텍스트는 최소 18pt(24px) 이상**
   * **가독성을 위해 절대 18pt 미만 사용 금지**

3. **🚫 페이지 독립성 규칙**
   * **네비게이션 요소 완전 금지**
   * **각 페이지는 완전히 독립적**`;
    }
  }

  private generateContentRules(isEnhanced: boolean): string {
    if (isEnhanced) {
      return `## 4. 콘텐츠 생성 규칙

### 📌 콘텐츠 생성 규칙
- **AI 보강 모드 활성화**: 내용을 창의적으로 확장하고 보강
- **학습 효과 극대화**: 추가 설명, 예시, 시각 자료 적극 활용`;
    } else {
      return `## 4. 콘텐츠 생성 규칙

### 📌 콘텐츠 생성 규칙
- **원본 유지 모드 활성화**: 사용자가 입력한 내용만을 정확히 사용
- **추가 내용 생성 금지**: AI의 창의적 확장이나 보강 금지`;
    }
  }

  private generatePageByPageSpecification(
    projectData: ProjectData,
    step3Result: Step3IntegratedResult,
    step4Result: Step4DesignResult
  ): string {
    if (!step3Result) {
      return '## 5. 페이지별 상세 구현 가이드\n\n⚠️ Step 3 데이터가 없어 페이지별 명세를 생성할 수 없습니다.';
    }

    const pageSpecs = projectData.pages.map((page, index) => {
      const step3Page = step3Result.pages[index];
      const step4Page = step4Result?.pages?.find(p => p.pageNumber === page.pageNumber);

      // Step3에서 생성된 fullDescription을 우선적으로 사용
      const pageContent = step3Page?.fullDescription ||
        `${page.topic}에 대한 기본 교육 내용입니다.\n- 주제: ${page.topic}\n- 설명: ${page.description || '페이지 설명'}`;

      return `## 페이지 ${index + 1}: ${page.topic}

### 1. 페이지 구성 및 내용
\`\`\`
${pageContent}
\`\`\`

### 2. 애니메이션 및 상호작용
${this.generateInteractionAndAnimationSpecification(step4Page)}

### 3. 이미지 명세
${this.generateImageSpecification(step3Page, step4Page, index)}`;
    });

    return `## 5. 페이지별 상세 구현 가이드

${pageSpecs.join('\n\n')}`;
  }

  private generateInteractionAndAnimationSpecification(step4Page: any): string {
    if (!step4Page) {
      return '기본적인 호버 효과와 페이드인 애니메이션을 구현하세요.';
    }

    let spec = '';

    if (step4Page.animationDescription) {
      spec += `**🎬 애니메이션 구현 지침**\n\n${step4Page.animationDescription}\n\n`;
    }

    if (step4Page.interactionDescription) {
      spec += `**⚡ 상호작용 구현 지침**\n\n${step4Page.interactionDescription}\n\n`;
    }

    if (!spec) {
      spec = `**기본 상호작용 구현**
- 페이지 로드 시 순차적 페이드인 애니메이션
- 카드 요소에 호버 효과
- 접근성 고려 (prefers-reduced-motion 지원)`;
    }

    return spec;
  }

  private generateImageSpecification(step3Page: any, _step4Page: any, pageIndex: number): string {
    if (!step3Page?.mediaAssets || step3Page.mediaAssets.length === 0) {
      return '이미지가 없습니다.';
    }

    const imageSpecs = step3Page.mediaAssets.map((img: any, imgIndex: number) => {
      const sizeGuide = img.sizeGuide || '600x400';
      const dimensions = sizeGuide.match(/(\d+)[×x](\d+)/);
      const placeholderUrl = dimensions
        ? `https://via.placeholder.com/${dimensions[1]}x${dimensions[2]}/cccccc/666666?text=${encodeURIComponent((img.fileName || 'image').replace('.png', ''))}`
        : 'https://via.placeholder.com/600x400/cccccc/666666?text=Image';

      return `**${imgIndex + 1}. ${img.fileName}**
- **파일 경로**: \`${img.path || `./image/page${pageIndex + 1}/${img.fileName}`}\`
- **크기**: ${img.sizeGuide || '600x400px'}
- **용도**: ${img.purpose || '교육용 이미지'}
- **설명**: ${img.description || '교육 콘텐츠 시각화'}
- **플레이스홀더**: \`${placeholderUrl}\``;
    });

    return imageSpecs.join('\n\n');
  }

  private generateCSSSpecification(): string {
    return `## 6. CSS 및 JavaScript 구현 가이드

### CSS 구현 지침
- **공통 스타일 파일**: css/style.css에 색상 변수, 폰트, 공통 컴포넌트 스타일 정의
- **페이지별 스타일**: 각 HTML 파일의 <head> 내 <style> 태그에 고유 레이아웃 구현
- **디자인 시스템 준수**: 위에 정의된 색상 팔레트와 타이포그래피 시스템 일관 적용

### JavaScript 구현 지침
- **상호작용 스크립트**: js/script.js에 모든 페이지 공통 기능 구현
- **접근성 고려**: 키보드 네비게이션, prefers-reduced-motion 지원`;
  }

  private generateImagePromptSection(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3Result: Step3IntegratedResult
  ): string {
    if (!step3Result) return '';

    const imagePrompts: string[] = [];

    step3Result.pages.forEach((page, pageIndex) => {
      if (page.mediaAssets && page.mediaAssets.length > 0) {
        page.mediaAssets.forEach((image, imageIndex) => {
          imagePrompts.push(`### 이미지 ${pageIndex + 1}-${imageIndex + 1}: ${image.fileName}

**AI 생성 프롬프트:**
${image.aiPrompt || '기본 이미지 생성 프롬프트'}

**디자인 가이드라인:**
- 무드: ${visualIdentity.moodAndTone.join(', ')}
- 색상 팔레트: 주색상 ${visualIdentity.colorPalette.primary}, 보조색상 ${visualIdentity.colorPalette.secondary}
- 교육 대상: ${projectData.targetAudience}
- 해상도: ${image.sizeGuide || '600x400px'}
- 접근성: ${image.accessibility?.altText || image.alt || '교육용 이미지'}`);
        });
      }
    });

    if (imagePrompts.length === 0) {
      return `## 7. 이미지 생성 명세서

이 프로젝트는 HTML/CSS 기반 시각화로 설계되어 별도의 이미지가 필요하지 않습니다.`;
    }

    return `## 7. 이미지 생성 명세서

아래의 이미지들을 AI 이미지 생성 도구를 사용하여 생성하고,
지정된 경로에 저장한 후 HTML에서 참조하세요.

${imagePrompts.join('\n\n---\n\n')}`;
  }

  private generateProjectStructureGuide(
    projectData: ProjectData,
    _step3Result: Step3IntegratedResult
  ): string {
    return `## 8. 프로젝트 폴더 구조 및 개발 가이드라인

### 🛠️ 권장 프로젝트 구조
\`\`\`
project-root/
├── page1.html          # 첫 번째 페이지
├── page2.html          # 두 번째 페이지
├── page3.html          # 세 번째 페이지
${projectData.pages.length > 3 ? `├── page4.html          # 네 번째 페이지` : ''}
├── css/
│   └── style.css       # 폰트, 색상 등 모든 공통 스타일
├── js/
│   └── script.js       # 모든 상호작용 관련 JavaScript
└── image/
    ├── page1/
    ├── page2/
    └── page3/
\`\`\`

### 🚫 절대 금지사항
- **절대 금지**: 페이지 간 네비게이션 메뉴 추가
- **절대 금지**: 이전/다음 버튼 또는 페이지 이동 기능
- **절대 금지**: 페이지 번호 표시 또는 진행률 표시`;
  }

  private generateImplementationGuidelines(): string {
    return `## 🚀 구현 가이드라인

### ⚠️ 필수 준수사항
1. **개별 파일 생성**: 각 페이지를 page1.html, page2.html, page3.html... 형태로 분리
2. **네비게이션 금지**: 어떤 형태의 페이지 이동 기능도 구현하지 마세요
3. **독립적 동작**: 각 HTML 파일은 완전히 독립적으로 동작해야 합니다

### 🚫 절대 구현하지 말아야 할 기능
- 페이지 간 이동 링크 또는 버튼
- 이전/다음 페이지 네비게이션
- 페이지 번호 표시 또는 진행률 바
- 페이지 목록 또는 메뉴

### 📷 이미지 플레이스홀더 구현 지침
**중요**: 실제 이미지 파일을 받기 전까지는 플레이스홀더를 사용하되, 반드시 실제 이미지 크기를 반영해야 합니다.

**플레이스홀더 구현 방법**:
1. **크기 고정**: 각 이미지의 정확한 픽셀 크기(width × height)를 CSS로 고정
2. **배치 유지**: 실제 이미지와 동일한 위치와 정렬 방식 적용
3. **플레이스홀더 서비스 활용**: \`https://via.placeholder.com/[width]x[height]/cccccc/666666?text=[설명]\``;
  }

  /**
   * Step4 디자인 명세 AI 생성 (원본 Step4DesignSpecificationService 로직 사용)
   */
  private async generateStep4DesignSpecification(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens,
    step3Result: Step3IntegratedResult
  ): Promise<Step4DesignResult> {
    try {
      console.log('🎯 Step4 디자인 명세 AI 생성 시작');

      // 페이지별 순차 처리 (원본 로직)
      const processedPages = await this.processAllPages(step3Result.pages, projectData, visualIdentity);

      // 글로벌 기능 생성
      const globalFeatures = this.generateGlobalFeatures(projectData.layoutMode);

      const result: Step4DesignResult = {
        layoutMode: step3Result.layoutMode,
        pages: processedPages,
        overallSummary: '접근성과 교육적 효과를 고려한 상호작용 디자인 명세가 생성되었습니다.',
        globalFeatures,
        generatedAt: new Date()
      };

      console.log('✅ Step4 디자인 명세 생성 완료:', {
        페이지수: result.pages.length,
        전체요약: !!result.overallSummary
      });

      return result;

    } catch (error) {
      console.error('❌ Step4 디자인 명세 생성 실패:', error);

      // 폴백으로 기본 디자인 명세 반환
      return this.generateFallbackStep4Result(step3Result);
    }
  }

  /**
   * 모든 페이지 처리 (원본 Step4 로직)
   */
  private async processAllPages(
    step3Pages: any[],
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<any[]> {
    console.log(`🚀 Step4: ${step3Pages.length}개 페이지 병렬 처리 시작`);

    // 병렬 처리를 위한 Promise 배열 생성
    const pagePromises = step3Pages.map(async (page, i) => {
      try {
        console.log(`🔄 페이지 ${page.pageNumber} 처리 시작`);
        const result = await this.processPage(page, projectData, visualIdentity);
        console.log(`✅ 페이지 ${page.pageNumber} 처리 완료`);
        return result;

      } catch (error) {
        console.error(`❌ 페이지 ${page.pageNumber} 처리 실패:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createErrorPageResult(page, errorMessage);
      }
    });

    // 모든 페이지를 병렬로 처리
    const results = await Promise.all(pagePromises);
    console.log(`🎉 Step4: ${step3Pages.length}개 페이지 병렬 처리 완료`);

    return results;
  }

  /**
   * 개별 페이지 처리 (원본 Step4 로직)
   */
  private async processPage(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<any> {
    try {
      console.log('🎯 텍스트 기반 Step4 페이지 생성 시작');

      // AI 프롬프트 생성 (원본 Step4 로직)
      const prompt = this.createStep4Prompt(step3PageData, projectData, visualIdentity);

      // AI 호출 (원본 방식 사용)
      const response = await this._openAIService.generateResponse(prompt);

      // JSON 응답 파싱
      const parsedData = this.parseJsonResponse(response);
      console.log('✅ Step4 파싱 완료:', parsedData);

      // 결과 어셈블리 (원본 로직)
      const result = this.assembleStep4FromJson(parsedData, step3PageData, projectData.layoutMode);
      console.log('🎯 Step4 최종 결과 조립 완료');

      return result;

    } catch (error) {
      console.error('❌ Step4 페이지 처리 실패:', error);
      // 폴백 처리
      return this.createErrorPageResult(step3PageData, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Step4 프롬프트 생성 (원본 로직)
   */
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

    // Step3 결과 사용 (fullDescription만 사용)
    const pageContent = step3PageData.fullDescription || `페이지 ${step3PageData.pageNumber}: ${step3PageData.pageTitle}`;

    // 레이아웃 모드에 따른 프롬프트 분기 (원본 로직)
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

  /**
   * JSON 응답 파싱 (원본 로직)
   */
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

  /**
   * JSON 데이터로부터 Step4 결과 조립 (원본 로직)
   */
  private assembleStep4FromJson(parsedData: any, step3PageData: any, layoutMode: 'fixed' | 'scrollable'): any {
    // 단순화된 결과 - AI 생성 텍스트만 사용
    return {
      pageNumber: step3PageData.pageNumber,
      animationDescription: parsedData.animationDescription || '기본 애니메이션: 요소들이 부드럽게 나타납니다.',
      interactionDescription: parsedData.interactionDescription || '기본 인터랙션: 호버 시 요소들이 반응합니다.',
      educationalFeatures: parsedData.educationalFeatures || [{
        type: '시각적 피드백',
        purpose: '학습자의 행동에 즉각적인 반응 제공',
        implementation: '정답/오답시 색상 변화와 애니메이션',
        expectedOutcome: '학습 몰입도 증가'
      }]
    };
  }

  /**
   * 글로벌 기능 생성 (원본 로직)
   */
  private generateGlobalFeatures(layoutMode: 'fixed' | 'scrollable'): any[] {
    return [
      '키보드 네비게이션 완전 지원',
      'prefers-reduced-motion 미디어 쿼리 지원',
      '고대비 모드 접근성',
      '터치 친화적 인터페이스'
    ];
  }

  /**
   * 에러 페이지 결과 생성 (원본 로직)
   */
  private createErrorPageResult(step3PageData: any, errorMessage: string): any {
    return {
      pageNumber: step3PageData.pageNumber,
      animationDescription: '페이지 로드 시 순차적 페이드인 애니메이션, 카드 요소에 호버 시 부드러운 확대 효과',
      interactionDescription: '모든 대화형 요소에 키보드 접근성 지원, 마우스 호버 시 시각적 피드백',
      educationalFeatures: [{
        type: '기본 상호작용',
        purpose: '기본적인 사용자 경험 제공',
        implementation: '표준 웹 접근성 가이드라인 준수',
        expectedOutcome: '안정적인 사용자 경험'
      }],
      error: errorMessage
    };
  }

  /**
   * 폴백 Step4 결과 생성
   */
  private generateFallbackStep4Result(step3Result: Step3IntegratedResult): Step4DesignResult {
    return {
      layoutMode: step3Result.layoutMode,
      pages: step3Result.pages.map(page => ({
        pageNumber: page.pageNumber,
        animationDescription: '페이지 로드 시 순차적 페이드인 애니메이션, 카드 요소에 호버 시 부드러운 확대 효과 (transform: scale(1.02)), 버튼 클릭 시 살짝 위로 올라가는 효과 (translateY(-2px))',
        interactionDescription: '모든 대화형 요소에 키보드 접근성 지원 (Tab, Enter, Space), 마우스 호버 시 시각적 피드백, 터치 기기를 위한 충분한 터치 영역 (44px 이상), 접근성을 위한 ARIA 라벨 제공',
        educationalFeatures: [
          {
            type: '시각적 피드백',
            purpose: '학습자의 행동에 즉각적인 반응 제공',
            implementation: '정답/오답시 색상 변화와 애니메이션',
            expectedOutcome: '학습 몰입도 증가'
          }
        ]
      })),
      overallSummary: '접근성과 교육적 효과를 고려한 상호작용 디자인 명세가 생성되었습니다. 모든 요소는 사용자 친화적이고 교육 목표에 부합하도록 설계되었습니다.',
      globalFeatures: [
        '키보드 네비게이션 완전 지원',
        'prefers-reduced-motion 미디어 쿼리 지원',
        '고대비 모드 접근성',
        '터치 친화적 인터페이스'
      ],
      generatedAt: new Date()
    };
  }
}