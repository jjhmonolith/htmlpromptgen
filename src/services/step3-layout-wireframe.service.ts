import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';

// 가이드라인에 따른 새로운 페이지별 레이아웃 제안 타입
export interface PageLayoutProposal {
  pageId: string;
  pageTitle: string;
  pageNumber: number;
  layoutDescription: string; // 읽기용 산문
  wireframe?: {
    version: "wire.v1";
    viewportMode: "scrollable" | "fixed";
    flow: string; // "A:intro"|"B:keyMessage"|"C:content"|"D:compare"|"E:bridge"
    pageStyle?: {
      pattern: string;
      motif: string;
      rhythm: string;
      asymmetry: string;
    };
    sections: Array<{
      id: string; // "secA"|"secB"|"secC"|"secD"|"secE"
      role: "intro" | "keyMessage" | "content" | "compare" | "bridge";
      grid: "1-12" | "8+4" | "2-11" | "3-10";
      height: "auto";
      gapBelow: 64 | 80 | 96;
      hint: string;
    }>;
    slots?: Array<{
      id: string;
      section: string;
      type: "heading" | "paragraph" | "card" | "image" | "caption";
      variant?: string;
      gridSpan?: "left" | "right";
      slotRef?: "IMG1" | "IMG2" | "IMG3";
      width?: number;
      height?: number;
    }>;
    imgBudget: 0 | 1 | 2 | 3;
    summary?: {
      sections: number;
      slots: number;
      imageSlots: number;
    };
  };
  generatedAt: Date;
}

// Step3 결과 타입 - 페이지 배열로 단순화
export interface LayoutWireframe {
  layoutMode: 'scrollable' | 'fixed';
  pages: PageLayoutProposal[];
  generatedAt: Date;
}

export class Step3LayoutWireframeService {
  constructor(private openAIService: OpenAIService) {}

  async generateLayoutWireframe(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    _designTokens: DesignTokens
  ): Promise<LayoutWireframe> {
    try {
      console.log('📐 Step3: 2단계 병렬 와이어프레임 생성 시작');
      console.log('📋 프로젝트 데이터:', projectData);
      console.log('🚀 Phase1: 모든 페이지 Layout 구조 병렬 생성...');

      // Phase1: 모든 페이지의 Layout 구조를 병렬로 생성
      const phase1Promises = projectData.pages.map(async (page, index) => {
        console.log(`🔄 Phase1 - 페이지 ${page.pageNumber} Layout 생성 시작: ${page.topic}`);

        try {
          const layoutPrompt = this.createLayoutOnlyPrompt(page, projectData, visualIdentity, index);
          const response = await this.openAIService.generateCompletion(layoutPrompt, `Step3-Phase1-Page${page.pageNumber}`);

          const pageFlow = this.computePageFlow(index, projectData.pages.length);
          const layoutData = this.extractLayoutFromResponse(response.content, page.pageNumber, pageFlow);

          console.log(`✅ Phase1 - 페이지 ${page.pageNumber} Layout 완료`);

          return {
            page,
            index,
            pageFlow,
            layoutData,
            phase1CompletedAt: new Date()
          };

        } catch (error) {
          console.error(`❌ Phase1 - 페이지 ${page.pageNumber} Layout 실패:`, error);
          throw error;
        }
      });

      console.log(`⏰ Phase1: ${projectData.pages.length}개 페이지 Layout 병렬 처리 대기 중...`);
      const phase1Results = await Promise.all(phase1Promises);

      console.log('🎯 Phase1 완료! Phase2: 각 페이지별 Slots 병렬 생성...');

      // Phase2: Phase1 결과를 바탕으로 각 페이지의 Slots을 병렬로 생성
      const phase2Promises = phase1Results.map(async (phase1Result) => {
        const { page, layoutData } = phase1Result;
        console.log(`🔄 Phase2 - 페이지 ${page.pageNumber} Slots 생성 시작`);

        try {
          const slotsPrompt = this.createSlotsOnlyPrompt(page, layoutData, projectData, visualIdentity);
          const response = await this.openAIService.generateCompletion(slotsPrompt, `Step3-Phase2-Page${page.pageNumber}`);

          const slotsData = this.extractSlotsFromResponse(response.content, page.pageNumber);

          // Layout + Slots 결합하여 완전한 wireframe 생성
          const completeWireframe = this.combineLayoutAndSlots(layoutData, slotsData);

          // 안전한 산문 생성, 실패 시 폴백 사용
          const layoutDescription =
            this.convertNewWireframeToDescription(completeWireframe) ??
            this.createPlainDescriptionFallback(page.topic, projectData.layoutMode);

          const pageProposal: PageLayoutProposal = {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: layoutDescription,
            wireframe: completeWireframe,
            generatedAt: new Date()
          };

          console.log(`✅ Phase2 - 페이지 ${page.pageNumber} 완전 생성 완료`);
          return pageProposal;

        } catch (error) {
          console.error(`❌ Phase2 - 페이지 ${page.pageNumber} Slots 실패:`, error);

          // Phase2 실패 시 Phase1 결과만으로 기본 Slots 생성
          const fallbackWireframe = this.createFallbackWireframeWithSlots(layoutData, page.topic);
          const layoutDescription = this.createPlainDescriptionFallback(page.topic, projectData.layoutMode);

          return {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: layoutDescription,
            wireframe: fallbackWireframe,
            generatedAt: new Date()
          };
        }
      });

      console.log(`⏰ Phase2: ${projectData.pages.length}개 페이지 Slots 병렬 처리 대기 중...`);
      const pageProposals = await Promise.all(phase2Promises);

      // 페이지 번호순으로 정렬
      pageProposals.sort((a, b) => a.pageNumber - b.pageNumber);

      const result: LayoutWireframe = {
        layoutMode: projectData.layoutMode,
        pages: pageProposals,
        generatedAt: new Date()
      };

      console.log('🎯 Step3 2단계 병렬 생성 완료:', result);
      console.log(`⚡ 성능 개선: ${projectData.pages.length}개 페이지를 Phase1(Layout) + Phase2(Slots) 병렬 처리로 완료`);
      return result;

    } catch (error) {
      console.error('❌ Step3 2단계 병렬 생성 실패:', error);
      throw error;
    }
  }



  // Structured Output용 JSON Schema 정의 (미사용 - S4 유효성 참고용)
  // private createWireframeSchema() {
  //   return {
  //     type: "object",
  //     properties: {
  //       version: {
  //         type: "string",
  //         enum: ["wire.v1"]
  //       },
  //       viewportMode: {
  //         type: "string",
  //         enum: ["scrollable", "fixed"]
  //       },
  //       flow: {
  //         type: "string",
  //         pattern: "^[A-E]:(intro|keyMessage|content|compare|bridge)$"
  //       },
  //       sections: {
  //         type: "array",
  //         minItems: 3,
  //         maxItems: 6,
  //         items: {
  //           type: "object",
  //           properties: {
  //             id: {
  //               type: "string",
  //               minLength: 1
  //             },
  //             role: {
  //               type: "string",
  //               enum: ["title", "subtitle", "content", "visual", "interactive", "navigation", "summary"]
  //             },
  //             grid: {
  //               type: "string",
  //               pattern: "^(([1-9]|1[0-2])-([1-9]|1[0-2]))|([1-9]|1[0-2])\\+([1-9]|1[0-2])$"
  //             },
  //             height: {
  //               type: "string",
  //               description: "Height in pixels (e.g., '200') or 'auto'"
  //             },
  //             content: {
  //               type: "string",
  //               minLength: 1
  //             },
  //             gapBelow: {
  //               type: "string",
  //               pattern: "^[0-9]+$"
  //             }
  //           },
  //           required: ["id", "role", "grid", "height", "content", "gapBelow"],
  //           additionalProperties: false
  //         }
  //       }
  //     },
  //     required: ["version", "viewportMode", "flow", "sections"],
  //     additionalProperties: false
  //   };
  // }


  // Phase1: Layout만 생성하는 프롬프트
  private createLayoutOnlyPrompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): string {
    const allPages = projectData.pages.map((p, idx) =>
      `${p.pageNumber}. ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    const prevPage = pageIndex > 0 ? projectData.pages[pageIndex - 1] : null;
    const nextPage = pageIndex < projectData.pages.length - 1 ? projectData.pages[pageIndex + 1] : null;

    const pageFlow = this.computePageFlow(pageIndex, projectData.pages.length);
    const pageRole = pageFlow.split(':')[1];

    const creativeTokens = {
      shapeLanguage: 'geometric',
      rhythm: 'balanced',
      asymmetry: 'moderate',
      imageStyle: 'diagram',
      accentUsage: 'selective',
      voiceProfile: 'coach'
    };

    return `당신은 웹 페이지 레이아웃 설계 전문가입니다. Phase1에서는 페이지의 **섹션 구조만** 생성해주세요.

**프로젝트 정보:**
- 제목: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 페이지 ${page.pageNumber}/${projectData.pages.length}: ${page.topic}
- 역할: ${pageRole}
- 레이아웃 모드: ${projectData.layoutMode}
- 콘텐츠 모드: ${projectData.contentMode}

**전체 학습 흐름:**
${allPages}

**Step 2 비주얼 아이덴티티:**
- mood: ${visualIdentity.moodAndTone.join(', ')}
- colorPalette: primary=${visualIdentity.colorPalette.primary}, secondary=${visualIdentity.colorPalette.secondary}, accent=${visualIdentity.colorPalette.accent}
- typography: ${visualIdentity.typography.headingFont}, ${visualIdentity.typography.bodyFont}, ${visualIdentity.typography.baseSize}
- componentStyle: ${visualIdentity.componentStyle}

**창의 토큰:**
- shapeLanguage: ${creativeTokens.shapeLanguage}
- rhythm: ${creativeTokens.rhythm}
- asymmetry: ${creativeTokens.asymmetry}
- imageStyle: ${creativeTokens.imageStyle}
- accentUsage: ${creativeTokens.accentUsage}
- voiceProfile: ${creativeTokens.voiceProfile}

**연결 맥락:**
${prevPage ? `이전: "${prevPage.topic}"에서 연결` : '첫 페이지 - 학습 시작점'}
${nextPage ? `다음: "${nextPage.topic}"로 전환 준비` : '마지막 페이지 - 학습 마무리'}

**중요 제약사항:**
- 이 페이지들은 교육 플랫폼에서 별도 등록되어 플랫폼의 네비게이션 시스템을 사용합니다
- 페이지 내에 "다음 페이지로", "이전 페이지로", "목차로" 등의 네비게이션 버튼을 포함하지 마세요
- 사용자 입력 폼이나 다른 페이지와 데이터를 공유하는 상호작용 요소는 생성하지 마세요

**Phase1 출력 형식 (Layout 구조만):**
아래 형식으로만 답변해주세요. 다른 텍스트는 출력하지 마세요.

BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=${projectData.layoutMode}
FLOW=${pageFlow}
PAGE_STYLE=pattern=[적절한값],motif=[적절한값],rhythm=${creativeTokens.rhythm},asymmetry=${creativeTokens.asymmetry}
SECTION, id=[고유ID], role=[역할], grid=[그리드], height=auto, gapBelow=[간격], hint="[설명]"
(섹션을 3-6개 생성)
IMG_BUDGET=[0-3]
END_S3_LAYOUT

**참고 규칙:**
- SECTION role: intro/keyMessage/content/compare/bridge 중 선택
- SECTION grid: 1-12 (전체폭) / 8+4 (좌우분할) / 2-11 (여백포함) / 3-10 (중앙정렬)
- IMG_BUDGET: 0-3 (이 페이지의 이미지 개수)

"${page.topic}" 주제에 특화된 섹션 구조를 생성해주세요.`;
  }

  // Phase2: Slots만 생성하는 프롬프트
  private createSlotsOnlyPrompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    layoutData: any,
    _projectData: ProjectData,
    _visualIdentity: VisualIdentity
  ): string {
    const sectionsInfo = layoutData.sections?.map((s: any) =>
      `SECTION ${s.id}: role=${s.role}, grid=${s.grid}, hint="${s.hint}"`
    ).join('\n') || '';

    return `당신은 웹 페이지 슬롯 설계 전문가입니다. Phase2에서는 기존 섹션 구조에 맞는 **슬롯 배치만** 생성해주세요.

**페이지 정보:**
- 페이지 ${page.pageNumber}: ${page.topic}
- 이미지 예산: ${layoutData.imgBudget || 2}개

**기존 섹션 구조 (Phase1 결과):**
${sectionsInfo}

**Phase2 출력 형식 (Slots 배치만):**
아래 형식으로만 답변해주세요. 다른 텍스트는 출력하지 마세요.

BEGIN_S3_SLOTS
SLOT, id=[슬롯ID], section=[섹션ID], type=[타입], variant=[스타일]
(각 섹션에 맞는 슬롯들 생성)
SUMMARY, sections=${layoutData.sections?.length || 0}, slots=[슬롯수], imageSlots=[이미지슬롯수]
END_S3_SLOTS

**슬롯 타입:**
- heading: 제목 텍스트
- paragraph: 본문 텍스트
- card: 카드 형태 콘텐츠
- image: 이미지/다이어그램
- caption: 설명 텍스트

"${page.topic}" 주제와 기존 섹션 구조에 맞는 슬롯 배치를 생성해주세요.`;
  }

  // Layout 응답에서 Layout 데이터만 추출
  private extractLayoutFromResponse(responseContent: string, pageNumber: number, pageFlow: string): any {
    try {
      const normalized = this.normalizeResponse(responseContent);
      const layoutMatch = normalized.match(/BEGIN_S3_LAYOUT([\s\S]*?)END_S3_LAYOUT/);

      if (!layoutMatch) {
        console.warn(`⚠️ 페이지 ${pageNumber}: S3_LAYOUT 블록 없음, 기본 구조 사용`);
        return this.createMinimalLayoutData(pageFlow);
      }

      const layoutContent = layoutMatch[1].trim();
      return this.parseLayoutData(layoutContent);

    } catch (error) {
      console.error(`❌ 페이지 ${pageNumber} Layout 추출 실패:`, error);
      return this.createMinimalLayoutData(pageFlow);
    }
  }

  // Slots 응답에서 Slots 데이터만 추출
  private extractSlotsFromResponse(responseContent: string, pageNumber: number): any {
    try {
      const normalized = this.normalizeResponse(responseContent);
      const slotsMatch = normalized.match(/BEGIN_S3_SLOTS([\s\S]*?)END_S3_SLOTS/);

      if (!slotsMatch) {
        console.warn(`⚠️ 페이지 ${pageNumber}: S3_SLOTS 블록 없음, 기본 슬롯 사용`);
        return { slots: [], summary: { sections: 0, slots: 0, imageSlots: 0 } };
      }

      const slotsContent = slotsMatch[1].trim();
      return this.parseSlotsData(slotsContent);

    } catch (error) {
      console.error(`❌ 페이지 ${pageNumber} Slots 추출 실패:`, error);
      return { slots: [], summary: { sections: 0, slots: 0, imageSlots: 0 } };
    }
  }

  // Layout + Slots 데이터 결합
  private combineLayoutAndSlots(layoutData: any, slotsData: any): any {
    return {
      ...layoutData,
      slots: slotsData.slots || [],
      summary: slotsData.summary || { sections: layoutData.sections?.length || 0, slots: 0, imageSlots: 0 }
    };
  }

  // 최소 Layout 데이터 생성
  private createMinimalLayoutData(pageFlow: string): any {
    return {
      version: 'wire.v1',
      viewportMode: 'scrollable',
      flow: pageFlow,
      pageStyle: { pattern: 'baseline', motif: 'plain', rhythm: 'balanced', asymmetry: 'moderate' },
      sections: [
        { id: 'secA', role: 'intro', grid: '1-12', height: 'auto', gapBelow: 64, hint: '제목 및 소개' },
        { id: 'secB', role: 'keyMessage', grid: '2-11', height: 'auto', gapBelow: 64, hint: '핵심 메시지' },
        { id: 'secC', role: 'content', grid: '8+4', height: 'auto', gapBelow: 96, hint: '주요 내용' }
      ],
      imgBudget: 1
    };
  }

  // Layout 데이터 파싱
  private parseLayoutData(layoutContent: string): any {
    const layoutData = {
      version: 'wire.v1',
      viewportMode: 'scrollable',
      flow: '',
      pageStyle: {},
      sections: [] as any[],
      imgBudget: 2
    };

    const layoutLines = this.splitLinesSafely(layoutContent);
    for (const line of layoutLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('VERSION=')) {
        layoutData.version = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('VIEWPORT_MODE=')) {
        layoutData.viewportMode = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('FLOW=')) {
        layoutData.flow = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('PAGE_STYLE=')) {
        layoutData.pageStyle = this.parsePageStyle(this.extractValue(trimmedLine));
      } else if (trimmedLine.startsWith('SECTION,')) {
        const section = this.parseRecordLine(trimmedLine);
        if (section) {
          section.height = 'auto';
          section.gapBelow = this.normalizeGapBelow(section.gapBelow);
          const allowedGrids = new Set(['1-12','8+4','2-11','3-10']);
          if (!allowedGrids.has(section.grid)) section.grid = '1-12';
          layoutData.sections.push(section);
        }
      } else if (trimmedLine.startsWith('IMG_BUDGET=')) {
        layoutData.imgBudget = parseInt(this.extractValue(trimmedLine)) || 2;
      }
    }

    return layoutData;
  }

  // Slots 데이터 파싱
  private parseSlotsData(slotsContent: string): any {
    const slotsData = {
      slots: [] as any[],
      summary: { sections: 0, slots: 0, imageSlots: 0 }
    };

    const slotsLines = this.splitLinesSafely(slotsContent);
    for (const line of slotsLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('SLOT,')) {
        const slot = this.parseRecordLine(trimmedLine);
        if (slot) {
          if (slot.width !== undefined) slot.width = parseInt(String(slot.width), 10);
          if (slot.height !== undefined) slot.height = parseInt(String(slot.height), 10);
          slotsData.slots.push(slot);
        }
      } else if (trimmedLine.startsWith('SUMMARY,')) {
        const s = this.parseRecordLine(trimmedLine) || {};
        s.sections = parseInt(String(s.sections ?? '0'), 10);
        s.slots = parseInt(String(s.slots ?? '0'), 10);
        s.imageSlots = parseInt(String(s.imageSlots ?? '0'), 10);
        slotsData.summary = s;
      }
    }

    return slotsData;
  }

  // Phase2 실패 시 fallback 와이어프레임 생성
  private createFallbackWireframeWithSlots(layoutData: any, _topic: string): any {
    const fallbackSlots = [
      { id: 'secA-h1', section: 'secA', type: 'heading', variant: 'H1' }
    ];

    // 섹션에 따라 기본 슬롯 추가
    if (layoutData.sections) {
      layoutData.sections.forEach((section: any) => {
        if (section.role === 'content' && section.grid === '8+4') {
          fallbackSlots.push({
            id: `${section.id}-image`,
            section: section.id,
            type: 'image',
            variant: 'diagram',
            width: 520,
            height: 320
          } as any);
        }
      });
    }

    return {
      ...layoutData,
      slots: fallbackSlots,
      summary: {
        sections: layoutData.sections?.length || 0,
        slots: fallbackSlots.length,
        imageSlots: fallbackSlots.filter(s => s.type === 'image').length
      }
    };
  }

  // 페이지 위치에 따른 FLOW 계산
  private computePageFlow(index: number, total: number): string {
    if (index === 0) return 'A:intro';
    if (index === total - 1) return 'E:bridge';
    if (index === 1) return 'B:keyMessage';
    if (index === 2) return 'C:content';
    return 'D:compare';
  }

  // 최소 합성 와이어프레임 생성
  private synthesizeMinimalWireframe(
    topic: string,
    layoutMode: 'scrollable' | 'fixed',
    flow: string
  ) {
    const layout = `BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=${layoutMode}
FLOW=${flow}
PAGE_STYLE=pattern=baseline,motif=plain,rhythm=balanced,asymmetry=moderate
SECTION, id=secA, role=intro, grid=1-12, height=auto, gapBelow=64, hint="제목 및 한줄 소개"
SECTION, id=secB, role=keyMessage, grid=2-11, height=auto, gapBelow=64, hint="핵심 메시지 카드"
SECTION, id=secC, role=content, grid=8+4, height=auto, gapBelow=96, hint="좌: 설명 / 우: 다이어그램"
SECTION, id=secD, role=compare, grid=1-12, height=auto, gapBelow=64, hint="간단 비교"
SECTION, id=secE, role=bridge, grid=3-10, height=auto, gapBelow=80, hint="요약 및 다음 학습 포인트"
IMG_BUDGET=1
END_S3_LAYOUT`;

    const slots = `BEGIN_S3_SLOTS
SLOT, id=secA-h1, section=secA, type=heading, variant=H1
SLOT, id=secC-right, section=secC, type=image, variant=diagram, gridSpan=right, slotRef=IMG1, width=520, height=320
SUMMARY, sections=5, slots=2, imageSlots=1
END_S3_SLOTS`;

    const layoutContent = layout.match(/BEGIN_S3_LAYOUT([\s\S]*?)END_S3_LAYOUT/)![1].trim();
    const slotsContent = slots.match(/BEGIN_S3_SLOTS([\s\S]*?)END_S3_SLOTS/)![1].trim();
    return this.parseNewWireframeFormat(layoutContent, slotsContent);
  }

  // 안전한 산문 폴백
  private createPlainDescriptionFallback(topic: string, mode: 'scrollable' | 'fixed'): string {
    const modeDescription = mode === 'scrollable'
      ? '스크롤 가능한 레이아웃으로 핵심 섹션을 순차적으로 제공합니다.'
      : '한 화면 내에 핵심 정보를 간결하게 배치합니다.';
    return `페이지 상단에 "${topic}" 주제를 인지시키는 소개 영역을 두고, 핵심 메시지와 본문, 간단 비교, 요약 순으로 전개합니다. ${modeDescription}`;
  }

  // 가이드라인에 따른 Normalizer 및 새로운 파서 로직
  private normalizeResponse(content: string): string {
    let normalized = content;

    // 개행 보존: CRLF → LF
    normalized = normalized.replace(/\r\n/g, '\n');

    // 전각 쉼표 임시 치환
    const TEMP = '__FULL_WIDTH_COMMA__';
    normalized = normalized.replace(/，/g, TEMP);

    // 스마트 따옴표 → ASCII (유니코드 이스케이프 사용)
    normalized = normalized.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    // 코드펜스 제거 (안전 가드)
    normalized = normalized.replace(/```+/g, '');

    // HTML 태그 제거 (한 줄 내)
    normalized = normalized.replace(/<[^>\n]*>/g, '');

    // 전각 콜론 → ASCII, 탭/폼피드만 공백화 (개행은 보존)
    normalized = normalized.replace(/：/g, ':').replace(/[\t\f]+/g, ' ');

    // 단위 대문자 정규화
    normalized = normalized.replace(/PX/g, 'px').replace(/PT/g, 'pt');

    // 임시 토큰 복원
    normalized = normalized.replace(new RegExp(TEMP, 'g'), ',');

    return normalized;
  }

  // 두 블록 추출 및 파싱
  private extractWireframeFromResponse(responseContent: string, pageNumber: number): any {
    try {
      const normalized = this.normalizeResponse(responseContent);

      // S3_LAYOUT 블록 찾기
      const layoutMatch = normalized.match(/BEGIN_S3_LAYOUT([\s\S]*?)END_S3_LAYOUT/);
      if (!layoutMatch) {
        console.warn(`⚠️ 페이지 ${pageNumber}: S3_LAYOUT 블록 없음`);
        return null;
      }

      // S3_SLOTS 블록 찾기
      const slotsMatch = normalized.match(/BEGIN_S3_SLOTS([\s\S]*?)END_S3_SLOTS/);
      if (!slotsMatch) {
        console.warn(`⚠️ 페이지 ${pageNumber}: S3_SLOTS 블록 없음`);
        return null;
      }

      const layoutContent = layoutMatch[1].trim();
      const slotsContent = slotsMatch[1].trim();

      console.log(`✅ 페이지 ${pageNumber}: 두 블록 추출 성공`);

      return this.parseNewWireframeFormat(layoutContent, slotsContent);

    } catch (error) {
      console.error(`❌ 페이지 ${pageNumber} 새 형식 파싱 실패:`, error);
      return null;
    }
  }

  // 한 줄 = 한 레코드 강제 분리 가드
  private splitLinesSafely(block: string): string[] {
    return block
      .replace(/\s*SECTION,/g, '\nSECTION,')
      .replace(/\s*SLOT,/g, '\nSLOT,')
      .replace(/\s*SUMMARY,/g, '\nSUMMARY,')
      .replace(/\s*IMG_BUDGET=/g, '\nIMG_BUDGET=')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }

  // 새로운 두 블록 형식 파싱
  private parseNewWireframeFormat(layoutContent: string, slotsContent: string): any {
    const wireframe = {
      version: 'wire.v1',
      viewportMode: 'scrollable',
      flow: '',
      pageStyle: {},
      sections: [] as any[],
      slots: [] as any[],
      imgBudget: 2,
      summary: { sections: 0, slots: 0, imageSlots: 0 }
    };

    // LAYOUT 블록 파싱
    const layoutLines = this.splitLinesSafely(layoutContent);
    for (const line of layoutLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('VERSION=')) {
        wireframe.version = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('VIEWPORT_MODE=')) {
        wireframe.viewportMode = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('FLOW=')) {
        wireframe.flow = this.extractValue(trimmedLine);
      } else if (trimmedLine.startsWith('PAGE_STYLE=')) {
        wireframe.pageStyle = this.parsePageStyle(this.extractValue(trimmedLine));
      } else if (trimmedLine.startsWith('SECTION,')) {
        const section = this.parseRecordLine(trimmedLine);
        if (section) {
          // SECTION 정책 강제
          section.height = 'auto'; // 규격 고정
          section.gapBelow = this.normalizeGapBelow(section.gapBelow);
          const allowedGrids = new Set(['1-12','8+4','2-11','3-10']);
          if (!allowedGrids.has(section.grid)) section.grid = '1-12';
          wireframe.sections.push(section);
        }
      } else if (trimmedLine.startsWith('IMG_BUDGET=')) {
        wireframe.imgBudget = parseInt(this.extractValue(trimmedLine)) || 2;
      }
    }

    // SLOTS 블록 파싱
    const slotsLines = this.splitLinesSafely(slotsContent);
    for (const line of slotsLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('SLOT,')) {
        const slot = this.parseRecordLine(trimmedLine);
        if (slot) {
          // 숫자 필드 타입 강제
          if (slot.width !== undefined) slot.width = parseInt(String(slot.width), 10);
          if (slot.height !== undefined) slot.height = parseInt(String(slot.height), 10);
          wireframe.slots.push(slot);
        }
      } else if (trimmedLine.startsWith('SUMMARY,')) {
        const s = this.parseRecordLine(trimmedLine) || {};
        // 숫자 필드 타입 강제
        s.sections = parseInt(String(s.sections ?? '0'), 10);
        s.slots = parseInt(String(s.slots ?? '0'), 10);
        s.imageSlots = parseInt(String(s.imageSlots ?? '0'), 10);
        wireframe.summary = s;
      }
    }

    return wireframe;
  }

  // 정규식 기반 레코드 파싱
  private parseRecordLine(line: string): any {
    const record: any = {};

    // 쉼표로 분할하되, 따옴표 안의 쉼표는 무시
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    // 각 파트에서 key=value 추출
    for (const part of parts) {
      const equalIndex = part.indexOf('=');
      if (equalIndex > 0) {
        const key = part.substring(0, equalIndex).trim();
        let value = part.substring(equalIndex + 1).trim();

        // 따옴표 제거
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        record[key] = value;
      }
    }

    return Object.keys(record).length > 0 ? record : null;
  }

  // 값 추출 헬퍼 (안전화)
  private extractValue(line: string): string {
    const idx = line.indexOf('=');
    return idx >= 0 ? line.slice(idx + 1).trim() : '';
  }

  // PAGE_STYLE 파싱
  private parsePageStyle(styleString: string): any {
    const style: any = {};
    const pairs = styleString.split(',');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        style[key.trim()] = value.trim();
      }
    }

    return style;
  }

  // gapBelow 정규화
  private normalizeGapBelow(value: string): number {
    const num = parseInt(value);
    if (isNaN(num)) return 64;

    // 범위 밖이면 64/80/96 중 가까운 값으로 스냅
    const validValues = [64, 80, 96];
    return validValues.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
  }


  // 한국어 조사 자동 매칭 헬퍼 함수
  private getJosa(word: string, josaType: 'eun_neun' | 'i_ga' | 'eul_reul'): string {
    const lastChar = word.charAt(word.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);

    // 한글이 아닌 경우 기본값
    if (lastCharCode < 0xAC00 || lastCharCode > 0xD7A3) {
      return josaType === 'eun_neun' ? '는' : josaType === 'i_ga' ? '가' : '을';
    }

    // 받침 유무 확인 (유니코드 계산)
    const hasBatchim = (lastCharCode - 0xAC00) % 28 !== 0;

    switch (josaType) {
      case 'eun_neun': return hasBatchim ? '은' : '는';
      case 'i_ga': return hasBatchim ? '이' : '가';
      case 'eul_reul': return hasBatchim ? '을' : '를';
      default: return '';
    }
  }

  // 새로운 두 블록 형식 와이어프레임을 설명으로 변환
  private convertNewWireframeToDescription(wireframe: any): string | null {
    if (!wireframe || !wireframe.sections || wireframe.sections.length === 0) {
      return null; // 기본 템플릿 대신 null 반환
    }

    const sections = wireframe.sections;
    const slots = wireframe.slots || [];
    let description = '';

    // 섹션별로 설명 생성
    sections.forEach((section: any, index: number) => {
      const role = section.role || 'content';
      const grid = section.grid || '1-12';
      const hint = section.hint || '콘텐츠';
      const height = section.height || 'auto';

      let sectionDesc = '';

      if (index === 0) {
        sectionDesc = `페이지 **상단**에는 `;
      } else if (index === sections.length - 1) {
        sectionDesc = ` **하단**에는 `;
      } else {
        sectionDesc = ` **중간 영역**에는 `;
      }

      // grid 패턴에 따른 레이아웃 설명 (조사 자동 매칭)
      if (grid.includes('+')) {
        const [left, right] = grid.split('+');
        sectionDesc += `좌우 분할 레이아웃으로 ${hint}${this.getJosa(hint, 'i_ga')} 배치되며, `;
      } else if (grid === '1-12') {
        sectionDesc += `전체 폭을 활용하여 ${hint}${this.getJosa(hint, 'i_ga')} 배치되며, `;
      } else {
        sectionDesc += `중앙 정렬로 ${hint}${this.getJosa(hint, 'i_ga')} 배치되며, `;
      }

      // 역할에 따른 추가 설명
      switch (role) {
        case 'intro':
          sectionDesc += `제목과 부제목이 강조되어 표시됩니다.`;
          break;
        case 'keyMessage':
          sectionDesc += `핵심 메시지가 카드 형태로 전달됩니다.`;
          break;
        case 'content':
          sectionDesc += `주요 학습 내용이 체계적으로 구성됩니다.`;
          break;
        case 'compare':
          sectionDesc += `비교 정보가 명확하게 제시됩니다.`;
          break;
        case 'bridge':
          sectionDesc += `다음 학습으로의 연결고리를 제공합니다.`;
          break;
        default:
          sectionDesc += `핵심 내용이 효과적으로 전달됩니다.`;
      }

      description += sectionDesc;
    });

    // 이미지 정보 추가
    const imageSlots = slots.filter((slot: any) => slot.type === 'image');
    if (imageSlots.length > 0) {
      description += ` 시각적 학습을 위해 ${imageSlots.length}개의 이미지와 다이어그램이 포함됩니다.`;
    }

    // 레이아웃 모드에 따른 추가 설명
    if (wireframe.viewportMode === 'scrollable') {
      description += ' 스크롤 가능한 레이아웃으로 구성되어 충분한 콘텐츠 공간을 제공합니다.';
    } else {
      description += ' 고정 뷰포트 내에서 모든 내용을 효율적으로 배치합니다.';
    }

    return description;
  }


}