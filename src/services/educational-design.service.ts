import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity } from '../types/workflow.types';
import {
  EducationalDesignResult,
  EducationalPageDesign,
  EmotionalContext,
  ComponentSpec,
  InteractionSpec,
  ContentData
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

    const startTime = Date.now();

    // 감성 컨텍스트 준비
    const emotionalContext = this.createEmotionalContext(visualIdentity);

    // 전체 프로젝트 개요 생성
    const projectOverview = {
      title: projectData.projectTitle,
      targetAudience: projectData.targetAudience,
      layoutMode: projectData.layoutMode,
      overallLearningGoals: this.inferLearningGoals(projectData),
      educationalApproach: this.determineEducationalApproach(projectData, emotionalContext)
    };

    // 공간 제약 정보
    const spaceConstraints = {
      mode: projectData.layoutMode,
      dimensions: projectData.layoutMode === 'fixed' ? '1600×1000px' : '1600×∞px',
      criticalReminders: this.getSpaceConstraintReminders(projectData.layoutMode)
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

    return this.parseEducationalDesign(response.content, page, projectData, emotionalContext, prompt, response.content);
  }

  private createEducationalDesignPrompt(
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    pageIndex: number,
    totalPages: number
  ): string {
    const constraintInfo = this.getDetailedConstraints(projectData.layoutMode);
    const audienceInfo = this.getAudienceCharacteristics(projectData.targetAudience);
    const pageContext = this.getPageContext(pageIndex, totalPages);

    return `🎓 교육 콘텐츠 UI/UX 설계 전문가

당신은 개발자가 바로 구현할 수 있는 수준의 정밀하고 구체적인 교육 콘텐츠 UI를 설계하는 전문가입니다. 픽셀 단위의 정확한 레이아웃과 완전한 디자인 시스템을 제공해야 합니다.

## 📋 프로젝트 정보
**주제**: ${projectData.projectTitle}
**학습자**: ${projectData.targetAudience}
${audienceInfo}
**이 페이지**: ${page.topic}
**설명**: ${page.description}
${pageContext}

## 🎨 디자인 맥락
**전체 분위기**: ${emotionalContext.overallTone}
**컬러 팔레트**: ${emotionalContext.colorEmotions.primary}, ${emotionalContext.colorEmotions.secondary}, ${emotionalContext.colorEmotions.accent}

## 📐 캔버스 제약
${constraintInfo}

---

# 🎯 완전한 교육 페이지 설계서

다음 형식으로 개발자가 바로 구현할 수 있는 수준의 상세한 설계를 제공해주세요:

## 페이지 ${page.pageNumber}: [창의적이고 구체적인 페이지 제목]

[페이지 주제에 대한 2-3줄 교육적 설명]

### 1. 페이지 구성 및 내용

\`\`\`
다음은 ${projectData.layoutMode === 'fixed' ? '1600x1000px 고정 화면(스크롤 없음)' : '1600px 너비, 세로 스크롤'} 기준, '${page.topic}' 페이지의 교육 콘텐츠 레이아웃 설계안입니다. ${emotionalContext.overallTone} 분위기를 살리면서, 콘텐츠의 중요도에 따른 시각적 계층을 분명히 합니다. ${projectData.targetAudience} 대상이므로 정보량은 부담 없이 핵심이 한눈에 들어오도록 구성합니다.

1) 캔버스, 그리드, 여백
- 캔버스: ${projectData.layoutMode === 'fixed' ? '1600x1000px' : '1600x∞px (세로 스크롤)'}
- 안전 여백: 사방 64px
- 그리드: 12컬럼, 컬럼 폭 108px, 거터 24px (콘텐츠 폭 1472px)
- 시선 흐름: [좌상단에서 시작하여 교육적 논리 순서에 따른 시선 흐름 설계]

2) 타이포그래피(모든 텍스트 18pt 이상)
- 제목(H1): 44pt, SemiBold, 행간 120%, 글자간 -1%, 컬러 #1E2A3A
- 부제/리드(H2): 22pt, Medium, 행간 140%, 컬러 #2A3A4A
- 본문: 19pt, Regular, 행간 150%, 컬러 #27323C
- 캡션/라벨: 18pt, Medium, 행간 140%, 컬러 #4A5B6B

3) 컬러 & 분위기
- 배경: [교육 주제에 맞는 배경색 #XXXXXX]
- 주요 포인트: [3-4개 색상과 hex 코드]
- 구분선/연결선: [색상과 스타일]
- 접근성: 텍스트 대비율 4.5:1 이상 유지

4) 레이아웃 구조(영역별 좌표/크기와 콘텐츠)
[최소 4-6개 영역을 픽셀 단위로 정확히 설계]

A. [영역명] (예: 상단 타이틀 영역)
- 위치/크기: x=64, y=64, 폭=약 XXXpx(컬럼 X–X), 높이=XXXpx
- 구성: [구체적인 UI 요소와 텍스트 내용]
- 시각 강조: [배경, 언더라인, 그라데이션 등 구체적 스타일]

B. [영역명] (예: 메인 비주얼 영역)
- 위치/크기: x=XXX, y=XXX, 폭=XXXpx, 높이=XXXpx
- 콘텐츠 의도: [교육적 목적과 시각적 효과]
- 연결 요소: [다른 영역과의 시각적 연결]

[C, D, E, F... 영역들 계속]

5) 교육 콘텐츠(문구) 상세
- 제목: "[실제 사용할 구체적이고 매력적인 제목]"
- 리드 문장: "[2-3줄의 핵심 설명]"
- 학습 목표 (3-4개): "[체크 가능한 구체적 목표들]"
- 핵심 내용: [실제 교육 내용을 구체적으로]

6) 맞춤형 시각 요소
- 연결선/화살표: [교육 흐름을 보여주는 시각 요소]
- 강조 카드: [중요 정보의 카드 디자인]
- 인터랙션 힌트: [클릭, 호버 등 상호작용 가이드]

7) 접근성/가독성
- 텍스트 최소 18pt 준수
- 색상 대비율 4.5:1 이상
- 스크린리더 대응
- 키보드 네비게이션 고려

8) 개발 구현 요약(픽셀 가이드)
- [각 영역별 정확한 CSS 포지셀 정보]
- [반응형 고려사항]
- [애니메이션 가이드]

9) 페이지 교육 효과
- [이 설계가 달성하는 교육적 목표]
- [인지 부하 최적화 방법]
- [기억과 이해를 돕는 시각적 전략]
\`\`\`

### 2. 페이지에 사용될 이미지

**1.png**: [매우 구체적이고 상세한 이미지 설명. 교육 주제, 시각적 요소, 색상, 구성, 스타일, 배치까지 모두 명시. 최소 200-300자의 자세한 설명]

**2.png**: [두 번째 이미지의 매우 구체적인 설명]

**3.png** (필요시): [세 번째 이미지의 매우 구체적인 설명]

---

위 형식을 정확히 따라 개발자가 바로 코딩할 수 있을 정도로 구체적이고 정밀한 설계를 제공해주세요. 모호한 표현은 절대 사용하지 말고, 모든 수치와 색상을 정확히 명시하세요.`;
  }

  private parseEducationalDesign(
    response: string,
    page: any,
    projectData: ProjectData,
    emotionalContext: EmotionalContext,
    originalPrompt?: string,
    originalResponse?: string
  ): EducationalPageDesign {
    console.log(`✅ 페이지 ${page.pageNumber} 2단위 구조 처리: 전체설명 + 기본구조`);

    // Phase 2 단순화: "2개 큰 덩어리" 시스템
    // 1. 전체 AI 응답 (fullDescription)
    // 2. 항상 보장되는 기본 구조 (3개 컴포넌트 + 1개 이미지)

    return {
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,

      // 📋 덩어리 1: 전체 AI 설계 문서 (모든 정보 보존)
      fullDescription: response.trim(),

      // 📋 덩어리 2: 기본 보장 구조 (파싱 실패 방지)
      learningObjectives: [`${page.topic} 기본 개념 이해`, '핵심 원리 파악', '실용적 적용'],
      educationalStrategy: '단계별 학습 접근법',

      layoutStructure: {
        areas: [
          {
            id: 'main-content',
            description: '메인 콘텐츠 영역',
            purpose: '핵심 학습 내용 제시',
            sizeGuide: '전체 화면의 80%'
          },
          {
            id: 'interaction-area',
            description: '상호작용 영역',
            purpose: '학습자 참여 유도',
            sizeGuide: '전체 화면의 20%'
          }
        ]
      },

      content: {
        heading: page.topic,
        bodyText: page.description || `${page.topic}에 대해 체계적으로 학습합니다.`,
        keyPoints: ['핵심 개념', '주요 원리', '실생활 적용']
      },

      // 항상 3개 기본 컴포넌트 보장 (파싱 실패 없음)
      components: [
        {
          id: 'title-component',
          type: 'heading',
          position: { area: '상단 영역', priority: 1 },
          size: { guideline: '전체 너비', responsive: true },
          content: { primary: page.topic },
          purpose: '페이지 주제 명시'
        },
        {
          id: 'content-component',
          type: 'text',
          position: { area: '메인 영역', priority: 2 },
          size: { guideline: '메인 영역 80%', responsive: true },
          content: { primary: page.description || `${page.topic}의 핵심 내용을 다룹니다.` },
          purpose: '주요 학습 내용 전달'
        },
        {
          id: 'action-component',
          type: 'interactive',
          position: { area: '하단 영역', priority: 3 },
          size: { guideline: '적절한 상호작용 크기', responsive: true },
          content: { primary: '학습 내용을 확인해보세요!' },
          purpose: '학습 참여 유도'
        }
      ],

      interactions: [
        {
          id: 'main-interaction',
          trigger: '컴포넌트 클릭',
          action: '추가 정보 표시',
          purpose: '심화 학습',
          feedback: '시각적 피드백 제공'
        }
      ],

      // Phase 2 개선: AI 응답에서 실제 이미지들 파싱 시도 + 기본 보장 이미지
      mediaAssets: this.parseAndGenerateImages(response, page, projectData, emotionalContext),

      designRationale: '안정적이고 효과적인 교육 구조',
      implementationHints: '사용자 중심의 직관적 인터페이스 구현',
      uxConsiderations: '접근성과 학습 효과 최우선',

      isComplete: true, // 항상 완료 상태 보장
      generatedAt: new Date(),

      // 디버그 정보 저장
      debugInfo: originalPrompt && originalResponse ? {
        originalPrompt,
        originalResponse,
        parsedSections: { fullContent: response.substring(0, 200) + '...' }
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

  // AI 응답에서 이미지 정보를 파싱하고 기본 이미지들 생성
  private parseAndGenerateImages(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    console.log(`🖼️ 페이지 ${page.pageNumber} 이미지 파싱 시작`);

    // 1. AI 응답에서 이미지 정보 추출 시도
    const parsedImages = this.extractImagesFromResponse(response, page, projectData, emotionalContext);

    // 2. 파싱 성공 시 파싱된 이미지만 사용 (최대 3개)
    if (parsedImages.length > 0) {
      const limitedImages = parsedImages.slice(0, 3); // 최대 3개로 제한
      console.log(`✅ AI 응답에서 ${limitedImages.length}개 이미지 파싱 성공`);
      return limitedImages;
    }

    // 3. 파싱 실패 시에만 기본 이미지 사용
    const fallbackImages = this.generateFallbackImages(page, projectData, emotionalContext);
    console.log(`🔄 파싱 실패, 기본 이미지 ${fallbackImages.length}개 사용`);
    return fallbackImages;
  }

  // AI 응답에서 이미지 정보 추출 (새로운 형식에 맞춘 버전)
  private extractImagesFromResponse(response: string, page: any, projectData: ProjectData, emotionalContext: EmotionalContext): any[] {
    const images: any[] = [];

    // "### 2. 페이지에 사용될 이미지" 섹션 찾기
    const imageSection = response.match(/### 2\. 페이지에 사용될 이미지(.*?)(?=\n###|\n---|\n##|$)/s);
    if (!imageSection) {
      console.log('❌ 이미지 섹션을 찾을 수 없음');
      return images;
    }

    const imageContent = imageSection[1];
    console.log('🔍 이미지 섹션 내용:', imageContent.substring(0, 300) + '...');

    // 새로운 설계서 형식에 맞춘 파싱:
    // **1.png**: [매우 구체적이고 상세한 이미지 설명...]
    // **2.png**: [두 번째 이미지의 매우 구체적인 설명...]

    // 이미지 항목들을 찾기
    const imageMatches = imageContent.match(/\*\*(\d+)\.png\*\*:\s*([^\n*]+(?:\n(?!\*\*)[^\n*]+)*)/g);

    if (!imageMatches) {
      console.log('❌ 이미지 항목을 찾을 수 없음');
      return images;
    }

    console.log(`🔍 발견된 이미지 항목: ${imageMatches.length}개`);

    imageMatches.forEach((match, index) => {
      console.log(`📝 이미지 항목 ${index + 1} 파싱 시도:`, match.substring(0, 100) + '...');

      // 파일명과 설명 추출
      const itemMatch = match.match(/\*\*(\d+)\.png\*\*:\s*(.+)/s);

      if (itemMatch) {
        const [, imageNumber, description] = itemMatch;
        const imageCounter = parseInt(imageNumber);

        console.log(`✅ 이미지 ${imageCounter} 파싱 성공`);
        console.log(`- 파일명: ${imageNumber}.png`);
        console.log(`- 설명: ${description.substring(0, 100)}...`);

        // 설명에서 크기 정보 추출 시도 (있다면)
        const sizeMatch = description.match(/(\d+)×(\d+)px/);
        const width = sizeMatch ? parseInt(sizeMatch[1]) : 600;
        const height = sizeMatch ? parseInt(sizeMatch[2]) : 400;

        images.push({
          id: `page-${page.pageNumber}-${imageCounter}`,
          fileName: `${imageCounter}.png`,
          path: `~/image/page${page.pageNumber}/${imageCounter}.png`,
          type: 'image',
          category: '교육 시각화',
          purpose: `교육 시각 자료 ${imageCounter}`,
          description: description.trim(),
          sizeGuide: `${width}×${height}px`,
          placement: {
            section: '메인 영역',
            position: imageCounter === 1 ? '중앙' : `위치${imageCounter}`,
            size: `${width}×${height}px`
          },
          accessibility: {
            altText: `${page.topic} 관련 교육 이미지`,
            caption: `${page.topic} 시각 자료`
          },
          aiPrompt: this.extractAIPromptFromDescription(description, page.topic)
        });
      } else {
        console.log(`❌ 이미지 항목 ${index + 1} 파싱 실패`);
      }
    });

    return images;
  }

  // 이미지 설명에서 AI 프롬프트 추출 또는 생성
  private extractAIPromptFromDescription(description: string, topic: string): string {
    // 설명이 영어로 시작하면 그대로 사용
    if (/^[A-Za-z]/.test(description.trim())) {
      return description.trim();
    }

    // 한국어 설명을 기반으로 영문 프롬프트 생성
    return `Educational illustration for ${topic}, detailed and clear visual representation with bright colors and simple design elements, suitable for students`;
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
      primary: emotionalContext.colorEmotions.primary,
      secondary: emotionalContext.colorEmotions.secondary,
      accent: emotionalContext.colorEmotions.accent
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
- Color Palette: Use ${colors.primary} as primary color, ${colors.secondary} as secondary, ${colors.accent} for highlights
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
        headings: '명확하고 자신감 있는',
        body: '편안하게 읽히는'
      },
      overallTone: visualIdentity.componentStyle
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