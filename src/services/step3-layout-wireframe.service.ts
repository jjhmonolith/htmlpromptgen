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
    designTokens: DesignTokens
  ): Promise<LayoutWireframe> {
    try {
      console.log('📐 Step3: 레이아웃 와이어프레임 병렬 생성 시작');
      console.log('📋 프로젝트 데이터:', projectData);
      console.log('🚀 병렬 처리로 속도 개선 중...');
      
      // 모든 페이지를 병렬로 처리
      const pagePromises = projectData.pages.map(async (page, index) => {
        console.log(`📄 페이지 ${page.pageNumber} 병렬 생성 시작: ${page.topic}`);
        
        try {
          // 가이드라인에 따른 새로운 두 블록 프롬프트 사용
          const prompt = this.createStructuredPageLayoutPrompt(page, projectData, visualIdentity, index);
          const response = await this.openAIService.generateCompletion(prompt, `Step3-Page${page.pageNumber}`);

          // 새로운 파서로 두 블록 추출
          const wireframeData = this.extractWireframeFromResponse(response.content, page.pageNumber);
          const layoutDescription = wireframeData
            ? (this.convertNewWireframeToDescription(wireframeData) || response.content)
            : response.content; // 파싱 실패 시 AI 응답 그대로 사용

          const pageProposal: PageLayoutProposal = {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: layoutDescription,
            wireframe: wireframeData, // 새로운 구조화된 데이터 추가
            generatedAt: new Date()
          };

          console.log(`✅ 페이지 ${page.pageNumber} 병렬 생성 완료`);
          return pageProposal;

        } catch (error) {
          console.error(`❌ 페이지 ${page.pageNumber} 생성 실패:`, error);
          throw error; // 에러를 상위로 전파
        }
      });
      
      console.log(`⏰ ${projectData.pages.length}개 페이지 병렬 처리 대기 중...`);
      const pageProposals = await Promise.all(pagePromises);
      
      // 페이지 번호순으로 정렬
      pageProposals.sort((a, b) => a.pageNumber - b.pageNumber);
      
      const result: LayoutWireframe = {
        layoutMode: projectData.layoutMode,
        pages: pageProposals,
        generatedAt: new Date()
      };
      
      console.log('🎯 Step3 병렬 생성 완료:', result);
      console.log(`⚡ 성능 개선: ${projectData.pages.length}개 페이지를 병렬 처리로 빠르게 완료`);
      return result;
      
    } catch (error) {
      console.error('❌ Step3 병렬 생성 실패:', error);
      throw error; // 에러를 상위로 전파하여 프론트에서 처리
    }
  }

  // Step3 품질 게이트 (경량·확실)
  validateStep3Result(result: LayoutWireframe): { isValid: boolean; corrections: any[]; diagnostics: any[] } {
    const corrections: any[] = [];
    const diagnostics: any[] = [];

    // 각 페이지에 대해 검증
    for (const page of result.pages) {
      const pageData = (page as any).wireframe; // 새로운 형식의 wireframe 데이터

      if (!pageData) continue;

      // 4.1 Step 3 게이트
      // LAYOUT 검증
      if (pageData.version !== 'wire.v1') {
        corrections.push({ type: 'version', pageId: page.pageId, fix: 'wire.v1' });
        diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: VERSION 보정` });
      }

      if (!['scrollable', 'fixed'].includes(pageData.viewportMode)) {
        corrections.push({ type: 'viewportMode', pageId: page.pageId, fix: 'scrollable' });
        diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: VIEWPORT_MODE 보정` });
      }

      // FLOW 패턴 검증
      const flowPattern = /^[A-E]:(intro|keyMessage|content|compare|bridge)$/;
      if (!flowPattern.test(pageData.flow)) {
        corrections.push({ type: 'flow', pageId: page.pageId, fix: 'C:content' });
        diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: FLOW 패턴 보정` });
      }

      // SECTION 최소 5개 검증
      if (!pageData.sections || pageData.sections.length < 5) {
        corrections.push({ type: 'minSections', pageId: page.pageId, needed: 5 - (pageData.sections?.length || 0) });
        diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: 섹션 부족, 자동 추가 예정` });
      }

      // IMG_BUDGET 검증
      if (pageData.imgBudget > 2) {
        corrections.push({ type: 'imgBudget', pageId: page.pageId, fix: 2 });
        diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: IMG_BUDGET 초과, 2로 제한` });
      }

      // SLOTS 검증
      if (pageData.slots) {
        const sectionsMap = new Set(pageData.sections?.map(s => s.id) || []);
        for (const slot of pageData.slots) {
          if (!sectionsMap.has(slot.section)) {
            corrections.push({ type: 'orphanSlot', pageId: page.pageId, slotId: slot.id, section: slot.section });
            diagnostics.push({ type: 'error', message: `페이지 ${page.pageNumber}: 슬롯 ${slot.id}의 섹션 ${slot.section} 부재` });
          }
        }

        // 8+4 섹션에는 gridSpan 지정 필수
        const grid8Plus4Sections = pageData.sections?.filter(s => s.grid === '8+4') || [];
        for (const section of grid8Plus4Sections) {
          const sectionSlots = pageData.slots.filter(slot => slot.section === section.id);
          const hasGridSpan = sectionSlots.some(slot => slot.gridSpan);

          if (!hasGridSpan && sectionSlots.length > 0) {
            corrections.push({ type: 'missingGridSpan', pageId: page.pageId, sectionId: section.id });
            diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: 8+4 섹션 ${section.id}에 gridSpan 부재` });
          }
        }

        // imageSlots 개수 검증
        const imageSlots = pageData.slots.filter(slot => slot.type === 'image');
        if (imageSlots.length > pageData.imgBudget) {
          corrections.push({ type: 'excessImageSlots', pageId: page.pageId, excess: imageSlots.length - pageData.imgBudget });
          diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: 이미지 슬롯 초과, 뒤에서 제거` });
        }

        // SUMMARY 수치 일치 검증
        if (pageData.summary) {
          const actualSections = pageData.sections?.length || 0;
          const actualSlots = pageData.slots?.length || 0;
          const actualImageSlots = imageSlots.length;

          if (pageData.summary.sections !== actualSections) {
            diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: SUMMARY sections 불일치 (${pageData.summary.sections} vs ${actualSections})` });
          }
          if (pageData.summary.slots !== actualSlots) {
            diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: SUMMARY slots 불일치 (${pageData.summary.slots} vs ${actualSlots})` });
          }
          if (pageData.summary.imageSlots !== actualImageSlots) {
            diagnostics.push({ type: 'warning', message: `페이지 ${page.pageNumber}: SUMMARY imageSlots 불일치 (${pageData.summary.imageSlots} vs ${actualImageSlots})` });
          }
        }
      }
    }

    const isValid = corrections.filter(c => c.type !== 'warning').length === 0;
    return { isValid, corrections, diagnostics };
  }

  // 보정 사항 적용
  applyCorrections(result: LayoutWireframe, corrections: any[]): LayoutWireframe {
    const corrected = JSON.parse(JSON.stringify(result)); // Deep copy

    for (const correction of corrections) {
      const page = corrected.pages.find(p => p.pageId === correction.pageId);
      if (!page || !(page as any).wireframe) continue;

      const pageData = (page as any).wireframe;

      switch (correction.type) {
        case 'version':
          pageData.version = correction.fix;
          break;

        case 'viewportMode':
          pageData.viewportMode = correction.fix;
          break;

        case 'flow':
          pageData.flow = correction.fix;
          break;

        case 'imgBudget':
          pageData.imgBudget = correction.fix;
          break;

        case 'minSections':
          // 기본 섹션 자동 추가 (스켈레톤)
          if (!pageData.sections) pageData.sections = [];
          for (let i = 0; i < correction.needed; i++) {
            pageData.sections.push({
              id: `secAuto${i + 1}`,
              role: 'content',
              grid: '1-12',
              height: 'auto',
              gapBelow: 64,
              hint: '자동 추가된 스켈레톤 섹션'
            });
          }
          break;

        case 'excessImageSlots':
          // 초과 이미지 슬롯 제거
          if (pageData.slots) {
            const imageSlots = pageData.slots.filter(slot => slot.type === 'image');
            const slotsToRemove = imageSlots.slice(-correction.excess);
            pageData.slots = pageData.slots.filter(slot => !slotsToRemove.includes(slot));
          }
          break;

        case 'missingGridSpan':
          // 8+4 섹션의 슬롯에 gridSpan 자동 배정
          if (pageData.slots) {
            const sectionSlots = pageData.slots.filter(slot => slot.section === correction.sectionId);
            sectionSlots.forEach((slot, index) => {
              slot.gridSpan = index % 2 === 0 ? 'left' : 'right';
            });
          }
          break;

        case 'orphanSlot':
          // 고아 슬롯 제거
          if (pageData.slots) {
            pageData.slots = pageData.slots.filter(slot => slot.id !== correction.slotId);
          }
          break;
      }
    }

    return corrected;
  }

  private createPageLayoutPrompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): string {
    // 전체 페이지 흐름 정보 생성
    const allPages = projectData.pages.map((p, idx) => 
      `${p.pageNumber}. ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    // 이전/다음 페이지 정보
    const prevPage = pageIndex > 0 ? projectData.pages[pageIndex - 1] : null;
    const nextPage = pageIndex < projectData.pages.length - 1 ? projectData.pages[pageIndex + 1] : null;

    // 페이지 위치에 따른 역할과 FLOW 정의
    const getPageFlow = (index: number, total: number) => {
      if (index === 0) return 'A:intro';
      if (index === total - 1) return 'E:bridge';
      if (index === 1) return 'B:keyMessage';
      if (index === 2) return 'C:content';
      return 'D:compare';
    };

    const pageFlow = getPageFlow(pageIndex, projectData.pages.length);
    const pageRole = pageFlow.split(':')[1];

    return `당신은 웹 페이지 레이아웃 설계 전문가입니다. 주어진 교육 콘텐츠에 대한 와이어프레임 구조를 생성해주세요.

**프로젝트 정보:**
- 제목: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 페이지 ${page.pageNumber}/${projectData.pages.length}: ${page.topic}
- 역할: ${pageRole}
- 레이아웃 모드: ${projectData.layoutMode}

**전체 학습 흐름:**
${allPages}

**디자인 토큰:**
- 주색상: ${visualIdentity.colorPalette.primary}
- 보조색상: ${visualIdentity.colorPalette.secondary || '#50E3C2'}
- 강조색상: ${visualIdentity.colorPalette.accent || '#F5A623'}
- 컴포넌트: ${visualIdentity.componentStyle}

**연결 맥락:**
${prevPage ? `이전: "${prevPage.topic}"에서 연결` : '첫 페이지 - 학습 시작점'}
${nextPage ? `다음: "${nextPage.topic}"로 전환 준비` : '마지막 페이지 - 학습 마무리'}

**요청사항:**
다음 형식으로 페이지 와이어프레임을 생성해주세요:

**출력 형식:**
- 첫 줄: VERSION=wire.v1
- 다음 줄: VIEWPORT_MODE=${projectData.layoutMode}
- 다음 줄: FLOW=${pageFlow}
- 다음 줄들: SECTION 정의 (최소 3개, 최대 6개)
  * SECTION, id=header, role=title, grid=1-12, height=120, content=제목+부제목, gapBelow=32
  * SECTION, id=main, role=content, grid=8+4, height=auto, content=텍스트+이미지, gapBelow=48
  * SECTION, id=footer, role=navigation, grid=3-10, height=80, content=연결+버튼, gapBelow=0

**규칙:**
- grid 형식: "1-12"(전체폭) 또는 "8+4"(좌우분할) 또는 "2-11"(여백포함)
- height: 숫자(px) 또는 auto
- content: 해당 섹션에 들어갈 구체적 내용 명시
- role: title/subtitle/content/visual/interactive/navigation/summary
- gapBelow: 다음 섹션과의 간격(px)

위 형식에 맞춰 와이어프레임을 생성해주세요. 코드 블록으로 감싸서 답변해주세요.`;
  }

  // Structured Output용 JSON Schema 정의
  private createWireframeSchema() {
    return {
      type: "object",
      properties: {
        version: {
          type: "string",
          enum: ["wire.v1"]
        },
        viewportMode: {
          type: "string",
          enum: ["scrollable", "fixed"]
        },
        flow: {
          type: "string",
          pattern: "^[A-E]:(intro|keyMessage|content|compare|bridge)$"
        },
        sections: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                minLength: 1
              },
              role: {
                type: "string",
                enum: ["title", "subtitle", "content", "visual", "interactive", "navigation", "summary"]
              },
              grid: {
                type: "string",
                pattern: "^(([1-9]|1[0-2])-([1-9]|1[0-2]))|([1-9]|1[0-2])\\+([1-9]|1[0-2])$"
              },
              height: {
                type: "string",
                description: "Height in pixels (e.g., '200') or 'auto'"
              },
              content: {
                type: "string",
                minLength: 1
              },
              gapBelow: {
                type: "string",
                pattern: "^[0-9]+$"
              }
            },
            required: ["id", "role", "grid", "height", "content", "gapBelow"],
            additionalProperties: false
          }
        }
      },
      required: ["version", "viewportMode", "flow", "sections"],
      additionalProperties: false
    };
  }

  // 가이드라인에 따른 새로운 Step3 프롬프트 생성 - 두 블록 출력
  private createStructuredPageLayoutPrompt(
    page: { id: string; pageNumber: number; topic: string; description?: string },
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageIndex: number
  ): string {
    // 전체 페이지 흐름 정보 생성
    const allPages = projectData.pages.map((p, idx) =>
      `${p.pageNumber}. ${p.topic}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n');

    // 이전/다음 페이지 정보
    const prevPage = pageIndex > 0 ? projectData.pages[pageIndex - 1] : null;
    const nextPage = pageIndex < projectData.pages.length - 1 ? projectData.pages[pageIndex + 1] : null;

    // 페이지 위치에 따른 역할과 FLOW 정의
    const getPageFlow = (index: number, total: number) => {
      if (index === 0) return 'A:intro';
      if (index === total - 1) return 'E:bridge';
      if (index === 1) return 'B:keyMessage';
      if (index === 2) return 'C:content';
      return 'D:compare';
    };

    const pageFlow = getPageFlow(pageIndex, projectData.pages.length);
    const pageRole = pageFlow.split(':')[1];

    // 창의 토큰 (Step 2에서 받은 값 활용)
    const creativeTokens = {
      shapeLanguage: 'geometric',
      rhythm: 'balanced',
      asymmetry: 'moderate',
      imageStyle: 'diagram',
      accentUsage: 'selective',
      voiceProfile: 'coach'
    };

    return `당신은 웹 페이지 레이아웃 설계 전문가입니다. 주어진 교육 콘텐츠에 대한 와이어프레임 구조를 생성해주세요.

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

**창의 토큰 (선택):**
- shapeLanguage: ${creativeTokens.shapeLanguage}
- rhythm: ${creativeTokens.rhythm}
- asymmetry: ${creativeTokens.asymmetry}
- imageStyle: ${creativeTokens.imageStyle}
- accentUsage: ${creativeTokens.accentUsage}
- voiceProfile: ${creativeTokens.voiceProfile}

**연결 맥락:**
${prevPage ? `이전: "${prevPage.topic}"에서 연결` : '첫 페이지 - 학습 시작점'}
${nextPage ? `다음: "${nextPage.topic}"로 전환 준비` : '마지막 페이지 - 학습 마무리'}

**중요한 제약사항:**
- 이 페이지들은 교육 플랫폼에서 별도 등록되어 플랫폼의 네비게이션 시스템을 사용합니다
- 페이지 내에 "다음 페이지로", "이전 페이지로", "목차로" 등의 네비게이션 버튼을 포함하지 마세요
- 사용자 입력 폼이나 다른 페이지와 데이터를 공유하는 상호작용 요소는 생성하지 마세요
- 플랫폼에서 제공하는 네비게이션을 활용하므로 페이지 내 이동 기능은 불필요합니다

**출력 형식:**
다음 두 블록 형식으로 ${page.topic} 주제에 맞는 와이어프레임을 생성해주세요:

**첫 번째 블록 (레이아웃):**
BEGIN_S3_LAYOUT
VERSION=wire.v1
VIEWPORT_MODE=${projectData.layoutMode}
FLOW=${pageFlow}
PAGE_STYLE=pattern=[적절한값],motif=[적절한값],rhythm=${creativeTokens.rhythm},asymmetry=${creativeTokens.asymmetry}
SECTION, id=[고유ID], role=[역할], grid=[그리드], height=auto, gapBelow=[간격], hint="[설명]"
(섹션을 3-6개 생성)
IMG_BUDGET=[0-3]
END_S3_LAYOUT

**두 번째 블록 (슬롯):**
BEGIN_S3_SLOTS
SLOT, id=[슬롯ID], section=[섹션ID], type=[타입], variant=[스타일]
(각 섹션에 맞는 슬롯들 생성)
SUMMARY, sections=[섹션수], slots=[슬롯수], imageSlots=[이미지슬롯수]
END_S3_SLOTS

**참고 규칙:**
- FLOW: ${pageFlow} (페이지 역할에 맞게)
- SECTION role: intro/keyMessage/content/compare/bridge 중 선택
  * bridge 역할: 해당 페이지 내용의 요약/정리 (다른 페이지 연결 아님)
- SECTION grid: 1-12 (전체폭) / 8+4 (좌우분할) / 2-11 (여백포함) / 3-10 (중앙정렬)
- SLOT type: heading/paragraph/card/image/caption
- IMG_BUDGET: 0-3 (이 페이지의 이미지 개수)
- 네비게이션 요소나 페이지 간 이동 기능은 생성하지 마세요

"${page.topic}" 주제에 특화된 와이어프레임을 생성해주세요.`;
  }

  // 가이드라인에 따른 Normalizer 및 새로운 파서 로직
  private normalizeResponse(content: string): string {
    // 3.1 Normalizer (S3/S4 공통, 파싱 전에 적용)
    let normalized = content;

    // 전각쉽표 „ → 임시 토큰으로 치환 후 파싱 → 복원
    const tempToken = '__FULL_WIDTH_COMMA__';
    normalized = normalized.replace(/，/g, tempToken);

    // 스마트 따옴표 → ASCII " ' 통일
    normalized = normalized.replace(/[“”]/g, '"');
    normalized = normalized.replace(/[‘’]/g, "'");

    // HTML 태그 제거(특히 hint, text)
    normalized = normalized.replace(/<[^>]*>/g, '');

    // 공백/탭/전각 콜론·쉽표 정규화
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.replace(/：/g, ':');
    normalized = normalized.replace(/，/g, ',');

    // 단위 대소문자 정규화(px/pt)
    normalized = normalized.replace(/PX/g, 'px');
    normalized = normalized.replace(/PT/g, 'pt');

    // 임시 토큰 복원
    normalized = normalized.replace(new RegExp(tempToken, 'g'), ',');

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
    const layoutLines = layoutContent.split('\n').filter(line => line.trim());
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
          // gapBelow → 숫자 변환, 범위 밖이면 64/80/96 중 가까운 값으로 스냅
          section.gapBelow = this.normalizeGapBelow(section.gapBelow);
          wireframe.sections.push(section);
        }
      } else if (trimmedLine.startsWith('IMG_BUDGET=')) {
        wireframe.imgBudget = parseInt(this.extractValue(trimmedLine)) || 2;
      }
    }

    // SLOTS 블록 파싱
    const slotsLines = slotsContent.split('\n').filter(line => line.trim());
    for (const line of slotsLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('SLOT,')) {
        const slot = this.parseRecordLine(trimmedLine);
        if (slot) {
          wireframe.slots.push(slot);
        }
      } else if (trimmedLine.startsWith('SUMMARY,')) {
        wireframe.summary = this.parseRecordLine(trimmedLine) || wireframe.summary;
      }
    }

    return wireframe;
  }

  // 정규식 기반 레코드 파싱
  private parseRecordLine(line: string): any {
    const record: any = {};

    // 정규식 (\w+)\s*=\s*("([^"]*)"|[^,]+) 반복 캐처
    const regex = /(\w+)\s*=\s*("([^"]*)"|[^,]+)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const key = match[1];
      const value = match[3] || match[2]; // 따옴표 내부 또는 전체 값
      record[key] = value.trim();
    }

    return Object.keys(record).length > 0 ? record : null;
  }

  // 값 추출 헬퍼
  private extractValue(line: string): string {
    const parts = line.split('=');
    return parts.length > 1 ? parts[1].trim() : '';
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

  // 레거시 파싱 (기존 형식 지원)
  private parseWireframeLines(lines: string[]): any {
    const wireframe = {
      version: 'wire.v1',
      viewportMode: 'scrollable',
      flow: '',
      sections: [] as any[]
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('VERSION=')) {
        wireframe.version = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('VIEWPORT_MODE=')) {
        wireframe.viewportMode = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('FLOW=')) {
        wireframe.flow = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('SECTION,')) {
        const section = this.parseSectionLine(trimmedLine);
        if (section) {
          wireframe.sections.push(section);
        }
      }
    }

    return wireframe;
  }

  // SECTION 라인을 파싱
  private parseSectionLine(line: string): any {
    const section: any = {};
    
    // "SECTION, id=header, role=title, grid=1-12, height=120, content=제목+부제목, gapBelow=32" 형식 파싱
    const parts = line.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part === 'SECTION') continue;
      
      const [key, value] = part.split('=');
      if (key && value) {
        section[key.trim()] = value.trim();
      }
    }
    
    return Object.keys(section).length > 0 ? section : null;
  }

  // 새로운 두 블록 형식 와이어프레임을 설명으로 변환
  private convertNewWireframeToDescription(wireframe: any): string {
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

      // grid 패턴에 따른 레이아웃 설명
      if (grid.includes('+')) {
        const [left, right] = grid.split('+');
        sectionDesc += `좌우 분할 레이아웃으로 ${hint}가 배치되며, `;
      } else if (grid === '1-12') {
        sectionDesc += `전체 폭을 활용하여 ${hint}가 배치되며, `;
      } else {
        sectionDesc += `중앙 정렬로 ${hint}가 배치되며, `;
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

  // 레거시 와이어프레임을 읽기 쉬운 설명으로 변환
  private convertWireframeToDescription(wireframe: any): string {
    if (!wireframe || !wireframe.sections || wireframe.sections.length === 0) {
      return null; // 기본 템플릿 대신 null 반환
    }

    const sections = wireframe.sections;
    let description = '';

    // 섹션별로 설명 생성
    sections.forEach((section: any, index: number) => {
      const role = section.role || 'content';
      const grid = section.grid || '1-12';
      const content = section.content || '콘텐츠';
      const height = section.height || 'auto';

      let sectionDesc = '';
      
      if (index === 0) {
        sectionDesc = `페이지 **상단**에는 `;
      } else if (index === sections.length - 1) {
        sectionDesc = ` **하단**에는 `;
      } else {
        sectionDesc = ` **중간 영역**에는 `;
      }

      // grid 패턴에 따른 레이아웃 설명
      if (grid.includes('+')) {
        const [left, right] = grid.split('+');
        sectionDesc += `좌우 분할 레이아웃으로 ${content}가 배치되며, `;
      } else if (grid === '1-12') {
        sectionDesc += `전체 폭을 활용하여 ${content}가 배치되며, `;
      } else {
        sectionDesc += `중앙 정렬로 ${content}가 배치되며, `;
      }

      // 역할에 따른 추가 설명
      switch (role) {
        case 'title':
          sectionDesc += `제목과 부제목이 강조되어 표시됩니다.`;
          break;
        case 'visual':
          sectionDesc += `시각적 요소와 이미지가 중심을 이룹니다.`;
          break;
        case 'interactive':
          sectionDesc += `사용자가 상호작용할 수 있는 요소들이 포함됩니다.`;
          break;
        case 'navigation':
          sectionDesc += `페이지 간 이동을 위한 네비게이션이 제공됩니다.`;
          break;
        default:
          sectionDesc += `핵심 내용이 효과적으로 전달됩니다.`;
      }

      description += sectionDesc;
    });

    // 레이아웃 모드에 따른 추가 설명
    if (wireframe.viewportMode === 'scrollable') {
      description += ' 스크롤 가능한 레이아웃으로 구성되어 충분한 콘텐츠 공간을 제공합니다.';
    } else {
      description += ' 고정 뷰포트 내에서 모든 내용을 효율적으로 배치합니다.';
    }

    return description;
  }

}