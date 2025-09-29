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
    // 콘텐츠 모드별 지시사항
    const contentModeInstruction = contentMode === 'enhanced'
      ? '창의적으로 확장하여 풍부하고 매력적인 내용으로 작성하세요. 예시, 비유, 상호작용 요소를 적극 활용하세요.'
      : '제공된 정보만을 바탕으로 정확하고 간결하게 작성하세요. 추가적인 내용은 생성하지 마세요.';

    // 레이아웃 모드별 제약사항
    const layoutConstraints = layoutMode === 'fixed'
      ? '고정 슬라이드 형식이므로 각 페이지가 독립적이고 완결된 내용이어야 합니다. 텍스트 양을 적절히 조절하세요.'
      : '스크롤 형식이므로 자연스러운 연결과 흐름을 고려하여 작성하세요.';

    return `당신은 교육 콘텐츠 전문가이자 비주얼 디자이너입니다.
다음 프로젝트의 완성된 교안과 비주얼 디자인을 생성해주세요.

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

${projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작]
${contentMode === 'enhanced' ? '500-800자' : '300-500자'}의 완성된 교육 내용을 작성하세요.
${page.description ? `주제: ${page.topic}, 설명: ${page.description}` : `주제: ${page.topic}`}

자연스럽고 매력적인 교육 텍스트로 작성하되, 문단을 적절히 나누어 가독성을 높이세요.
[교안 본문 끝]

이미지설명: [이 페이지에서 필요한 이미지나 시각 자료를 1-2줄로 설명]
상호작용: [학습자와의 상호작용 아이디어를 1줄로 제안]

---
`).join('\n')}

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

**중요**: 위의 형식을 정확히 지켜주세요. 특히 "=== 페이지 X: 제목 ===" 형식과 각 필드명(학습목표:, 핵심메시지:, 이미지설명:, 상호작용:)을 정확히 사용해주세요. 파싱 시 이 형식에 의존합니다.`;
  }
}