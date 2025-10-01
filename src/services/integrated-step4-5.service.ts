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
- **레이아웃 모드**: ${isScrollable ? ':scroll: 스크롤 가능 (가로 1600px, 세로 유연)' : ':triangular_ruler: 고정 크기 (1600x1000px)'}
- **콘텐츠 모드**: ${isEnhanced ? ':sparkles: AI 보강 모드 - AI가 내용을 창의적으로 확장' : ':memo: 원본 유지 모드 - 사용자가 입력한 내용만 사용'}
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
      // 스크롤 가능 + AI 보강 모드
      return `## 3. 핵심 개발 요구사항

### :scroll: 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1.  **가로 고정, 세로 유연**
    *   가로: 1600px 고정
    *   세로: 콘텐츠 양에 따라 자유롭게 확장
    *   \`overflow-x: hidden; overflow-y: auto;\` 적용
    *   최소 높이 1000px 유지

2.  **콘텐츠 우선 배치**
    *   콘텐츠의 자연스러운 흐름 유지
    *   적절한 여백으로 가독성 확보
    *   섹션 간 충분한 간격 유지
    *   길이 제한 없이 완전한 정보 전달

3.  **반응형 요소 설계**
    *   이미지는 최대 너비 제한 (max-width: 100%)
    *   긴 콘텐츠는 섹션별로 구분
    *   스크롤 진행에 따른 애니메이션 고려 가능

4.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

5.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
1.  **프로젝트 폴더 구조**: 다음과 같은 체계적인 폴더 구조로 결과물을 구성해주세요.
    *   \`/\` (root)
        *   \`page1.html\`, \`page2.html\`, ...
        *   \`css/\`
            *   \`style.css\` (폰트, 색상 등 모든 공통 스타일)
        *   \`js/\`
            *   \`script.js\` (모든 상호작용 관련 JavaScript)
        *   \`images/\`
            *   \`page1/\`
                *   \`1.png\`
            *   \`README.md\`
2.  **하이브리드 스타일링**:
    *   **공통 스타일**: \`css/style.css\`에는 폰트, 색상 변수, 공통 버튼 스타일 등 프로젝트 전반에 사용될 스타일을 정의하세요.
    *   **페이지 전용 스타일**: 각 HTML 파일의 \`<head>\` 안에 \`<style>\` 태그를 사용하여, 해당 페이지에만 적용되는 복잡하고 창의적인 레이아웃(Grid, Flexbox 등)을 자유롭게 작성하세요. 이를 통해 각 페이지의 디자인 품질을 극대화하세요.
3.  **완전히 독립된 페이지**: 각 페이지는 그 자체로 완결된 하나의 독립적인 웹페이지입니다. **절대로** 다른 페이지로 이동하는 링크, '다음'/'이전' 버튼, 메뉴, 또는 외부 사이트로 나가는 하이퍼링크를 포함해서는 안 됩니다.
4.  **이미지 관리**:
    *   **경로**: 이미지는 반드시 페이지별 하위 폴더에 저장하고, HTML에서는 \`<img src="./images/page1/1.png">\` 와 같은 상대 경로를 사용해야 합니다.
    *   **파일명 규칙**: 각 페이지별로 \`1.png\`, \`2.png\` 형태로 순차적으로 번호를 부여합니다"

### :sparkles: 디자인 및 애니메이션 가이드라인
1.  **디자인 시스템 준수**: 아래에 정의된 '디자인 시스템'의 색상, 타이포그래피, 스타일 가이드를 모든 페이지에서 일관되게 적용해주세요.
2.  **이미지 사용 최소화**: 학습 내용에 필수적인 이미지만 사용하세요. 의미 없는 장식용 이미지는 피하고, 여백과 타이포그래피를 활용해 디자인을 완성하세요.
3.  **애니메이션**:
    *   **방향성**: 모든 애니메이션은 학습자의 시선 흐름을 자연스럽게 유도해야 합니다. (예: 왼쪽에서 오른쪽으로, 위에서 아래로)
    *   **자연스러움**: \`transition: all 0.5s ease-in-out;\` 과 같이 부드러운 \`ease\` 함수를 사용하세요. 너무 빠르거나 갑작스러운 움직임은 피해주세요.`;
    } else if (isScrollable && !isEnhanced) {
      // 스크롤 가능 + 원본 유지 모드
      return `## 3. 핵심 개발 요구사항

### :scroll: 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1.  **가로 고정, 세로 유연**
    *   가로: 1600px 고정
    *   세로: 콘텐츠 양에 따라 자유롭게 확장
    *   \`overflow-x: hidden; overflow-y: auto;\` 적용
    *   최소 높이 1000px 유지

2.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

3.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**간결하고 효율적인 구현을 우선시합니다.**`;
    } else if (!isScrollable && isEnhanced) {
      // 고정 크기 + AI 보강 모드
      return `## 3. 핵심 개발 요구사항

### :triangular_ruler: 고정 크기 레이아웃 규칙 + AI 창의적 확장
**1600x1000px 고정 크기 내에서 AI가 창의적으로 콘텐츠를 확장합니다.**

1.  **:no_entry: 스크롤 절대 금지 규칙**
    *   \`overflow: hidden !important;\` 필수 적용
    *   절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
    *   모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2.  **콘텐츠 양 조절 필수**
    *   AI가 확장한 텍스트가 길면 요약하고 핵심만 유지
    *   이미지 크기를 조절하라
    *   여백과 패딩을 최적화하라
    *   **절대로 스크롤로 해결하려 하지 마라**

3.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

4.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**크기 제한을 엄격히 준수하면서도 창의적인 확장을 수행합니다.**`;
    } else {
      // 고정 크기 + 원본 유지 모드
      return `## 3. 핵심 개발 요구사항

### :no_entry: 스크롤 절대 금지 규칙
**이것은 가장 중요한 규칙입니다. 어떤 경우에도 타협 불가!**

1.  **컨테이너 내부 스크롤 완전 금지**
    *   \`overflow: hidden !important;\` 필수 적용
    *   절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
    *   모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2.  **콘텐츠 양 조절 필수**
    *   텍스트가 길면 줄이고 요약하라
    *   이미지 크기를 조절하라
    *   여백과 패딩을 최적화하라
    *   **절대로 스크롤로 해결하려 하지 마라**

3.  **레이아웃 최적화**
    *   모든 요소의 높이를 계산하여 1000px를 초과하지 않도록 조정
    *   padding은 컨테이너 크기 내에서 계산 (box-sizing: border-box 필수)
    *   콘텐츠가 많으면 그리드나 컬럼을 활용하여 가로로 배치

4.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

5.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**간결하고 효율적인 구현을 우선시합니다.**`;
    }
  }

  private generateContentRules(isEnhanced: boolean): string {
    if (isEnhanced) {
      return `## 4. 콘텐츠 생성 규칙

### :pushpin: 콘텐츠 생성 규칙

- **AI 보강 모드 활성화**: 내용을 창의적으로 확장하고 보강
- **학습 효과 극대화**: 추가 설명, 예시, 시각 자료 적극 활용
- **풍부한 콘텐츠**: 학습자의 이해를 돕는 다양한 요소 추가
- **창의적 표현**: 교육적 가치를 높이는 콘텐츠 생성`;
    } else {
      return `## 4. 콘텐츠 생성 규칙

### :pushpin: 콘텐츠 생성 규칙

- **원본 유지 모드 활성화**: 사용자가 입력한 내용만을 정확히 사용
- **추가 내용 생성 금지**: AI의 창의적 확장이나 보강 금지
- **레이아웃 중심**: 주어진 내용을 효과적으로 배치하는 것에 집중
- **시각적 표현 최적화**: 제한된 내용으로도 효과적인 학습 경험 제공`;
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

      const layoutNarrative = step3Page?.layoutNarrative?.trim();
      const visualGuidelines = step3Page?.visualGuidelines?.trim();
      const implementationNotes = step3Page?.implementationNotes?.trim();
      const originalScript = step3Page?.originalScript?.trim();

      const sectionBlocks = [
        originalScript && `**교안 본문**\n${originalScript}`,
        layoutNarrative && `**레이아웃 스토리**\n${layoutNarrative}`,
        visualGuidelines && `**비주얼 가이드**\n${visualGuidelines}`,
        implementationNotes && `**구현 노트**\n${implementationNotes}`
      ].filter(Boolean);

      const pageContent = sectionBlocks.length > 0
        ? sectionBlocks.join('\n\n')
        : (step3Page?.fullDescription
          || `${page.topic}에 대한 기본 교육 내용입니다.\n- 주제: ${page.topic}\n- 설명: ${page.description || '페이지 설명'}`);

      const isEnhanced = projectData.contentMode === 'enhanced';

      if (isEnhanced) {
        // AI 보강 모드 - Step3의 fullDescription을 그대로 활용
        return `## 페이지 ${index + 1}: ${page.topic}

### 1. 페이지 구성 및 내용

${pageContent}

**레이아웃 구현 지침:**
- 캔버스: 너비 1600px 고정, 높이 가변(세로 스크롤)
- 좌우 여백(Safe Area): 120px(좌), 120px(우) — 콘텐츠 최대 폭 1360px
- 컬러: Primary, Secondary, Accent 색상을 활용한 조화로운 배색
- 폰트 크기: 모든 텍스트 18pt 이상 준수
- 라운딩/그림자: 부드럽고 가벼운 느낌의 카드 컴포넌트

**접근성 및 가독성:**
- 최소 폰트 크기 준수: 본문 18-20pt, 부제목 22-24pt, 제목 28-36pt
- 대비: 본문 텍스트와 배경 대비비 4.5:1 이상 유지
- 줄 길이: 본문 60–80자 폭 유지
- 라인하이트: 본문 1.5, 제목 1.2

### 2. 페이지에 사용될 이미지
${this.generateImageSpecification(step3Page, step4Page, index)}

### 3. 애니메이션 및 상호작용
${this.generateInteractionAndAnimationSpecification(step4Page)}`;
      } else {
        // 원본 유지 모드 - 간결한 구성
        return `## 페이지 ${index + 1}: ${page.topic}

### 1. 페이지 구성 및 내용

${pageContent}

### 2. 페이지에 사용될 이미지
${this.generateImageSpecification(step3Page, step4Page, index)}

### 3. 애니메이션 및 상호작용
${this.generateInteractionAndAnimationSpecification(step4Page)}`;
      }
    });

    return `## 4. 페이지별 상세 구현 가이드

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
   - **배치 위치**: ${img.placement?.position || '메인 영역'}
   - **용도**: ${img.purpose || '교육용 이미지'}
   - **설명**: ${img.description || '교육 콘텐츠 시각화'}
   - **접근성**: ${img.accessibility?.altText || img.alt || '교육용 이미지'}
   - **플레이스홀더**: \`${placeholderUrl}\``;
    });

    return imageSpecs.join('\n\n');
  }

  private generateCSSSpecification(): string {
    return `## 5. CSS 및 JavaScript 구현 가이드

### CSS 구현 지침
- **공통 스타일 파일**: css/style.css에 색상 변수, 폰트, 공통 컴포넌트 스타일 정의
- **페이지별 스타일**: 각 HTML 파일의 <head> 내 <style> 태그에 고유 레이아웃 구현
- **디자인 시스템 준수**: 위에 정의된 색상 팔레트와 타이포그래피 시스템 일관 적용
- **반응형 요소**: 이미지는 max-width: 100%, 적절한 여백과 간격 유지

### JavaScript 구현 지침
- **상호작용 스크립트**: js/script.js에 모든 페이지 공통 기능 구현
- **페이지별 기능**: 필요시 각 HTML 파일에 페이지 전용 스크립트 추가
- **접근성 고려**: 키보드 네비게이션, prefers-reduced-motion 지원
- **성능 최적화**: transform/opacity 기반 애니메이션, 부드러운 전환 효과`;
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
      return `## 6. 이미지 생성 명세서

이 프로젝트는 HTML/CSS 기반 시각화로 설계되어 별도의 이미지가 필요하지 않습니다.
모든 시각적 요소는 CSS로 구현되도록 설계되었습니다.`;
    }

    return `## 6. 이미지 생성 명세서

아래의 이미지들을 AI 이미지 생성 도구(DALL-E, Midjourney, Stable Diffusion 등)를 사용하여 생성하고,
지정된 경로에 저장한 후 HTML에서 참조하세요.

${imagePrompts.join('\n\n---\n\n')}`;
  }

  private generateProjectStructureGuide(
    projectData: ProjectData,
    step3Result: Step3IntegratedResult
  ): string {
    return `## 7. 프로젝트 폴더 구조 및 개발 가이드라인

### 🛠️ 권장 프로젝트 구조
다음과 같은 체계적인 폴더 구조로 결과물을 구성해주세요:

\`\`\`
project-root/
├── page1.html          # 첫 번째 페이지
├── page2.html          # 두 번째 페이지
├── page3.html          # 세 번째 페이지
${projectData.pages.length > 3 ? `├── page4.html          # 네 번째 페이지\n${projectData.pages.slice(4).map((_, i) => `├── page${i + 5}.html          # ${i + 5}번째 페이지`).join('\n')}` : ''}
├── css/
│   └── style.css       # 폰트, 색상 등 모든 공통 스타일
├── js/
│   └── script.js       # 모든 상호작용 관련 JavaScript
├── image/
${step3Result ? step3Result.pages.map((page, pageIndex) => {
  const allImages: string[] = [];

  // mediaAssets에서 이미지 수집
  if (page.mediaAssets && page.mediaAssets.length > 0) {
    page.mediaAssets.forEach(img => {
      if (img.fileName) {
        allImages.push(`│   │   ├── ${img.fileName}`);
      }
    });
  }

  // content.images에서 이미지 수집
  if (page.content && page.content.images && page.content.images.length > 0) {
    page.content.images.forEach(img => {
      const fileName = img.filename || img.fileName;
      if (fileName && !allImages.some(existingImg => existingImg.includes(fileName))) {
        allImages.push(`│   │   ├── ${fileName}`);
      }
    });
  }

  if (allImages.length > 0) {
    return `│   ├── page${pageIndex + 1}/\n${allImages.join('\n')}`;
  }
  return `│   ├── page${pageIndex + 1}/    # 이미지 없음 (HTML/CSS 기반)`;
}).join('\n') : '│   └── (이미지 폴더는 실제 이미지가 있는 페이지만 생성)'}
└── README.md           # 프로젝트 설명서 (선택사항)
\`\`\`

**📝 주요 변경사항:**
- 이미지 폴더명을 \`images/\`에서 \`image/\`로 변경 (Step3 경로와 일치)
- 각 페이지별 이미지 폴더는 실제 이미지가 있을 때만 생성
- HTML/CSS 기반 시각화가 우선이며, 이미지는 보조적 역할

### 🎨 하이브리드 스타일링 전략

#### 1. **공통 스타일 (css/style.css)**
- **폰트, 색상 변수**: 프로젝트 전반에 사용될 디자인 토큰
- **공통 컴포넌트 스타일**: 버튼, 카드, 기본 타이포그래피 등
- **전역 리셋 및 기본 설정**: CSS Reset, box-sizing 등

#### 2. **페이지 전용 스타일 (각 HTML의 \`<style>\` 태그)**
- **복잡한 레이아웃**: Grid, Flexbox를 활용한 창의적 배치
- **페이지별 특수 애니메이션**: CSS transitions, transforms
- **반응형 미디어 쿼리**: 해당 페이지만의 특별한 반응형 로직
- **고유한 시각적 효과**: 그라데이션, 그림자, 특수 효과

### ✨ 디자인 및 애니메이션 가이드라인

1. **디자인 시스템 준수**: 위에 정의된 '디자인 시스템'의 색상, 타이포그래피, 스타일 가이드를 모든 페이지에서 일관되게 적용해주세요.

2. **이미지 사용 최소화**: 학습 내용에 필수적인 이미지만 사용하세요. 의미 없는 장식용 이미지는 피하고, 여백과 타이포그래피를 활용해 디자인을 완성하세요.

3. **애니메이션**:
   - **방향성**: 모든 애니메이션은 학습자의 시선 흐름을 자연스럽게 유도해야 합니다. (예: 왼쪽에서 오른쪽으로, 위에서 아래로)
   - **자연스러움**: \`transition: all 0.5s ease-in-out;\` 과 같이 부드러운 \`ease\` 함수를 사용하세요. 너무 빠르거나 갑작스러운 움직임은 피해주세요.

### 🚫 절대 금지사항
- **절대 금지**: 페이지 간 네비게이션 메뉴 추가
- **절대 금지**: 이전/다음 버튼 또는 페이지 이동 기능
- **절대 금지**: 페이지 번호 표시 또는 진행률 표시
- **절대 금지**: 모든 페이지를 하나의 HTML 파일에 통합

### 배포 전 체크리스트
- [ ] 각 페이지가 개별 HTML 파일로 분리되었는지 확인
- [ ] 네비게이션 요소가 포함되지 않았는지 확인
- [ ] 모든 이미지 파일이 올바른 경로에 배치되었는지 확인
- [ ] 폰트 로딩이 정상적으로 작동하는지 확인
- [ ] 반응형 디자인이 모바일/태블릿에서 정상 작동하는지 확인
- [ ] 접근성 기준 (alt 속성, ARIA 라벨 등) 준수 확인
- [ ] 브라우저 호환성 테스트 완료`;
  }

  private generateImplementationGuidelines(): string {
    return `## 🚀 구현 가이드라인

### ⚠️ 필수 준수사항
1. **개별 파일 생성**: 각 페이지를 1.html, 2.html, 3.html... 형태로 분리
2. **네비게이션 금지**: 어떤 형태의 페이지 이동 기능도 구현하지 마세요
3. **독립적 동작**: 각 HTML 파일은 완전히 독립적으로 동작해야 합니다

### 개발 우선순위
1. **개별 HTML 파일 생성**: 각 페이지별로 독립된 HTML 파일 작성
2. **공통 CSS/JS 파일**: styles.css와 script.js는 모든 페이지가 공유
3. **콘텐츠 구현**: 각 페이지의 고유 콘텐츠만 포함
4. **이미지 플레이스홀더 설정**: 실제 이미지 크기에 맞는 플레이스홀더 구현
5. **상호작용 구현**: JavaScript를 사용한 교육적 기능 추가 (페이지 내에서만)
6. **최적화 및 테스트**: 각 파일별로 독립적인 테스트 수행

### 🚫 절대 구현하지 말아야 할 기능
- 페이지 간 이동 링크 또는 버튼
- 이전/다음 페이지 네비게이션
- 페이지 번호 표시 또는 진행률 바
- 페이지 목록 또는 메뉴
- 모든 페이지를 하나의 파일에 통합하는 구조

### 📷 이미지 플레이스홀더 구현 지침
**중요**: 실제 이미지 파일을 받기 전까지는 플레이스홀더를 사용하되, 반드시 실제 이미지 크기를 반영해야 합니다.

**플레이스홀더 구현 방법**:
1. **크기 고정**: 각 이미지의 정확한 픽셀 크기(width × height)를 CSS로 고정
2. **배치 유지**: 실제 이미지와 동일한 위치와 정렬 방식 적용
3. **플레이스홀더 서비스 활용**:
   - 예시: \`https://via.placeholder.com/800x600/cccccc/666666?text=Image+Name\`
   - 형식: \`https://via.placeholder.com/[width]x[height]/[배경색]/[텍스트색]?text=[설명]\`
4. **Step3 경로 준수**: 이미지 폴더는 \`image/\` (복수형 아님)로 설정하여 Step3 경로와 일치시키세요


### 성능 최적화 고려사항
- **공통 리소스 활용**: styles.css, script.js, image/ 폴더를 모든 페이지가 공유
- **플레이스홀더 최적화**: 실제 이미지 크기를 정확히 반영하여 레이아웃 시프트 방지
- **폰트 최적화**: 필요한 문자셋만 로드, font-display: swap 사용
- **CSS/JS 최소화**: 불필요한 코드 제거, 파일 크기 최적화

### 접근성 준수사항
- **대체 텍스트**: 모든 이미지(플레이스홀더 포함)에 의미 있는 alt 속성 제공
- **키보드 접근**: Tab 키를 통한 페이지 내 요소 순차적 접근 가능
- **색상 대비**: WCAG 2.1 AA 기준 준수 (4.5:1 이상)
- **ARIA 라벨**: 스크린 리더 사용자를 위한 적절한 라벨 제공`;
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
      const { content } = await this._openAIService.generateCompletion(
        prompt,
        'Step4-Design-Spec'
      );

      // JSON 응답 파싱
      const parsedData = this.parseJsonResponse(content || '');
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
   * Step4 프롬프트 생성 (콘텐츠 모드만 분기)
   */
  private createStep4Prompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): string {
    // 기본 변수 추출
    const variables = this.extractPromptVariables(step3PageData, projectData, visualIdentity);

    // 콘텐츠 모드에 따른 템플릿 선택
    const contentMode = this.normalizeContentMode(projectData.contentMode); // 'restricted' | 'enhanced'

    return this.generatePromptFromTemplate(variables, contentMode);
  }

  /**
   * 콘텐츠 모드 정규화
   */
  private normalizeContentMode(contentMode: 'enhanced' | 'restricted'): 'restricted' | 'enhanced' {
    // enhanced와 restricted 두 모드만 지원
    return contentMode === 'enhanced' ? 'enhanced' : 'restricted';
  }

  /**
   * 프롬프트 변수 추출
   */
  private extractPromptVariables(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): any {
    const moodAndTone = Array.isArray(visualIdentity.moodAndTone)
      ? visualIdentity.moodAndTone.join(', ')
      : visualIdentity.moodAndTone;

    // 전체 페이지 구성 개요 (step3 앞 100자 요약)
    const allPages = projectData.pages.map((p, index) => {
      if (step3PageData.pageNumber === p.pageNumber) {
        const preview = step3PageData.fullDescription
          ? step3PageData.fullDescription.substring(0, 100) + '...'
          : '현재 페이지';
        return `페이지 ${p.pageNumber} (${p.topic}): ${preview}`;
      }
      return `페이지 ${p.pageNumber} (${p.topic}): ...`;
    }).join('\n');

    // Step3 결과 전문
    const pageContent = step3PageData.fullDescription || `페이지 ${step3PageData.pageNumber}: ${step3PageData.pageTitle}`;

    return {
      moodAndTone,
      primaryColor: visualIdentity.colorPalette?.primary || '#3B82F6',
      componentStyle: visualIdentity.componentStyle || '기본 컴포넌트 스타일',
      projectTitle: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      additionalRequirements: projectData.additionalRequirements || '기본적인 교육용 디자인',
      currentPageNumber: step3PageData.pageNumber,
      currentPageTitle: step3PageData.pageTitle,
      allPages,
      pageContent
    };
  }

  /**
   * 콘텐츠 모드 기반 템플릿 생성
   */
  private generatePromptFromTemplate(
    variables: any,
    contentMode: 'restricted' | 'enhanced'
  ): string {
    // 콘텐츠 모드별 상단 섹션
    const modeDescription = contentMode === 'enhanced'
      ? `### ✨ AI 보강 모드
창의적인 애니메이션과 상호작용을 자유롭게 제안하세요. 학습 효과를 높이는 추가적인 시각 효과나 인터랙션을 적극적으로 제안할 수 있습니다.`
      : `### ⚠️ 원본 유지 모드
이 프로젝트는 사용자가 제공한 내용만을 사용합니다. 하지만 애니메이션과 상호작용은 반드시 제안해야 합니다! 기존 내용을 효과적으로 전달하기 위한 애니메이션과 인터랙션을 상세히 설명하세요. 추가 콘텐츠 생성은 제한되지만, 시각적 효과와 상호작용은 풍부하게 제안하세요.`;

    // 템플릿 조합
    return [
      `당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.`,

      modeDescription,

      `### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${variables.moodAndTone}
- **색상**: Primary-${variables.primaryColor}
- **컴포넌트 스타일**: ${variables.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라`,

      `### 📍 전체 페이지 구성 개요
${variables.allPages}`,

      `### 📝 프로젝트 정보
- 프로젝트: ${variables.projectTitle}
- 대상: ${variables.targetAudience}
- 전체적인 분위기 및 스타일 제안: ${variables.additionalRequirements}
- 현재 페이지 ${variables.currentPageNumber}: ${variables.currentPageTitle}`,

      `### 페이지 구성안:
${variables.pageContent}`,

      `### 제안 가이드라인
- **목적 지향적 제안**: "애니메이션을 추가하라"가 아니라, "콘텐츠의 스토리를 강화하고, 사용자의 이해를 돕는 점진적 정보 공개(Progressive Disclosure)를 위한 애니메이션을 제안하라."
- **미세 상호작용**: 버튼 호버 효과와 같은 미세 상호작용(Micro-interaction)으로 페이지에 생동감을 불어넣는 아이디어를 포함하세요.
- **분위기 일관성**: 제안하는 모든 효과는 정의된 '분위기'(${variables.moodAndTone})와 일치해야 합니다.
- **전체 일관성**: 다른 페이지들과 일관된 애니메이션 스타일을 유지하되, 각 페이지의 특색을 살려주세요.`,

      `### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.`,

      `### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}`
    ].join('\n\n');
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
