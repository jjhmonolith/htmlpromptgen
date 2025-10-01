import { OpenAIService } from './openai.service';
import { ProjectData } from '../types/workflow.types';
import { Step2NewResult, Step2IntegratedInput, PageContentResult } from '../types/step2-new.types';
import { Step2ResponseParser } from './step2-response-parser';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

type ProjectPage = ProjectData['pages'][number];

class Step2IntegratedFallbackProvider implements FallbackProvider<Step2NewResult> {
  constructor(private input: Step2IntegratedInput) {}

  createFallback(): Step2NewResult {
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
      componentStyle: '라운드 20-28px와 낮은 그림자, 정보 칩 구성으로 본문 가독성 우선'
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
        low: '0 2px 4px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
        high: '0 8px 16px rgba(0, 0, 0, 0.2)'
      },
      zIndex: { base: 0, image: 10, card: 20, text: 30 }
    };

    const pageContents = this.input.projectData.pages.map((page) => this.createFallbackPageContent(page));

    return {
      visualIdentity,
      designTokens,
      pageContents,
      overallFlow: this.buildOverallFlow(),
      educationalStrategy: `${this.input.projectData.targetAudience}에게 단계적으로 내용을 전달하도록 구성`,
      generatedAt: new Date(),
      processingTime: 0
    };
  }

  private createFallbackPageContent(page: ProjectPage): PageContentResult {
    const description = this.sanitiseText(page.description || `${page.topic} 핵심을 짧게 정리`);
    const fullTextContent = this.input.layoutMode === 'fixed'
      ? this.buildFixedLayoutText(page.topic, description)
      : this.buildScrollableLayoutText(page.topic, description);

    return {
      pageId: page.id,
      pageNumber: page.pageNumber,
      pageTitle: page.topic,
      fullTextContent,
      learningGoal: `${page.topic} 핵심을 말과 글로 설명한다`,
      keyMessage: `${page.topic}의 중요한 메시지를 기억한다`,
      imageDescription: this.input.layoutMode === 'fixed'
        ? `${page.topic} 키워드를 정리한 정적 슬라이드 그래픽`
        : `${page.topic} 흐름을 보여주는 설명형 일러스트`,
      interactionHint: `${page.topic}에 대해 한 문장으로 확인 질문하기`
    };
  }

  private buildFixedLayoutText(topic: string, description: string): string {
    const limit = this.input.contentMode === 'restricted' ? 140 : 190;
    const bullets = this.createBulletPoints(description, 3, limit / 3);
    const lines = bullets.map((line) => `• ${line}`);
    return [`${topic}`, ...lines].join('\n');
  }

  private buildScrollableLayoutText(topic: string, description: string): string {
    const introLimit = this.input.contentMode === 'restricted' ? 130 : 180;
    const bodyLimit = this.input.contentMode === 'restricted' ? 220 : 320;
    const summaryLimit = this.input.contentMode === 'restricted' ? 120 : 180;

    const sentences = this.splitSentences(description);
    const intro = this.limitText(sentences[0] || description, introLimit);
    const body = this.limitText(sentences.slice(1, Math.max(2, sentences.length)).join(' ') || description, bodyLimit);
    const summary = this.limitText(sentences[sentences.length - 1] || description, summaryLimit);

    return [
      '**도입**',
      intro,
      '',
      '**주요 내용**',
      body,
      '',
      '**정리 및 적용**',
      summary
    ].join('\n');
  }

  private createBulletPoints(text: string, count: number, maxPerLine: number): string[] {
    const normalised = this.limitText(text, maxPerLine * count * 2);
    const sentences = this.splitSentences(normalised);
    const bullets: string[] = [];

    for (const sentence of sentences) {
      const simplified = this.limitText(sentence, maxPerLine);
      if (simplified && !bullets.includes(simplified)) {
        bullets.push(simplified);
      }
      if (bullets.length === count) {
        break;
      }
    }

    if (bullets.length < count) {
      const words = normalised.split(/\s+/).filter(Boolean);
      const chunkSize = Math.ceil(words.length / count);
      for (let i = 0; i < count && bullets.length < count; i += 1) {
        const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ');
        const simplified = this.limitText(chunk, maxPerLine);
        if (simplified) {
          bullets.push(simplified);
        }
      }
    }

    while (bullets.length < count) {
      const fallbackLine = this.limitText(text, maxPerLine) || text.slice(0, maxPerLine).trim();
      bullets.push(fallbackLine);
    }

    return bullets.slice(0, count);
  }

  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?。？！])\s+/)
      .map((sentence) => this.sanitiseText(sentence))
      .filter(Boolean);
  }

  private limitText(text: string, maxLength: number): string {
    const trimmed = this.sanitiseText(text);
    if (!trimmed) {
      return '';
    }

    if (trimmed.length <= maxLength) {
      return trimmed;
    }

    let truncated = trimmed.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) {
      truncated = truncated.slice(0, lastSpace);
    }

    truncated = truncated.trim();
    return truncated || trimmed.slice(0, maxLength).trim();
  }

  private sanitiseText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private buildOverallFlow(): string {
    const { pages } = this.input.projectData;
    if (!pages.length) {
      return '페이지 흐름 정보 없음';
    }

    const titles = pages.map((page) => page.topic).slice(0, 3).join(' -> ');
    return pages.length > 3
      ? `${titles} 등 순서로 주제를 이어 간다`
      : `${titles} 순으로 학습 포인트를 연결한다`;
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
          {
            model: 'gpt-5',
            reasoningEffort: 'low',
            maxOutputTokens: 4000
          }
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
      ? '제공된 설명을 토대로 사례, 질문, 적용 팁을 자연스럽게 확장하세요. 단, 확장 내용은 원래 주제의 맥락을 벗어나지 않아야 합니다.'
      : '사용자가 입력한 설명과 표현을 가능한 한 그대로 유지하고, 의미나 범주를 넓히지 마세요. 길이와 어조만 교안에 맞게 다듬으세요.';

    const layoutConstraints = layoutMode === 'fixed'
      ? '고정 슬라이드는 세 줄 이내의 완성 문장으로 메시지를 전달하고, 한 화면에서 읽기 편하도록 25~40자 내외의 문장을 사용하세요.'
      : '스크롤 교안은 도입-내용-정리 구조로 이어지며, 단락 사이 흐름이 자연스럽고 탐색하기 쉽게 작성하세요.';

    const lengthGuide = layoutMode === 'fixed'
      ? `${contentMode === 'enhanced' ? '150~200자' : '100~150자'} 안에서 핵심만 압축하세요.`
      : `${contentMode === 'enhanced' ? '400~600자' : '250~400자'} 안에서 섹션별 균형을 유지하세요.`;

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
- **분량**: ${lengthGuide}
- **교육적 목표**: 각 페이지가 명확한 학습 목표를 가지고 순차적으로 연결되어야 합니다.
- **대상 맞춤**: ${projectData.targetAudience}에게 적합한 언어와 표현을 사용하세요.
- **문체 규칙**: 슬라이드에 그대로 들어갈 문장으로 작성하고 "이 페이지는", "~을 다룹니다", "~로 구성되어 있습니다" 같은 메타 표현을 사용하지 마세요.
- **참조 문구**: 사용자 제공 설명이나 키워드는 의미를 유지한 채 길이나 어조만 조정하여 활용하세요.

---

## 📝 출력 형식

### A. 각 페이지별 교안 작성
각 페이지마다 다음 형식을 **정확히** 지켜서 작성해주세요:

${this.createPageFormatByLayoutMode(projectData, layoutMode)}

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
    layoutMode: 'fixed' | 'scrollable'
  ): string {
    if (layoutMode === 'fixed') {
      return this.createFixedLayoutFormat(projectData);
    } else {
      return this.createScrollableLayoutFormat(projectData);
    }
  }

  private createFixedLayoutFormat(
    projectData: ProjectData
  ): string {
    return projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작]
**${page.topic}**

• [슬라이드에 바로 넣을 완성 문장 1]
• [슬라이드에 바로 넣을 완성 문장 2]
• [슬라이드에 바로 넣을 완성 문장 3]

**요약**: [핵심 내용을 한 문장으로 정리]
[교안 본문 끝]

이미지설명: [슬라이드에 배치할 시각 자료를 한두 문장으로 묘사]
상호작용: [학습자가 즉시 답할 수 있는 확인 질문이나 체크포인트를 한 줄로 제시]

---
`).join('\n');
  }

  private createScrollableLayoutFormat(
    projectData: ProjectData
  ): string {
    return projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작]
**도입**
[학습자가 바로 읽을 2-3문장으로 주제를 소개]

**주요 내용**
[핵심 정보를 3-4개 단락으로 정리]

**정리 및 적용**
[학습 내용 요약 및 실제 적용 방법을 2-3문장으로 제시]

[교안 본문 끝]

이미지설명: [스크롤 교안에 어울리는 시각 자료를 1-2줄로 설명]
상호작용: [심화 활동이나 토론 주제를 1줄로 제안]

---
`).join('\n');
  }
}
