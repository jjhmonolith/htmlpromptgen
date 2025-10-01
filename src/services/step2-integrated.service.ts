import { OpenAIService } from './openai.service';
import { ProjectData } from '../types/workflow.types';
import { Step2NewResult, Step2IntegratedInput, PageContentResult } from '../types/step2-new.types';
import { Step2ResponseParser } from './step2-response-parser';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

class Step2IntegratedFallbackProvider implements FallbackProvider<Step2NewResult> {
  constructor(private input: Step2IntegratedInput) {}

  createFallback(): Step2NewResult {
    // 기본 비주얼 아이덴티티 생성
    const visualIdentity = {
      moodAndTone: ['명료', '친근', '탐구', '안정'],
      colorPalette: {
        primary: '#004D99',
        secondary: '#E9F4FF',
        accent: '#FFCC00',
        text: '#0F172A',
        background: '#FFFFFF'
      },
      typography: {
        headingFont: 'Pretendard',
        bodyFont: 'Noto Sans KR',
        baseSize: '20pt',
        headingStyle: '명료하고 신뢰할 수 있는',
        bodyStyle: '편안하게 읽기 쉬운'
      },
      componentStyle: '라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선'
    };

    const designTokens = {
      viewport: this.input.layoutMode === 'fixed'
        ? { width: 1600, height: 1000 }
        : { width: 1600 },
      safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
      grid: { columns: 12, gap: 24 },
      spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
      radius: { sm: 8, md: 16, lg: 24 },
      elevation: {
        low: "0 2px 4px rgba(0, 0, 0, 0.1)",
        medium: "0 4px 8px rgba(0, 0, 0, 0.15)",
        high: "0 8px 16px rgba(0, 0, 0, 0.2)"
      },
      zIndex: { base: 0, image: 10, card: 20, text: 30 }
    };

    // 기본 페이지 콘텐츠 생성
    const pageContents: PageContentResult[] = this.input.projectData.pages.map((page, index) => ({
      pageId: page.id,
      pageNumber: page.pageNumber,
      pageTitle: page.topic,
      fullTextContent: `${page.topic}에 대한 핵심 학습 내용을 다룹니다. ${page.description || '이 주제에 대해 자세히 알아보며 실용적인 지식을 습득할 수 있습니다.'} 단계적으로 접근하여 이해도를 높이고, 실제 적용 가능한 내용으로 구성되어 있습니다.`,
      learningGoal: `${page.topic}의 핵심 개념을 이해하고 활용할 수 있다`,
      keyMessage: `${page.topic}에 대한 실용적 지식 습득`,
      imageDescription: `${page.topic}을 시각적으로 설명하는 교육용 자료`,
      interactionHint: `${page.topic} 관련 퀴즈나 체크리스트`
    }));

    return {
      visualIdentity,
      designTokens,
      pageContents,
      overallFlow: `${this.input.projectData.pages.length}개 페이지를 통한 체계적 학습 진행`,
      educationalStrategy: `${this.input.projectData.targetAudience}을 위한 단계별 학습 접근법`,
      generatedAt: new Date(),
      processingTime: 0
    };
  }
}

export class Step2IntegratedService {
  private errorHandler = createStepErrorHandler('Step2Integrated');
  private parser = new Step2ResponseParser();

  constructor(private openAIService: OpenAIService) {}

  async generateContentAndVisualIdentity(
    projectData: ProjectData,
    layoutMode: 'fixed' | 'scrollable',
    contentMode: 'enhanced' | 'restricted'
  ): Promise<Step2NewResult> {
    const input: Step2IntegratedInput = { projectData, layoutMode, contentMode };

    // 입력 검증
    this.errorHandler.validateInput('projectData', projectData, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('pages', projectData.pages, (pages) => Array.isArray(pages) && pages.length > 0);

    const fallbackProvider = new Step2IntegratedFallbackProvider(input);
    const startTime = Date.now();

    return this.errorHandler.handle(
      async () => {
        console.log('🎨📚 Step2 통합: 비주얼 아이덴티티 + 교안 텍스트 생성 시작');
        console.log('📋 입력 프로젝트 데이터:', projectData);
        console.log('🎯 레이아웃 모드:', layoutMode, '| 콘텐츠 모드:', contentMode);

        const prompt = this.createStep2IntegratedPrompt(projectData, layoutMode, contentMode);
        console.log('📝 Step2 통합 프롬프트 생성 완료');

        console.log('🚀 OpenAI API 호출 시작...');
        const response = await this.openAIService.generateCompletion(
          prompt,
          'Step2Integrated',
          'gpt-4o-mini'
        );

        console.log('✅ OpenAI API 응답 수신');

        // API 응답 검증
        this.errorHandler.validateApiResponse(response);

        // 텍스트 파싱
        const parsedResult = this.parser.parseResponse(response.content, projectData, layoutMode);
        console.log('✅ Step2 통합 파싱 완료:', parsedResult);

        const processingTime = Date.now() - startTime;
        const finalResult = {
          ...parsedResult,
          processingTime,
          generatedAt: new Date()
        };

        console.log('🎯 Step2 통합 최종 결과 조립 완료');
        return finalResult;
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );
  }

  private createStep2IntegratedPrompt(
    projectData: ProjectData,
    layoutMode: 'fixed' | 'scrollable',
    contentMode: 'enhanced' | 'restricted'
  ): string {
    // 콘텐츠 모드별 지시사항 - 교육학적 관점으로 개선
    const contentModeInstruction = contentMode === 'enhanced'
      ? '교육 효과를 극대화하기 위해 제공된 주제를 확장하여 작성하세요. 학습자 이해를 돕는 구체적 예시, 단계별 설명, 실용적 적용 방법을 포함하세요.'
      : '제공된 주제의 핵심 요소만을 추출하여 교안에 적합한 형태로 재구성하세요. 불필요한 부연설명 없이 핵심 포인트 중심으로 작성하세요.';

    // 레이아웃 모드별 제약사항 - 교안 특성 반영
    const layoutConstraints = layoutMode === 'fixed'
      ? 'PPT 슬라이드처럼 핵심 포인트 중심의 간결한 구성이 필요합니다. 각 페이지는 독립적이면서 완결된 학습 단위가 되어야 합니다.'
      : '스크롤 가능한 교안이므로 섹션별로 체계적으로 구성하여 자연스러운 학습 흐름을 만드세요. 적절한 단락 구분과 위계를 고려하세요.';

    return `당신은 교육 콘텐츠 설계 전문가입니다.
교육학적 관점에서 효과적인 학습을 위한 교안 콘텐츠와 비주얼 아이덴티티를 통합적으로 설계하세요.

## 📚 프로젝트 정보
- **제목**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃 모드**: ${layoutMode === 'fixed' ? '1600×1000px 고정 슬라이드' : '1600px 너비 스크롤형'}
- **콘텐츠 모드**: ${contentMode === 'enhanced' ? 'AI 창의적 확장 모드' : '입력 내용 기반 제한 모드'}
- **총 페이지 수**: ${projectData.pages.length}개

## 📖 페이지 구성
${projectData.pages.map((page, index) => `
**${index + 1}. ${page.topic}**
   ${page.description ? `- 설명: ${page.description}` : '- 설명: 없음'}
`).join('\n')}

${projectData.suggestions?.length ? `
## 💡 추가 제안사항
${projectData.suggestions.join(' ')}
` : ''}

## 🎯 작성 지침
- **콘텐츠 접근**: ${contentModeInstruction}
- **레이아웃 고려**: ${layoutConstraints}
- **교육적 목표**: 각 페이지가 명확한 학습 목표를 가지고 순차적으로 연결되어야 합니다.
- **대상 맞춤**: ${projectData.targetAudience}에게 적합한 언어와 표현을 사용하세요.

---

## 📝 출력 형식

### A. 각 페이지별 교안 작성
각 페이지마다 다음 형식을 **정확히** 지켜서 작성해주세요:

${this.createPageFormatByLayoutMode(projectData, layoutMode, contentMode)}

### B. 비주얼 아이덴티티
프로젝트의 성격과 대상에 맞는 비주얼 디자인을 다음 형식으로 생성해주세요:

비주얼_분위기: [분위기1, 분위기2, 분위기3]
색상_주요: #000000
색상_보조: #000000
색상_강조: #000000
색상_텍스트: #000000
색상_배경: #000000
글꼴_제목: [제목용 폰트명]
글꼴_본문: [본문용 폰트명]
기본크기: [16pt/18pt/20pt 중 선택]
컴포넌트스타일: [전체적인 컴포넌트 디자인 스타일을 설명]

### C. 전체 구성 정보
전체흐름: [페이지들이 어떻게 연결되고 진행되는지 2-3줄로 설명]
교육전략: [이 프로젝트의 전체적인 교육 접근법과 특징을 2-3줄로 요약]

---

**중요**: 위의 형식을 정확히 지켜주세요. 특히 "=== 페이지 X: 제목 ===" 형식과 각 필드명을 정확히 사용해주세요. 파싱 시 이 형식에 의존합니다.`;
  }

  private createPageFormatByLayoutMode(
    projectData: ProjectData,
    layoutMode: 'fixed' | 'scrollable',
    contentMode: 'enhanced' | 'restricted'
  ): string {
    if (layoutMode === 'fixed') {
      return this.createFixedLayoutFormat(projectData, contentMode);
    } else {
      return this.createScrollableLayoutFormat(projectData, contentMode);
    }
  }

  private createFixedLayoutFormat(
    projectData: ProjectData,
    contentMode: 'enhanced' | 'restricted'
  ): string {
    const textLength = contentMode === 'enhanced' ? '150-200자' : '100-150자';

    return projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작 - PPT 형식]
**${page.topic}**

• 핵심 포인트 1: [간결한 설명]
• 핵심 포인트 2: [간결한 설명]
• 핵심 포인트 3: [간결한 설명]

**요약**: [1-2문장으로 핵심 내용 정리]

총 ${textLength}로 PPT 슬라이드처럼 핵심 포인트 중심으로 작성하세요.
${page.description ? `주제: ${page.topic}, 설명: ${page.description}` : `주제: ${page.topic}`}
[교안 본문 끝]

이미지설명: [PPT 슬라이드에 어울리는 시각 자료를 1-2줄로 설명]
상호작용: [간단한 퀴즈나 체크포인트 아이디어를 1줄로]

---
`).join('\n');
  }

  private createScrollableLayoutFormat(
    projectData: ProjectData,
    contentMode: 'enhanced' | 'restricted'
  ): string {
    const textLength = contentMode === 'enhanced' ? '400-600자' : '250-400자';

    return projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작 - 스크롤 형식]
**도입**
[주제 소개 및 학습 동기 부여 - 2-3문장]

**주요 내용**
[체계적인 내용 설명 - 3-4개 단락으로 구성]

**정리 및 적용**
[학습 내용 요약 및 실제 적용 방법 - 2-3문장]

총 ${textLength}로 섹션별 구조화된 내용으로 작성하세요.
${page.description ? `주제: ${page.topic}, 설명: ${page.description}` : `주제: ${page.topic}`}
[교안 본문 끝]

이미지설명: [스크롤 교안에 어울리는 시각 자료를 1-2줄로 설명]
상호작용: [심화 활동이나 토론 주제를 1줄로 제안]

---
`).join('\n');
  }
}