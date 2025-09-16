import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity } from '../types/workflow.types';

export interface CreativePageStory {
  pageId: string;
  pageTitle: string;
  pageNumber: number;

  // 창의적 스토리
  storyNarrative: string;        // "학습자가 새로운 개념과 첫 만남..."
  creativeLayoutIdea: string;    // "화면을 3:7로 나누어..."
  spaceConstraintGuide: string;  // 공간 제약 안내
  imageStoryPrompts: string[];   // AI 생성용 스토리텔링 프롬프트
  interactionMagic: string;      // "호버 시 살짝 떠오르며..."

  // 상태
  isGenerating: boolean;
  isComplete: boolean;
  error?: string;
  generatedAt: Date;
}

export interface CreativeContentResult {
  layoutMode: 'fixed' | 'scrollable';
  projectTitle: string;
  targetAudience: string;
  pages: CreativePageStory[];
  generatedAt: Date;
}

export class CreativeContentStorytellerService {
  constructor(private openAIService: OpenAIService) {}

  async generateCreativeContent(
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<CreativeContentResult> {
    console.log('🎪 Creative Content Storyteller: 창작 브리프 생성 시작');

    const result: CreativeContentResult = {
      layoutMode: projectData.layoutMode,
      projectTitle: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      pages: [],
      generatedAt: new Date()
    };

    // 모든 페이지에 대해 창의적 스토리 생성
    for (let i = 0; i < projectData.pages.length; i++) {
      const page = projectData.pages[i];
      console.log(`🎭 페이지 ${page.pageNumber} 창작 스토리 생성 중: ${page.topic}`);

      try {
        const pageStory = await this.generatePageStory(
          page,
          projectData,
          visualIdentity,
          i,
          projectData.pages.length
        );

        result.pages.push({
          ...pageStory,
          isGenerating: false,
          isComplete: true,
          generatedAt: new Date()
        });

        console.log(`✅ 페이지 ${page.pageNumber} 창작 스토리 완료`);
      } catch (error) {
        console.error(`❌ 페이지 ${page.pageNumber} 창작 실패:`, error);

        result.pages.push({
          pageId: page.id,
          pageTitle: page.topic,
          pageNumber: page.pageNumber,
          storyNarrative: `${page.topic}에 대한 창의적 스토리`,
          creativeLayoutIdea: '창의적 레이아웃 아이디어',
          spaceConstraintGuide: this.getSpaceConstraintGuide(projectData.layoutMode),
          imageStoryPrompts: [`${page.topic} 관련 이미지`],
          interactionMagic: '부드러운 상호작용 효과',
          isGenerating: false,
          isComplete: false,
          error: error instanceof Error ? error.message : String(error),
          generatedAt: new Date()
        });
      }
    }

    console.log('🎉 Creative Content Storyteller: 모든 페이지 창작 완료');
    return result;
  }

  private async generatePageStory(
    page: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number,
    totalPages: number
  ): Promise<CreativePageStory> {

    const prompt = this.createCreativeStoryPrompt(
      page,
      projectData,
      visualIdentity,
      pageIndex,
      totalPages
    );

    const response = await this.openAIService.generateCompletion(prompt, {
      maxTokens: 1500,
      temperature: 0.8, // 창의성을 위해 높은 temperature
    });

    const storyContent = this.parseCreativeStory(response, page, projectData.layoutMode);

    return {
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,
      ...storyContent,
      isGenerating: false,
      isComplete: true,
      generatedAt: new Date()
    };
  }

  private createCreativeStoryPrompt(
    page: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number,
    totalPages: number
  ): string {
    const constraintGuide = this.getSpaceConstraintGuide(projectData.layoutMode);
    const moodContext = this.getMoodContext(visualIdentity);
    const pageContext = this.getPageContext(pageIndex, totalPages);

    return `🎓 교육 콘텐츠 전문 설계자

당신은 교육 효과를 극대화하는 구체적이고 실용적인 교육 콘텐츠를 설계하는 전문가입니다.
개발자가 바로 구현할 수 있는 명확한 설계를 제공해주세요.

## 📚 프로젝트 맥락
**전체 주제**: ${projectData.projectTitle}
**학습자**: ${projectData.targetAudience}
**이 페이지**: ${page.topic}
**페이지 설명**: ${page.description}
${pageContext}

## 🎨 디자인 맥락
${moodContext}

## 📐 절대 지켜야 할 공간 제약
${constraintGuide}

## 🎯 설계 요구사항

이 페이지의 교육 목표를 달성하기 위한 구체적이고 실용적인 레이아웃을 설계해주세요.

다음 형식으로 정확히 작성해주세요:

---

**📋 학습 목표 및 교육 전략**
이 페이지에서 학습자가 달성해야 할 구체적 목표와 이를 위한 교육적 접근법

**🏗️ 레이아웃 구조 설계**
- 영역 A: [위치 설명] - [크기 가이드] - [담을 내용]
- 영역 B: [위치 설명] - [크기 가이드] - [담을 내용]
- 영역 C: [위치 설명] - [크기 가이드] - [담을 내용]

**📝 실제 콘텐츠 데이터**
- 제목: "[실제 사용할 제목 텍스트]"
- 본문: "[실제 사용할 본문 텍스트 100-200자]"
- 데이터: [사용할 구체적 수치나 정보]
- 리스트: [항목1, 항목2, 항목3...]

**🔄 상호작용 로직**
- 동작 1: [요소 A] 클릭 시 → [결과 B] 표시
- 동작 2: [요소 C] 호버 시 → [효과 D] 발생
- 동작 3: [조건 E] 달성 시 → [액션 F] 실행

**🖼️ 이미지 및 미디어**
- 이미지 1: [크기] - [내용 설명] - [위치]
- 이미지 2: [크기] - [내용 설명] - [위치]

**🎨 개발자 가이드**
이 설계를 구현할 때 고려할 사용자 경험과 시각적 개선 포인트

---

**중요**: 모든 내용을 구체적이고 실용적으로 작성하되, 시각적 디테일(색상, 정확한 픽셀값, 애니메이션 세부사항)은 개발자의 전문성에 맡겨주세요.`;
  }

  private parseCreativeStory(
    response: string,
    page: any,
    layoutMode: 'fixed' | 'scrollable'
  ): Omit<CreativePageStory, 'pageId' | 'pageTitle' | 'pageNumber' | 'isGenerating' | 'isComplete' | 'generatedAt'> {

    // 자연어 응답에서 섹션 추출
    const sections = this.extractStorySections(response);

    return {
      storyNarrative: sections.storyNarrative || `${page.topic}에 대한 창의적 학습 여정`,
      creativeLayoutIdea: sections.layoutIdea || '창의적이고 직관적인 레이아웃으로 구성',
      spaceConstraintGuide: this.getSpaceConstraintGuide(layoutMode),
      imageStoryPrompts: sections.imagePrompts || [`${page.topic} 관련 창의적 이미지`],
      interactionMagic: sections.interactionMagic || '부드럽고 의미 있는 상호작용 효과'
    };
  }

  private extractStorySections(response: string): {
    storyNarrative?: string;
    layoutIdea?: string;
    imagePrompts?: string[];
    interactionMagic?: string;
  } {
    // 간단한 패턴 매칭으로 섹션 추출
    // 실제로는 더 정교한 자연어 처리 가능

    const storyMatch = response.match(/(?:감정적 스토리|스토리)\*\*\s*\n(.*?)(?=\*\*|$)/s);
    const layoutMatch = response.match(/(?:레이아웃 아이디어|배치)\*\*\s*\n(.*?)(?=\*\*|$)/s);
    const interactionMatch = response.match(/(?:상호작용|마법)\*\*\s*\n(.*?)(?=\*\*|$)/s);

    // 이미지 프롬프트들 추출
    const imageMatches = response.match(/이미지 \d+:.*?\n/g) || [];
    const imagePrompts = imageMatches.map(match => match.replace(/이미지 \d+:\s*/, '').trim());

    return {
      storyNarrative: storyMatch?.[1]?.trim(),
      layoutIdea: layoutMatch?.[1]?.trim(),
      imagePrompts: imagePrompts.length > 0 ? imagePrompts : undefined,
      interactionMagic: interactionMatch?.[1]?.trim()
    };
  }

  private getSpaceConstraintGuide(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `🚨 Fixed Mode (1600×1000px): 모든 요소가 스크롤 없이 한 화면에! 공간 효율성이 핵심이며 개발자가 높이 제한을 놓치기 쉬우니 주의가 필요합니다.`;
    } else {
      return `📜 Scrollable Mode (1600×∞): 가로 너비만 준수하고 세로는 자유롭게! 스토리텔링하듯 자연스러운 흐름을 만들 수 있습니다.`;
    }
  }

  private getMoodContext(visualIdentity: VisualIdentity): string {
    const moods = visualIdentity.moodAndTone.join(', ');
    return `이 프로젝트의 전체적인 분위기는 "${moods}"입니다. 이 무드에 맞는 창의적 아이디어를 제안해주세요.`;
  }

  private getPageContext(pageIndex: number, totalPages: number): string {
    if (pageIndex === 0) {
      return `**첫 번째 페이지**: 학습자에게 강한 첫인상과 호기심을 불러일으켜야 합니다.`;
    } else if (pageIndex === totalPages - 1) {
      return `**마지막 페이지**: 학습 내용을 정리하고 성취감을 느낄 수 있도록 해야 합니다.`;
    } else {
      return `**${pageIndex + 1}번째 페이지**: 앞선 내용과 자연스럽게 연결되면서 새로운 발견의 즐거움을 줘야 합니다.`;
    }
  }
}