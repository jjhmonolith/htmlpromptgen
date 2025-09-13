import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, Step3IntegratedResult, Step3Section } from '../types/workflow.types';

// Local types for Step3 integrated design service
export interface ComponentLine {
  id: string;
  type: 'heading' | 'paragraph' | 'card' | 'image' | 'caption';
  variant?: string;
  section: string;
  role: 'title' | 'content';
  gridSpan?: 'left' | 'right';
  text?: string;
  src?: string;
  width?: number;
  height?: number;
  slotRef?: 'IMG1' | 'IMG2' | 'IMG3';
}

export interface ImageLine {
  filename: string;
  purpose: 'diagram' | 'comparison' | 'illustration';
  section: string;
  place: 'left' | 'right' | 'center';
  width: number;
  height: number;
  alt: string;
  caption: string;
  description: string;
  aiPrompt: string;
  style: string;
}

export class Step3IntegratedDesignService {
  constructor(private openAIService: OpenAIService) {}

  async generateIntegratedDesign(
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<Step3IntegratedResult> {
    console.log('🎯 Step3: 2단계 병렬 통합 디자인 생성 시작 (자동 재시도 포함)');
    console.log('🚀 Phase1: 모든 페이지 구조 설계 병렬 생성...');

    const result: Step3IntegratedResult = {
      layoutMode: projectData.layoutMode,
      pages: [],
      generatedAt: new Date()
    };

    // 초기 페이지 상태 설정
    const initialPages = projectData.pages.map((page, i) => ({
      pageId: page.id,
      pageTitle: page.topic,
      pageNumber: page.pageNumber,
      isGenerating: true,
      phase1Complete: false,
      phase2Complete: false,
      retryCount: 0,  // 재시도 횟수 추가
      generatedAt: new Date()
    }));
    result.pages = initialPages;

    // Phase1: 모든 페이지의 구조 설계를 병렬로 생성
    const phase1Promises = projectData.pages.map(async (page, index) => {
      console.log(`🔄 Phase1 - 페이지 ${page.pageNumber} 구조 설계 시작: ${page.topic}`);

      try {
        const phase1Result = await this.generatePhase1(projectData, visualIdentity, index);
        console.log(`✅ Phase1 - 페이지 ${page.pageNumber} 구조 설계 완료`);

        return {
          pageIndex: index,
          structure: phase1Result,
          success: true
        };
      } catch (error) {
        console.error(`❌ Phase1 - 페이지 ${page.pageNumber} 구조 설계 실패:`, error);
        return {
          pageIndex: index,
          error: error instanceof Error ? error.message : String(error),
          success: false
        };
      }
    });

    console.log(`⏰ Phase1: ${projectData.pages.length}개 페이지 구조 설계 병렬 처리 대기 중...`);
    const phase1Results = await Promise.all(phase1Promises);

    // Phase1 결과를 result에 반영
    phase1Results.forEach((phaseResult) => {
      const pageData = result.pages[phaseResult.pageIndex];
      if (phaseResult.success) {
        pageData.structure = phaseResult.structure;
        pageData.phase1Complete = true;

        // 디버그 정보 저장
        if (!pageData.debugInfo) {
          pageData.debugInfo = {};
        }
        pageData.debugInfo.phase1 = phaseResult.structure!.debugInfo;
      } else {
        pageData.parseError = phaseResult.error;
        pageData.isGenerating = false;
      }
    });

    console.log('🎯 Phase1 완료! Phase2: 각 페이지별 콘텐츠 생성 병렬 시작...');

    // Phase2: Phase1이 성공한 페이지들의 콘텐츠를 병렬로 생성
    const phase2Promises = phase1Results
      .filter(phaseResult => phaseResult.success)
      .map(async (phaseResult) => {
        const pageIndex = phaseResult.pageIndex;
        const page = projectData.pages[pageIndex];

        console.log(`🔄 Phase2 - 페이지 ${page.pageNumber} 콘텐츠 생성 시작`);

        try {
          const phase2Result = await this.generatePhase2(projectData, visualIdentity, phaseResult.structure!, pageIndex);
          console.log(`✅ Phase2 - 페이지 ${page.pageNumber} 콘텐츠 생성 완료`);

          return {
            pageIndex: pageIndex,
            content: phase2Result,
            success: true
          };
        } catch (error) {
          console.error(`❌ Phase2 - 페이지 ${page.pageNumber} 콘텐츠 생성 실패:`, error);
          return {
            pageIndex: pageIndex,
            error: error instanceof Error ? error.message : String(error),
            success: false
          };
        }
      });

    console.log(`⏰ Phase2: ${phase2Promises.length}개 페이지 콘텐츠 생성 병렬 처리 대기 중...`);
    const phase2Results = await Promise.all(phase2Promises);

    // Phase2 결과를 result에 반영
    phase2Results.forEach((phaseResult) => {
      const pageData = result.pages[phaseResult.pageIndex];
      if (phaseResult.success) {
        pageData.content = phaseResult.content;
        pageData.phase2Complete = true;

        // 디버그 정보 저장
        if (!pageData.debugInfo) {
          pageData.debugInfo = {};
        }
        pageData.debugInfo.phase2 = phaseResult.content!.debugInfo;
      } else {
        pageData.parseError = (pageData.parseError || '') + ' Phase2: ' + phaseResult.error;
      }
      pageData.isGenerating = false;
    });

    // 자동 재시도 로직: 파싱 실패한 페이지들을 재생성
    await this.handleParsingFailures(result, projectData, visualIdentity);

    console.log('🎯 Step3 2단계 병렬 통합 디자인 생성 완료');
    console.log(`⚡ 성능 개선: ${projectData.pages.length}개 페이지를 Phase1(구조) + Phase2(콘텐츠) 병렬 처리로 완료`);
    return result;
  }

  // Phase 1: 구조 설계 (기존 Step3 활용)
  private async generatePhase1(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): Promise<{
    sections: Step3Section[];
    flow: string;
    imgBudget: number;
    debugInfo: {
      prompt: string;
      response: string;
    };
  }> {
    const page = projectData.pages[pageIndex];
    const prompt = this.buildPhase1Prompt(page, projectData, visualIdentity, pageIndex);

    const response = await this.openAIService.generateCompletion(prompt, `Step3-Phase1-Page${page.pageNumber}`);

    // 기존 Step3의 안정적인 파싱 로직 활용
    const parsed = this.parseWireframeResponse(response.content);

    if (!parsed) {
      throw new Error('Phase1 파싱 실패');
    }

    return {
      sections: parsed.sections,
      flow: parsed.flow || 'C:content',
      imgBudget: Math.min(parsed.sections.filter(s => s.grid === '8+4').length, 3),
      debugInfo: {
        prompt: prompt,
        response: response.content
      }
    };
  }

  // Phase 2: 콘텐츠 생성 (기존 Step4 활용)
  private async generatePhase2(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    phase1Result: { sections: Step3Section[]; flow: string; imgBudget: number },
    pageIndex: number
  ): Promise<{
    components: ComponentLine[];
    images: ImageLine[];
    generatedAt: Date;
    debugInfo: {
      prompt: string;
      response: string;
    };
  }> {
    const page = projectData.pages[pageIndex];
    const prompt = this.buildPhase2Prompt(page, projectData, visualIdentity, phase1Result);

    const response = await this.openAIService.generateCompletion(prompt, `Step3-Phase2-Page${page.pageNumber}`);

    const parsed = this.parseContentResponse(response.content);

    if (!parsed) {
      throw new Error('Phase2 파싱 실패');
    }

    return {
      components: parsed.components,
      images: parsed.images,
      generatedAt: new Date(),
      debugInfo: {
        prompt: prompt,
        response: response.content
      }
    };
  }

  // Phase 1 프롬프트 (기존 Step3 방식 활용)
  private buildPhase1Prompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): string {
    const allPages = projectData.pages.map((p, idx) =>
      `${p.pageNumber}. ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    // 모든 페이지는 연결된 학습 내용으로 처리 (intro/bridge 제거)
    const pageFlow = 'C:content';

    return `당신은 웹 페이지 레이아웃 설계 전문가입니다. 연결된 프로젝트 수업의 한 페이지에 대한 와이어프레임 구조를 생성해주세요.

**프로젝트 정보:**
- 전체 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 현재 페이지 ${page.pageNumber}/${projectData.pages.length}: ${page.topic}
- 레이아웃 모드: ${projectData.layoutMode}

**전체 프로젝트 구성:** (연결된 수업 흐름)
${allPages}

**페이지 역할:**
이 페이지는 "${page.topic}" 내용을 다루는 강의 자료 페이지입니다.
PPT를 대체하는 강의용 자료로 사용되며, 학생들이 수업 중에 직접 보면서 사용합니다.
"오늘", "다음 시간", "마무리", "정리" 등의 네비게이션 표현은 사용하지 마세요.

**요청사항:**
다음 형식으로 페이지 와이어프레임을 생성해주세요:

**출력 형식:**
\`\`\`
VERSION=wire.v1
VIEWPORT_MODE=${projectData.layoutMode}
FLOW=${pageFlow}
SECTION, id=secA, role=title, grid=1-12, height=auto, hint=페이지 주제 제시, gapBelow=48
SECTION, id=secB, role=content, grid=8+4, height=auto, hint=핵심 개념 설명과 시각자료, gapBelow=64
SECTION, id=secC, role=content, grid=2-11, height=auto, hint=상세 내용과 예시, gapBelow=32
\`\`\`

**규칙:**
- 섹션 3-5개 생성
- grid: "1-12"(전체폭), "8+4"(좌우분할), "2-11"(여백포함), "3-10"(중앙집중)
- role: title/content (summary 제거 - 페이지별 마무리 콘텐츠 방지)
- hint: 해당 섹션의 구체적인 내용과 목적 설명
- 교육적 목적에 맞는 논리적 흐름 구성

위 형식에 정확히 맞춰 생성해주세요.`;
  }

  // Phase 2 프롬프트 (기존 Step4 방식 활용)
  private buildPhase2Prompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    phase1Result: { sections: Step3Section[]; flow: string; imgBudget: number }
  ): string {
    const sectionsInfo = phase1Result.sections.map(section =>
      `${section.id}: role=${section.role}, grid=${section.grid}, hint="${section.hint}"`
    ).join('\n');

    // 레이아웃별 콘텐츠 분량 제한
    const contentLimits = this.getContentLimits(projectData.layoutMode, page.topic);

    return `[ROLE] 당신은 교육 콘텐츠 작성 전문가입니다.

[CONTEXT]
- 프로젝트: "${projectData.projectTitle}", 대상: "${projectData.targetAudience}"
- 페이지 ${page.pageNumber}: "${page.topic}"
- 레이아웃: ${projectData.layoutMode}
${contentLimits.warning}

**섹션 구조:**
${sectionsInfo}

[HARD RULES]
- 마커 밖 텍스트 금지. 코드펜스 금지. 한 줄=한 레코드.
- 모든 text는 실제 교육 콘텐츠로 생성: ${contentLimits.textLimits}
- 대상="${projectData.targetAudience}"에 맞는 교육적 언어와 난이도 사용
- 강의 자료 스타일로 명확하고 간결하게 작성
- "오늘 배운", "다음 시간", "마무리", "정리" 등 네비게이션 표현 절대 금지
- 8+4 섹션 컴포넌트는 gridSpan=left|right 필수
${contentLimits.componentLimits}

[이미지 생성 필수 규칙]
- 이미지가 필요한 경우 반드시 COMP 라인과 IMG 라인을 모두 생성해야 합니다
- COMP 라인: type=image로 이미지 컴포넌트 정의 (레이아웃 위치, 참조 정보)
- IMG 라인: 이미지 메타데이터 정의 (생성용 프롬프트, 접근성 정보)
- 이미지 크기는 반드시 픽셀 단위로 지정: width=520, height=320 (숫자만, px 생략)
- 상대 단위(1, 2, 3, 4) 사용 금지 - 반드시 실제 픽셀값 사용

[FORMAT 규칙 - 중요]
**텍스트에 쉼표가 포함된 경우 반드시 따옴표로 감싸주세요**
- 쉼표 포함 텍스트는 따옴표 필수: text="내용1, 내용2, 내용3"
- 단순 텍스트는 따옴표 선택: text=내용 또는 text="내용"

BEGIN_CONTENT
VERSION=content.v1
COMP, id=컴포넌트ID, type=heading|paragraph|card|image, variant=H1|H2|Body|none, section=섹션ID, role=title|content, gridSpan=left|right(8+4섹션만), text="텍스트내용", src="파일명"
IMG, filename=파일명, purpose=diagram|illustration|comparison, section=섹션ID, place=left|right|center, width=픽셀값, height=픽셀값, alt="대체텍스트", caption="캡션", description="설명", aiPrompt="한글프롬프트", style="스타일"
END_CONTENT

"${page.topic}" 페이지의 교육 콘텐츠를 생성하세요:

[콘텐츠 생성 원칙]
- PPT를 대체하는 강의용 자료로, 강의자가 설명하면서 학생들이 함께 보는 자료
- "오늘 배운 내용", "다음 시간에는", "마무리", "정리" 등 네비게이션 표현 금지
- 전체 프로젝트 맥락에서 이 페이지의 역할을 고려하여 작성
- ${projectData.targetAudience}이 바로 활용할 수 있는 실무 중심 내용

[텍스트 가이드]
${contentLimits.detailedGuide}

전체 "${projectData.projectTitle}" 프로젝트의 흐름에 맞는 내용으로 작성하세요.

[이미지 파일명 규칙]
- 각 페이지별로 1.png, 2.png, 3.png... 순서로 간단한 숫자 인덱스 사용
- 최종 경로: ~/image/page${page.pageNumber}/1.png 형태로 구성됨
- 컴포넌트 src와 IMG filename은 동일하게 "숫자.png" 형식 사용

[이미지 생성 프롬프트 작성 규칙 - 상세 작성 필수]
- aiPrompt는 반드시 한글로 작성하되, 최소 100자 이상 상세하게 작성
- 다음 요소들을 모두 포함해야 함:
  * 주요 객체/인물: 무엇이 보이는지 구체적 묘사
  * 배경/환경: 어떤 공간, 상황에서 일어나는지
  * 색상 팔레트: 주요 색상과 전체적인 색감 (예: 파란색 계열, 따뜻한 톤, 현대적인 색상)
  * 스타일: 일러스트레이션/다이어그램/사진 스타일 등
  * 구성 방식: 레이아웃, 요소들의 배치, 시각적 흐름
  * 디테일 요소: 아이콘, 텍스트, 화살표, 테두리 등 보조 요소
- 교육적 효과를 높이는 시각적 요소 명시 (명확한 구분, 단계별 표현, 직관적 이해 등)
- "${page.topic}" 주제의 핵심 개념을 시각적으로 전달하는 구체적 방법 제시`;
  }

  // 레이아웃별 콘텐츠 분량 제한 설정
  private getContentLimits(layoutMode: 'fixed' | 'scrollable', pageTopic?: string) {
    const topic = pageTopic || "주제";

    if (layoutMode === 'fixed') {
      return {
        warning: "\n⚠️ **고정형 레이아웃 주의**: 한 페이지에 모든 내용이 들어가야 하므로 콘텐츠 분량을 매우 보수적으로 제한합니다.",
        textLimits: "H1(8-12자), H2(10-18자), paragraph(30-80자), card(20-50자)",
        componentLimits: "- 고정형 페이지 최대 컴포넌트: 5-7개 (섹션 3-4개, 컴포넌트 간소화)\n- paragraph는 최대 2개까지만 생성 (80자 이하 필수)\n- H2 소제목도 최대 2개까지 제한",
        detailedGuide: `- H1 제목: "${topic}" 핵심 주제 (8-12자, 간결)
- H2 소제목: 핵심 포인트만 (10-18자, 최대 2개)
- paragraph: 핵심 설명만 (30-80자, 최대 2개)
- card: 요점 정리 (20-50자, 1개 권장)
- caption: 이미지 설명 (10-20자)`
      };
    } else {
      return {
        warning: "\n📜 **스크롤형 레이아웃**: 세로 스크롤이 가능하므로 적당한 분량의 콘텐츠를 제공합니다.",
        textLimits: "H1(10-15자), H2(15-25자), paragraph(50-120자), card(30-70자)",
        componentLimits: "- 스크롤형 페이지 권장 컴포넌트: 6-10개 (섹션 4-5개)\n- paragraph는 3-4개까지 생성 가능 (120자 이하)",
        detailedGuide: `- H1 제목: "${topic}" 핵심 주제 (10-15자)
- H2 소제목: 세부 학습 포인트 (15-25자, 최대 3개)
- paragraph: 구체적 설명 (50-120자, 최대 4개)
- card: 핵심 요점 정리 (30-70자)
- caption: 이미지 설명 (15-30자)`
      };
    }
  }

  // 기존 Step3의 안정적인 파싱 로직 활용
  private parseWireframeResponse(content: string): { sections: Step3Section[]; flow: string } | null {
    try {
      const normalized = content.replace(/```/g, '').trim();
      const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);

      const sections: Step3Section[] = [];
      let flow = 'C:content';

      for (const line of lines) {
        if (line.startsWith('FLOW=')) {
          flow = line.replace('FLOW=', '');
        } else if (line.startsWith('SECTION,')) {
          const section = this.parseSectionLine(line);
          if (section) {
            sections.push(section);
          }
        }
      }

      return sections.length > 0 ? { sections, flow } : null;
    } catch (error) {
      console.error('와이어프레임 파싱 오류:', error);
      return null;
    }
  }

  private parseSectionLine(line: string): Step3Section | null {
    // parseRecordLine을 재사용하여 일관성 유지
    const parsed = this.parseRecordLine(line);

    if (parsed && parsed.id && parsed.role) {
      return {
        id: parsed.id,
        role: parsed.role as any,
        grid: parsed.grid || '1-12',
        height: parsed.height || 'auto',
        hint: parsed.hint || '',
        gapBelow: parseInt(parsed.gapBelow) || 48
      };
    }

    return null;
  }

  // 이미지 파일명을 간단한 숫자 인덱스로 정규화
  private normalizeImageFilename(filename: string, imageIndex: number): string {
    // image_1.png, image1.png, 1.png 등 모든 형태를 1.png로 통일
    return `${imageIndex}.png`;
  }

  // Phase 2 파싱 (기존 Step4 방식 활용)
  private parseContentResponse(content: string): { components: ComponentLine[]; images: ImageLine[] } | null {
    try {
      const normalized = content.replace(/```/g, '').trim();
      const match = normalized.match(/BEGIN_CONTENT([\s\S]*?)END_CONTENT/);

      if (!match) {
        console.warn('BEGIN_CONTENT 블록을 찾을 수 없음');
        return null;
      }

      const blockContent = match[1].trim();
      const lines = blockContent.split('\n').map(line => line.trim()).filter(Boolean);

      const components: ComponentLine[] = [];
      const images: ImageLine[] = [];
      let imageIndex = 1;

      for (const line of lines) {
        if (line.startsWith('VERSION=')) {
          continue;
        } else if (line.startsWith('COMP,')) {
          const comp = this.parseRecordLine(line);
          if (comp && comp.id && comp.type && comp.section) {
            // 이미지 컴포넌트의 src를 정규화
            let normalizedSrc = comp.src;
            if (comp.type === 'image' && comp.src) {
              normalizedSrc = this.normalizeImageFilename(comp.src, imageIndex);
            }

            components.push({
              id: comp.id,
              type: comp.type,
              variant: comp.variant,
              section: comp.section,
              role: comp.role || 'content',
              gridSpan: comp.gridSpan,
              text: comp.text,
              src: normalizedSrc,
              width: comp.width ? parseInt(String(comp.width)) : undefined,
              height: comp.height ? parseInt(String(comp.height)) : undefined,
              slotRef: comp.slotRef
            });

            // 이미지 컴포넌트일 경우 인덱스 증가
            if (comp.type === 'image') {
              imageIndex++;
            }
          }
        } else if (line.startsWith('IMG,')) {
          const img = this.parseRecordLine(line);
          if (img && img.filename && img.section) {
            // 이미지 파일명 정규화 (현재 인덱스 기준)
            const currentImageIndex = images.length + 1;
            const normalizedFilename = this.normalizeImageFilename(img.filename, currentImageIndex);

            // 이미지 크기 검증 및 정규화
            const parsedWidth = parseInt(String(img.width));
            const parsedHeight = parseInt(String(img.height));

            // 너무 작은 값(1-10)은 상대 단위로 간주하고 픽셀값으로 변환
            let finalWidth = parsedWidth;
            let finalHeight = parsedHeight;

            if (parsedWidth && parsedWidth <= 10) {
              console.warn(`⚠️ 이미지 ${normalizedFilename}: width=${parsedWidth}은 상대 단위로 추정됨. 520px로 변환`);
              finalWidth = 520;
            } else if (!parsedWidth || parsedWidth < 100) {
              finalWidth = 520; // 기본값
            }

            if (parsedHeight && parsedHeight <= 10) {
              console.warn(`⚠️ 이미지 ${normalizedFilename}: height=${parsedHeight}은 상대 단위로 추정됨. 320px로 변환`);
              finalHeight = 320;
            } else if (!parsedHeight || parsedHeight < 100) {
              finalHeight = 320; // 기본값
            }

            images.push({
              filename: normalizedFilename,
              purpose: img.purpose || 'diagram',
              section: img.section,
              place: img.place || 'center',
              width: finalWidth,
              height: finalHeight,
              alt: String(img.alt || '').slice(0, 80),
              caption: String(img.caption || '').slice(0, 80),
              description: String(img.description || '이미지 설명'),
              aiPrompt: String(img.aiPrompt || 'Create a relevant educational image'),
              style: String(img.style || 'modern educational')
            });
          }
        }
      }

      // 이미지 컴포넌트와 IMG 라인 일치성 검증
      this.validateImageConsistency(components, images);

      return { components, images };
    } catch (error) {
      console.error('콘텐츠 파싱 오류:', error);
      return null;
    }
  }

  private parseRecordLine(line: string): any {
    const record: any = {};

    // key=value를 찾기 위한 더 정교한 파싱
    // 다음 key= 패턴을 찾아서 value의 끝을 결정
    const keyPattern = /\s*(\w+)\s*=/g;
    const keys = [];
    let match;

    // 모든 키 위치 찾기
    while ((match = keyPattern.exec(line)) !== null) {
      keys.push({
        key: match[1],
        start: match.index,
        valueStart: keyPattern.lastIndex
      });
    }

    // 각 키-값 쌍 추출
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      const nextKey = keys[i + 1];

      // 값의 끝 위치 결정 (다음 키 직전까지 또는 줄 끝까지)
      const valueEnd = nextKey ? nextKey.start : line.length;
      let value = line.substring(currentKey.valueStart, valueEnd).trim();

      // 끝에 쉼표가 있으면 제거
      if (value.endsWith(',')) {
        value = value.slice(0, -1).trim();
      }

      // 따옴표 제거
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      record[currentKey.key] = value;
    }

    return Object.keys(record).length > 0 ? record : null;
  }

  // 이미지 컴포넌트와 IMG 라인 일치성 검증
  private validateImageConsistency(components: ComponentLine[], images: ImageLine[]): void {
    const imageComponents = components.filter(comp => comp.type === 'image');

    console.log(`📊 이미지 일치성 검증: COMP(type=image) ${imageComponents.length}개, IMG 라인 ${images.length}개`);

    // 1. 이미지 컴포넌트가 있는데 IMG 라인이 없는 경우 경고
    if (imageComponents.length > 0 && images.length === 0) {
      console.warn(`⚠️ 이미지 컴포넌트 ${imageComponents.length}개가 정의되었으나 IMG 라인이 없습니다.`);
      return;
    }

    // 2. IMG 라인이 있는데 이미지 컴포넌트가 없는 경우 경고
    if (images.length > 0 && imageComponents.length === 0) {
      console.warn(`⚠️ IMG 라인 ${images.length}개가 정의되었으나 이미지 컴포넌트(COMP type=image)가 없습니다.`);
      return;
    }

    // 3. 개수 불일치 검증
    if (imageComponents.length !== images.length) {
      console.warn(`⚠️ 이미지 개수 불일치: COMP(type=image) ${imageComponents.length}개 vs IMG 라인 ${images.length}개`);
    }

    // 4. src와 filename 매칭 검증
    for (const comp of imageComponents) {
      if (comp.src) {
        const matchingImg = images.find(img => img.filename === comp.src);
        if (!matchingImg) {
          console.warn(`⚠️ 이미지 컴포넌트 ${comp.id}의 src="${comp.src}"에 대응하는 IMG 라인을 찾을 수 없습니다.`);
        }
      }
    }

    for (const img of images) {
      const matchingComp = imageComponents.find(comp => comp.src === img.filename);
      if (!matchingComp) {
        console.warn(`⚠️ IMG 라인 "${img.filename}"에 대응하는 이미지 컴포넌트를 찾을 수 없습니다.`);
      }
    }

    if (imageComponents.length === images.length && imageComponents.length > 0) {
      console.log(`✅ 이미지 일치성 검증 완료: ${imageComponents.length}개 이미지가 올바르게 매칭됨`);
    }
  }

  // 페이지별 재생성 - Phase 1, 2 순차 실행
  async regeneratePage(
    result: Step3IntegratedResult,
    pageIndex: number,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<void> {
    const page = result.pages[pageIndex];
    const pageNumber = pageIndex + 1;

    try {
      console.log(`🔄 페이지 ${pageNumber} 재생성 시작 - Phase 1, 2 순차 실행`);

      page.isGenerating = true;
      page.phase1Complete = false;
      page.phase2Complete = false;
      page.parseError = undefined;
      page.content = undefined; // 기존 콘텐츠 초기화
      page.structure = undefined; // 기존 구조 초기화

      // Phase 1: 구조 설계 재생성
      console.log(`🏗️ 페이지 ${pageNumber} - Phase 1: 구조 설계 재생성 시작`);
      const phase1Result = await this.generatePhase1(projectData, visualIdentity, pageIndex);
      page.structure = phase1Result;
      page.phase1Complete = true;
      console.log(`✅ 페이지 ${pageNumber} - Phase 1 완료: ${phase1Result.sections.length}개 섹션, ${phase1Result.imgBudget}개 이미지 예산`);

      // Phase 2: 콘텐츠 상세 재생성
      console.log(`📝 페이지 ${pageNumber} - Phase 2: 콘텐츠 상세 재생성 시작`);
      const phase2Result = await this.generatePhase2(projectData, visualIdentity, phase1Result, pageIndex);
      page.content = phase2Result;
      page.phase2Complete = true;
      page.generatedAt = new Date();

      console.log(`✅ 페이지 ${pageNumber} - Phase 2 완료: ${phase2Result.components.length}개 컴포넌트, ${phase2Result.images.length}개 이미지`);
      console.log(`🎉 페이지 ${pageNumber} 재생성 완료!`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 페이지 ${pageNumber} 재생성 실패:`, errorMessage);
      page.parseError = errorMessage;
    } finally {
      page.isGenerating = false;
    }
  }

  // 파싱 실패 페이지 자동 재시도 처리
  private async handleParsingFailures(
    result: Step3IntegratedResult,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2초 대기

    let hasFailures = true;
    let retryRound = 1;

    while (hasFailures && retryRound <= MAX_RETRIES) {
      // 파싱 실패한 페이지 찾기
      const failedPages = result.pages.filter(page =>
        page.parseError &&
        page.retryCount < MAX_RETRIES &&
        (!page.phase1Complete || !page.phase2Complete)
      );

      if (failedPages.length === 0) {
        hasFailures = false;
        break;
      }

      console.log(`🔄 재시도 라운드 ${retryRound}: ${failedPages.length}개 페이지 파싱 실패 재생성 시작`);

      // 재시도할 페이지들을 다시 generating 상태로 설정
      failedPages.forEach(page => {
        page.isGenerating = true;
        page.retryCount = (page.retryCount || 0) + 1;
        page.parseError = undefined;
        console.log(`🔁 페이지 ${page.pageNumber} 재시도 (${page.retryCount}/${MAX_RETRIES})`);
      });

      // 지연 추가 (서버 부하 방지)
      if (retryRound > 1) {
        console.log(`⏰ ${RETRY_DELAY}ms 대기 중...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }

      // 실패한 페이지들을 병렬로 재생성
      const retryPromises = failedPages.map(async (page) => {
        const pageIndex = result.pages.findIndex(p => p.pageId === page.pageId);

        try {
          console.log(`🔄 페이지 ${page.pageNumber} 전체 재생성 시작`);

          // Phase 1 재생성
          if (!page.phase1Complete) {
            const phase1Result = await this.generatePhase1(projectData, visualIdentity, pageIndex);
            page.structure = phase1Result;
            page.phase1Complete = true;

            // 디버그 정보 저장
            if (!page.debugInfo) {
              page.debugInfo = {};
            }
            page.debugInfo.phase1 = phase1Result.debugInfo;

            console.log(`✅ 페이지 ${page.pageNumber} Phase1 재생성 완료`);
          }

          // Phase 2 재생성
          if (page.phase1Complete && !page.phase2Complete && page.structure) {
            const phase2Result = await this.generatePhase2(projectData, visualIdentity, page.structure, pageIndex);
            page.content = phase2Result;
            page.phase2Complete = true;

            // 디버그 정보 저장
            if (!page.debugInfo) {
              page.debugInfo = {};
            }
            page.debugInfo.phase2 = phase2Result.debugInfo;

            console.log(`✅ 페이지 ${page.pageNumber} Phase2 재생성 완료`);
          }

          console.log(`🎉 페이지 ${page.pageNumber} 재생성 성공!`);
          return { success: true, pageNumber: page.pageNumber };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ 페이지 ${page.pageNumber} 재생성 실패:`, errorMessage);
          page.parseError = `재시도 ${page.retryCount}: ${errorMessage}`;
          return { success: false, pageNumber: page.pageNumber, error: errorMessage };
        } finally {
          page.isGenerating = false;
        }
      });

      const retryResults = await Promise.all(retryPromises);

      const successCount = retryResults.filter(r => r.success).length;
      const failureCount = retryResults.filter(r => !r.success).length;

      console.log(`📊 재시도 라운드 ${retryRound} 결과: 성공 ${successCount}개, 실패 ${failureCount}개`);

      retryRound++;
    }

    // 최종 상태 확인
    const finalFailedPages = result.pages.filter(page =>
      page.parseError && (!page.phase1Complete || !page.phase2Complete)
    );

    if (finalFailedPages.length > 0) {
      console.warn(`⚠️ 최대 재시도 후에도 ${finalFailedPages.length}개 페이지 파싱 실패`);
      finalFailedPages.forEach(page => {
        console.warn(`  - 페이지 ${page.pageNumber}: ${page.parseError}`);
      });
    } else {
      console.log(`✅ 모든 페이지 파싱 성공! 총 ${result.pages.length}개 페이지 완료`);
    }
  }
}