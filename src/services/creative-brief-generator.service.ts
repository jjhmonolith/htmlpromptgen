import { ProjectData, VisualIdentity } from '../types/workflow.types';
import { CreativeContentResult } from './creative-content-storyteller.service';

export interface CreativeBrief {
  projectTitle: string;
  targetAudience: string;
  layoutMode: 'fixed' | 'scrollable';

  // 창의적 브리프 내용
  projectVision: string;        // 전체 프로젝트의 비전과 감정적 목표
  emotionalTone: string;        // 감성적 톤앤매너
  spaceConstraintReminder: string; // 공간 제약 주의사항

  pageStories: {
    pageNumber: number;
    pageTitle: string;
    fullCreativeBrief: string;  // 해당 페이지의 완전한 창작 브리프
  }[];

  developerGuidance: string;    // 개발자를 위한 전반적 가이드

  // 메타데이터
  generatedAt: Date;
  estimatedTokens: number;
  briefLength: number;
}

export class CreativeBriefGeneratorService {

  generateFinalCreativeBrief(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    creativeContent: CreativeContentResult
  ): CreativeBrief {
    console.log('📋 Creative Brief Generator: 최종 창작 브리프 생성 시작');

    const projectVision = this.generateProjectVision(projectData, visualIdentity);
    const emotionalTone = this.generateEmotionalTone(visualIdentity);
    const spaceConstraintReminder = this.generateSpaceConstraintReminder(projectData.layoutMode);
    const developerGuidance = this.generateDeveloperGuidance(projectData, visualIdentity);

    const pageStories = creativeContent.pages.map(page => ({
      pageNumber: page.pageNumber,
      pageTitle: page.pageTitle,
      fullCreativeBrief: this.generatePageBrief(page, projectData, visualIdentity)
    }));

    const fullBriefText = this.generateFullBriefText(
      projectVision,
      emotionalTone,
      spaceConstraintReminder,
      pageStories,
      developerGuidance
    );

    const brief: CreativeBrief = {
      projectTitle: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      layoutMode: projectData.layoutMode,
      projectVision,
      emotionalTone,
      spaceConstraintReminder,
      pageStories,
      developerGuidance,
      generatedAt: new Date(),
      estimatedTokens: Math.ceil(fullBriefText.length / 4), // 대략적 토큰 계산
      briefLength: fullBriefText.length
    };

    console.log(`✅ Creative Brief 생성 완료: ${brief.briefLength}자, 예상 토큰 ${brief.estimatedTokens}`);
    return brief;
  }

  private generateProjectVision(projectData: ProjectData, visualIdentity: VisualIdentity): string {
    const moods = visualIdentity.moodAndTone.join('하고 ');

    return `# 🎨 ${projectData.projectTitle} - 창작 브리프

## 🌟 프로젝트 비전

이 교육 프로젝트는 **${projectData.targetAudience}**이 "${projectData.projectTitle}"를 배우는 과정에서 마치 **${moods}한 경험**을 할 수 있도록 설계되었습니다.

학습자가 이 교안을 보는 순간 "어? 이거 생각보다 재미있네!"라고 느낄 수 있도록, 단순한 정보 전달을 넘어선 **감동적인 학습 여정**을 만들어주세요.

${visualIdentity.componentStyle}`;
  }

  private generateEmotionalTone(visualIdentity: VisualIdentity): string {
    const moods = visualIdentity.moodAndTone;
    const colors = visualIdentity.colorPalette;

    return `## 🎭 감성적 분위기

**무드**: ${moods.join(' → ')}의 감정적 여정
**색상 감성**: 주요색(${colors.primary})은 ${this.getColorEmotion(colors.primary)}, 강조색(${colors.accent})은 ${this.getColorEmotion(colors.accent)}을 표현
**전반적 톤**: ${visualIdentity.typography.headingFont} 폰트의 ${this.getFontEmotion(visualIdentity.typography.headingFont)} 느낌

개발자님이 이 분위기를 코드로 표현할 때, 기술적 완벽함보다는 **감정적 공감**을 우선시해주세요.`;
  }

  private generateSpaceConstraintReminder(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `## 🚨 절대적 공간 제약 (매우 중요!)

**Fixed Mode (1600×1000px)**
- 높이 1000px를 절대 넘을 수 없습니다 (스크롤바 생성 시 실패)
- 모든 콘텐츠가 한 화면에 들어와야 합니다
- 개발자분들이 자주 놓치는 부분이니 **높이 계산을 꼼꼼히** 확인해주세요
- 제한된 공간에서 최대한의 임팩트를 내는 것이 이 모드의 매력입니다

공간이 부족하다면 창의적으로 압축하되, 절대 높이를 초과하지 마세요!`;
    } else {
      return `## 📜 공간 활용 가이드

**Scrollable Mode (1600×무제한)**
- 가로 1600px는 절대 초과 금지 (가로 스크롤 방지)
- 세로는 자유롭게 사용 가능합니다
- 스토리텔링하듯 자연스러운 흐름으로 구성해주세요
- 섹션 간 충분한 호흡감을 주어 학습자가 지치지 않도록 배려

여유로운 공간을 살려 더 깊이 있는 교육 경험을 만들어보세요!`;
    }
  }

  private generateDeveloperGuidance(projectData: ProjectData, visualIdentity: VisualIdentity): string {
    return `## 🎯 개발자를 위한 창작 가이드

**창의적 자유도**: 이 브리프는 나침반일 뿐입니다. 더 좋은 아이디어가 있다면 적극적으로 반영해주세요!

**구현할 때 고려사항**:
- 위에 제시된 감정적 분위기와 공간 제약만 지켜주세요
- 구체적인 색상값, 폰트 크기, 레이아웃 세부사항은 개발자님의 센스에 맡깁니다
- 학습자의 시선을 어떻게 유도할지 창의적으로 고민해보세요
- 과도한 효과보다는 의미 있는 순간에 적절한 인터랙션을 넣어주세요

**성공 기준**:
✅ 학습자가 "재미있다"고 느끼는가?
✅ 모든 요소가 정해진 영역 안에 깔끔하게 들어가는가?
✅ 인터랙션이 교육적 목적에 도움이 되는가?
✅ 전체적으로 조화롭고 세련된 느낌인가?

당신의 개발 실력과 창의력으로 이 교안을 **아름다운 교육 경험**으로 완성해주세요! 🚀`;
  }

  private generatePageBrief(page: any, projectData: ProjectData, visualIdentity: VisualIdentity): string {
    return `### 📄 Page ${page.pageNumber}: ${page.pageTitle}

**🌟 이 페이지의 스토리**
${page.storyNarrative}

**🎨 창의적 레이아웃 아이디어**
${page.creativeLayoutIdea}

**🖼️ 이미지 스토리텔링**
${page.imageStoryPrompts.map((prompt, index) => `- 이미지 ${index + 1}: ${prompt}`).join('\n')}

**⚡ 상호작용의 마법**
${page.interactionMagic}

**📐 이 페이지의 공간 활용**
${page.spaceConstraintGuide}

---`;
  }

  private generateFullBriefText(
    projectVision: string,
    emotionalTone: string,
    spaceConstraintReminder: string,
    pageStories: { pageNumber: number; pageTitle: string; fullCreativeBrief: string; }[],
    developerGuidance: string
  ): string {
    const pagesContent = pageStories.map(story => story.fullCreativeBrief).join('\n');

    return `${projectVision}

${emotionalTone}

${spaceConstraintReminder}

## 🏗️ 페이지별 창작 가이드

${pagesContent}

${developerGuidance}`;
  }

  private getColorEmotion(colorHex: string): string {
    // 색상에서 감정 추출하는 간단한 로직
    const color = colorHex.toLowerCase();
    if (color.includes('00') || color.includes('blue') || color.includes('4')) {
      return '신뢰감과 안정감';
    } else if (color.includes('f') || color.includes('orange') || color.includes('yellow')) {
      return '활기와 긍정적 에너지';
    } else if (color.includes('green') || color.includes('2')) {
      return '자연스러움과 성장';
    } else {
      return '차분하고 세련된 느낌';
    }
  }

  private getFontEmotion(fontName: string): string {
    if (fontName.includes('Pretendard')) {
      return '모던하고 깔끔한';
    } else if (fontName.includes('Noto')) {
      return '편안하고 가독성 좋은';
    } else {
      return '안정적이고 신뢰할 수 있는';
    }
  }

  // 마크다운 포맷으로 브리프 출력
  generateMarkdownBrief(brief: CreativeBrief): string {
    return this.generateFullBriefText(
      brief.projectVision,
      brief.emotionalTone,
      brief.spaceConstraintReminder,
      brief.pageStories,
      brief.developerGuidance
    );
  }
}