import {
  ParsedLayoutResponse,
  LayoutSection
} from '../types/step3-layout-only.types';

export class Step3LayoutResponseParser {
  parseLayoutResponse(
    aiResponse: string,
    pageIndex: number
  ): ParsedLayoutResponse {
    console.log(`📝 Step3 레이아웃 응답 파싱 시작 (페이지 ${pageIndex + 1})`);

    try {
      // 1. 전체 레이아웃 개념 추출
      const layoutConcept = this.extractLayoutConcept(aiResponse);

      // 2. 섹션별 구성 추출
      const sections = this.extractSections(aiResponse);

      // 3. 이미지 레이아웃 추출
      const imageLayout = this.extractImageLayout(aiResponse);

      // 4. 세부 디자인 가이드 추출
      const designGuide = this.extractDesignGuide(aiResponse);

      // 5. 구현 가이드라인 추출
      const implementationGuide = this.extractImplementationGuide(aiResponse);

      console.log('✅ Step3 레이아웃 파싱 완료');

      return {
        layoutConcept,
        sections,
        imageLayout,
        designGuide,
        implementationGuide
      };

    } catch (error) {
      console.error('❌ Step3 레이아웃 파싱 실패:', error);
      throw new Error(`Step3 레이아웃 응답 파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractLayoutConcept(response: string): string {
    const match = response.match(/\*\*전체 레이아웃 개념\*\*:\s*(.+?)(?=\n\n|\*\*)/s);
    return match ? match[1].trim() : '교육적이고 직관적인 레이아웃 설계';
  }

  private extractSections(response: string): LayoutSection[] {
    const sections: LayoutSection[] = [];

    // 섹션별 구성 부분 찾기
    const sectionsMatch = response.match(/\*\*섹션별 구성\*\*:([\s\S]*?)(?=\n### |\n\*\*)/);
    if (!sectionsMatch) {
      return this.createFallbackSections();
    }

    const sectionsText = sectionsMatch[1];

    // 각 섹션 파싱 (1. **헤더 영역** 형식)
    const sectionMatches = sectionsText.matchAll(/(\d+)\.\s*\*\*(.*?)\*\*\s*\(그리드:\s*(.*?),\s*높이:\s*(.*?)\)\s*\n\s*-\s*배치 요소:\s*(.*?)\n\s*-\s*스타일링:\s*(.*?)(?=\n\n|\n\d+\.|\n###|$)/gs);

    for (const match of sectionMatches) {
      const [, order, name, gridSpan, height, content, styling] = match;

      sections.push({
        id: this.generateSectionId(name),
        name: name.trim(),
        gridSpan: gridSpan.trim(),
        height: height.trim(),
        purpose: `${name} 담당`,
        content: content.trim(),
        styling: styling.trim()
      });
    }

    return sections.length > 0 ? sections : this.createFallbackSections();
  }

  private extractImageLayout(response: string): {
    placement: string;
    sizing: string;
    integration: string;
  } {
    // 이미지 영역에서 추출
    const imageSection = this.findSectionByName(response, '이미지 영역');

    const placement = this.extractByPattern(response, /위치:\s*\[(.*?)\]/) ||
                     imageSection?.match(/위치:\s*(.*?)(?=\n|-)/)?.[1]?.trim() ||
                     '중앙 배치';

    const sizing = this.extractByPattern(response, /크기:\s*(.*?)(?=\n|,|$)/) ||
                  imageSection?.match(/크기:\s*(.*?)(?=\n|-)/)?.[1]?.trim() ||
                  '적절한 크기';

    const integration = this.extractByPattern(response, /통합:\s*(.*?)(?=\n|$)/) ||
                       '텍스트와 자연스러운 연결';

    return {
      placement,
      sizing,
      integration
    };
  }

  private extractDesignGuide(response: string): {
    typography: string;
    colorApplication: string;
    spacingDetails: string;
    visualEmphasis: string;
  } {
    const designSection = response.match(/### 세부 디자인 가이드([\s\S]*?)(?=\n### |\n\*\*|$)/)?.[1] || '';

    return {
      typography: this.extractByPattern(designSection, /\*\*타이포그래피\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '계층적 폰트 시스템',
      colorApplication: this.extractByPattern(designSection, /\*\*색상 적용\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '브랜드 색상 체계 활용',
      spacingDetails: this.extractByPattern(designSection, /\*\*간격 체계\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '일관된 여백 시스템',
      visualEmphasis: this.extractByPattern(designSection, /\*\*시각적 강조\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '핵심 내용 하이라이트'
    };
  }

  private extractImplementationGuide(response: string): {
    cssStructure: string;
    responsiveStrategy: string;
    accessibilityNotes: string;
  } {
    const implSection = response.match(/### 구현 가이드라인([\s\S]*?)(?=\n### |\n---|\n\*\*|$)/)?.[1] || '';

    return {
      cssStructure: this.extractByPattern(implSection, /\*\*CSS 클래스 구조\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '모듈화된 CSS 클래스',
      responsiveStrategy: this.extractByPattern(implSection, /\*\*반응형 전략\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || '모바일 우선 반응형 디자인',
      accessibilityNotes: this.extractByPattern(implSection, /\*\*접근성 고려사항\*\*:\s*(.*?)(?=\n\*\*|\n$)/s) || 'WCAG 가이드라인 준수'
    };
  }

  private extractByPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  private findSectionByName(response: string, sectionName: string): string | null {
    const pattern = new RegExp(`\\*\\*${sectionName}.*?\\*\\*[\\s\\S]*?(?=\\n\\d+\\.|\\n###|$)`, 'i');
    const match = response.match(pattern);
    return match ? match[0] : null;
  }

  private generateSectionId(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private createFallbackSections(): LayoutSection[] {
    return [
      {
        id: 'header',
        name: '헤더 영역',
        gridSpan: '1-12',
        height: '120px',
        purpose: '학습목표와 핵심메시지 제시',
        content: '학습목표 + 핵심메시지',
        styling: '간결하고 명확한 스타일'
      },
      {
        id: 'main-content',
        name: '메인 콘텐츠 영역',
        gridSpan: '1-8',
        height: 'auto',
        purpose: '교안 본문 텍스트 표시',
        content: '교안 본문',
        styling: '가독성 중심의 타이포그래피'
      },
      {
        id: 'image',
        name: '이미지 영역',
        gridSpan: '9-12',
        height: '400px',
        purpose: '시각적 자료 표시',
        content: '교육용 이미지',
        styling: '적절한 여백과 캡션'
      },
      {
        id: 'interaction',
        name: '상호작용 영역',
        gridSpan: '1-12',
        height: '100px',
        purpose: '상호작용 요소 제공',
        content: '상호작용 요소',
        styling: '참여를 유도하는 디자인'
      }
    ];
  }
}