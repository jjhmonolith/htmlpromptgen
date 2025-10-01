import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';
import { Step2NewResult, PageContentResult } from '../types/step2-new.types';

export class Step2ResponseParser {
  parseResponse(
    aiResponse: string,
    projectData: ProjectData,
    layoutMode: 'fixed' | 'scrollable'
  ): Omit<Step2NewResult, 'generatedAt' | 'processingTime'> {
    console.log('📝 Step2 응답 파싱 시작');

    try {
      // 1. 페이지별 교안 추출
      const pageContents = this.parsePageContents(aiResponse, projectData);
      console.log('✅ 페이지 콘텐츠 파싱 완료:', pageContents.length, '개');

      // 2. 비주얼 아이덴티티 추출
      const visualIdentity = this.parseVisualIdentity(aiResponse);
      console.log('✅ 비주얼 아이덴티티 파싱 완료');

      // 3. 전체 구성 정보 추출
      const overallFlow = this.extractByPattern(aiResponse, /전체흐름: (.+)/);
      const educationalStrategy = this.extractByPattern(aiResponse, /교육전략: (.+)/);

      // 4. 디자인 토큰 생성
      const designTokens = this.generateDesignTokens(layoutMode);

      return {
        visualIdentity,
        designTokens,
        pageContents,
        overallFlow: overallFlow || `${projectData.pages.length}개 페이지를 통한 체계적 학습 진행`,
        educationalStrategy: educationalStrategy || `${projectData.targetAudience}을 위한 단계별 학습 접근법`
      };

    } catch (error) {
      console.error('❌ Step2 파싱 실패:', error);
      throw new Error(`Step2 응답 파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parsePageContents(response: string, projectData: ProjectData): PageContentResult[] {
    const pages: PageContentResult[] = [];

    // 정규식 패턴: === 페이지 X: 제목 === 부터 다음 === 또는 문서 끝까지
    const pageRegex = /=== 페이지 (\d+): (.+?) ===\n학습목표: (.+?)\n핵심메시지: (.+?)\n\n([\s\S]+?)\n\n이미지설명: (.+?)\n상호작용: (.+?)(?=\n\n---|$)/g;

    let match;
    while ((match = pageRegex.exec(response)) !== null) {
      const pageNumber = parseInt(match[1]);
      const pageTitle = match[2].trim();

      // 프로젝트 데이터에서 해당 페이지 찾기
      const originalPage = projectData.pages.find(p => p.pageNumber === pageNumber);

      if (originalPage) {
        // 교안 본문에서 [교안 본문 시작]과 [교안 본문 끝] 사이 내용 추출
        const fullContent = match[5].trim();
        const contentMatch = fullContent.match(/\[교안 본문 시작\]([\s\S]*?)\[교안 본문 끝\]/);
        const extractedContent = contentMatch ? contentMatch[1].trim() : fullContent;

        pages.push({
          pageId: originalPage.id,
          pageNumber: pageNumber,
          pageTitle: pageTitle,
          learningGoal: match[3].trim(),
          keyMessage: match[4].trim(),
          fullTextContent: extractedContent,
          imageDescription: match[6].trim(),
          interactionHint: match[7].trim()
        });
      }
    }

    // 파싱된 페이지가 없으면 기본값 생성
    if (pages.length === 0) {
      console.warn('⚠️ 페이지 파싱 실패, 기본값 생성');
      return this.createFallbackPageContents(projectData);
    }

    // 누락된 페이지가 있으면 기본값으로 채우기
    const missingPages = projectData.pages.filter(
      originalPage => !pages.find(parsed => parsed.pageNumber === originalPage.pageNumber)
    );

    missingPages.forEach(page => {
      pages.push(this.buildFallbackPageContent(page));
    });

    // 페이지 번호 순으로 정렬
    return pages.sort((a, b) => a.pageNumber - b.pageNumber);
  }

  private parseVisualIdentity(response: string): VisualIdentity {
    try {
      return {
        moodAndTone: this.extractByPattern(response, /비주얼_분위기: (.+)/).split(',').map(mood => mood.trim()),
        colorPalette: {
          primary: this.extractByPattern(response, /색상_주요: (#[a-fA-F0-9]{6})/),
          secondary: this.extractByPattern(response, /색상_보조: (#[a-fA-F0-9]{6})/),
          accent: this.extractByPattern(response, /색상_강조: (#[a-fA-F0-9]{6})/),
          text: this.extractByPattern(response, /색상_텍스트: (#[a-fA-F0-9]{6})/),
          background: this.extractByPattern(response, /색상_배경: (#[a-fA-F0-9]{6})/)
        },
        typography: {
          headingFont: this.extractByPattern(response, /글꼴_제목: (.+)/),
          bodyFont: this.extractByPattern(response, /글꼴_본문: (.+)/),
          baseSize: this.extractByPattern(response, /기본크기: (.+)/),
          headingStyle: '견고하면서도 친근한',
          bodyStyle: '읽기 편안하고 깔끔한'
        },
        componentStyle: this.extractByPattern(response, /컴포넌트스타일: (.+)/)
      };
    } catch (error) {
      console.warn('⚠️ 비주얼 아이덴티티 파싱 실패, 기본값 사용', error);
      return this.createFallbackVisualIdentity();
    }
  }

  private extractByPattern(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match || !match[1]) {
      throw new Error(`패턴 매칭 실패: ${pattern}`);
    }
    return match[1].trim();
  }

  private generateDesignTokens(layoutMode: 'fixed' | 'scrollable'): DesignTokens {
    return {
      viewport: layoutMode === 'fixed'
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
  }

  private createFallbackPageContents(projectData: ProjectData): PageContentResult[] {
    return projectData.pages.map(page => this.buildFallbackPageContent(page));
  }

  private createFallbackVisualIdentity(): VisualIdentity {
    return {
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
      componentStyle: '라운드 20-28px와 낮은 그림자, 정보 칩 구성으로 본문 가독성을 우선'
    };
  }

  private buildFallbackPageContent(page: ProjectData['pages'][number]): PageContentResult {
    const description = this.sanitiseText(page.description || `${page.topic} 핵심을 짧게 정리`);
    const fullTextContent = this.buildFallbackFullText(page.topic, description);

    return {
      pageId: page.id,
      pageNumber: page.pageNumber,
      pageTitle: page.topic,
      fullTextContent,
      learningGoal: `${page.topic} 핵심을 자신의 말로 설명한다`,
      keyMessage: `${page.topic}에서 반드시 기억할 메시지를 정리한다`,
      imageDescription: `${page.topic} 흐름을 표현하는 시각 자료`,
      interactionHint: `${page.topic}에 대해 한 문장으로 정리하도록 질문`
    };
  }

  private buildFallbackFullText(topic: string, description: string): string {
    const bullets = this.createBullets(description, 3, 60);
    const summary = bullets[0] || description;
    return [
      `**${topic}**`,
      ...bullets.map((line) => `• ${line}`),
      '',
      `**요약**: ${summary}`
    ].join('\n');
  }

  private createBullets(text: string, count: number, maxPerLine: number): string[] {
    const sentences = this.splitSentences(text);
    const bullets: string[] = [];

    for (const sentence of sentences) {
      if (bullets.length === count) {
        break;
      }
      const trimmed = this.limitText(sentence, maxPerLine);
      if (trimmed) {
        bullets.push(trimmed);
      }
    }

    if (bullets.length < count) {
      const words = this.sanitiseText(text).split(/\s+/).filter(Boolean);
      const chunkSize = Math.ceil(words.length / count);
      for (let i = 0; i < count && bullets.length < count; i += 1) {
        const chunkWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunk = chunkWords.join(' ');
        const trimmed = this.limitText(chunk, maxPerLine);
        if (trimmed) {
          bullets.push(trimmed);
        }
      }
    }

    while (bullets.length < count) {
      const fallbackLine = this.limitText(text, maxPerLine);
      bullets.push(fallbackLine || '핵심 내용을 짧게 정리');
    }

    return bullets.slice(0, count);
  }

  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?。？！])\s+/)
      .map((line) => this.sanitiseText(line))
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
}
