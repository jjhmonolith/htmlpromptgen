import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, ComponentLine, ImageLine, Step4ComponentPlan } from '../types/workflow.types';
import { LayoutWireframe, PageLayoutProposal } from './step3-layout-wireframe.service';

export class Step4ComponentPlanService {
  constructor(private openAIService: OpenAIService) {}

  async generateComponentPlan(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3: LayoutWireframe,
    pageIndex: number
  ): Promise<{ plan?: Step4ComponentPlan; rawResponse: string; parseError?: string }> {
    try {
      const page = step3.pages[pageIndex];
      const wireframe = (page as any).wireframe;

      console.log(`📋 Step4: 페이지 ${page.pageNumber} 컴포넌트 계획 생성 시작`);

      if (!wireframe || !wireframe.sections) {
        const error = '와이어프레임 데이터가 없습니다';
        console.error(`❌ 페이지 ${page.pageNumber}: ${error}`);
        return { rawResponse: '', parseError: error };
      }

      // 프롬프트 생성
      const prompt = this.buildPrompt(projectData, visualIdentity, wireframe, page);
      console.log('🚀 AI 요청 시작...');

      // AI 호출
      const response = await this.openAIService.generateCompletion(prompt, `Step4-Page${page.pageNumber}`);
      console.log('✅ AI 응답 받음:', response.content.slice(0, 200) + '...');

      // 파싱 시도
      const parsed = this.extractS4(response.content);

      if (!parsed) {
        // 파싱 실패 시 폴백 생성
        console.warn(`⚠️ 페이지 ${page.pageNumber}: 파싱 실패, 폴백 생성`);
        const fallback = this.synthesizeFallback(projectData, wireframe);
        return {
          plan: fallback,
          rawResponse: response.content,
          parseError: 'AI 응답 파싱 실패, 폴백 사용됨'
        };
      }

      // 검증 및 강제 보정
      const { plan, diagnostics } = this.coerceAndValidate(parsed, wireframe, projectData.contentMode);

      if (diagnostics.length > 0) {
        console.warn(`⚠️ 페이지 ${page.pageNumber} 보정 사항:`, diagnostics);
      }

      console.log(`✅ 페이지 ${page.pageNumber} 컴포넌트 계획 생성 완료`);

      return {
        plan: {
          version: 'cmp.v1',
          comps: plan.comps,
          images: plan.images,
          generatedAt: new Date()
        },
        rawResponse: response.content,
        parseError: diagnostics.length > 0 ? diagnostics.join('; ') : undefined
      };

    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 생성 실패:`, error);
      return {
        rawResponse: '',
        parseError: `생성 실패: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // 프롬프트 생성
  private buildPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    wireframe: any,
    page: PageLayoutProposal
  ): string {
    // Step3 섹션 요약
    const sectionsInfo = wireframe.sections.map((section: any) =>
      `${section.id}: role=${section.role}, grid=${section.grid}, hint="${section.hint || ''}"`
    ).join('\n');

    // 슬롯 힌트 (있다면)
    const slotsInfo = wireframe.slots ? wireframe.slots.map((slot: any) =>
      `${slot.type}(${slot.variant || 'default'}) in ${slot.section}`
    ).join(', ') : '';

    return `[ROLE] 당신은 교육 UI 컴포넌트 설계 전문가입니다.

[CONTEXT]
- 프로젝트: "${projectData.projectTitle}", 대상: "${projectData.targetAudience}"
- layoutMode=${projectData.layoutMode}, contentMode=${projectData.contentMode}
- VI 요약: mood=${visualIdentity.moodAndTone.join(',')}, primary=${visualIdentity.colorPalette.primary}, accent=${visualIdentity.colorPalette.accent}, baseSize=${visualIdentity.typography.baseSize}
- Wire(요약):
${sectionsInfo}
${slotsInfo ? `- slots 힌트: ${slotsInfo}` : ''}

[HARD RULES]
- 마커 밖 텍스트 금지. 코드펜스 금지. 한 줄=한 레코드.
- 이미지는 0~2장, filename은 1.png → 2.png 순서.
- 8+4 섹션 컴포넌트는 gridSpan=left|right 필수.
- contentMode=${projectData.contentMode}면 text는 ${projectData.contentMode === 'restricted' ? '"배치 지시문"으로만' : '1~2문장 확장 허용'}.

[FORMAT]
BEGIN_S4
VERSION=cmp.v1
COMP, id=c1, type=heading, variant=H1, section=${wireframe.sections[0]?.id || 'secA'}, role=intro, mode=${projectData.contentMode}, text="${projectData.contentMode === 'restricted' ? '제목 배치 영역' : page.pageTitle + ' 학습 목표 제시'}"
${wireframe.sections.find((s: any) => s.grid === '8+4') ? `COMP, id=c2, type=paragraph, variant=Body, section=${wireframe.sections.find((s: any) => s.grid === '8+4')?.id || 'secC'}, role=content, gridSpan=left, mode=${projectData.contentMode}, text="${projectData.contentMode === 'restricted' ? '좌측 본문 영역' : '핵심 개념 설명과 상세 내용'}"` : ''}
${wireframe.sections.find((s: any) => s.grid === '8+4') ? `COMP, id=c3, type=image, variant=none, section=${wireframe.sections.find((s: any) => s.grid === '8+4')?.id || 'secC'}, role=content, gridSpan=right, src=1.png` : ''}
${wireframe.imgBudget >= 1 ? `IMG, filename=1.png, purpose=diagram, section=${wireframe.sections.find((s: any) => s.grid === '8+4')?.id || wireframe.sections[0]?.id || 'secA'}, place=right, width=520, height=320, alt="핵심 개념 다이어그램", caption="학습 내용 시각화"` : ''}
END_S4

페이지 "${page.pageTitle}" 주제에 특화된 컴포넌트 계획을 생성해주세요.`;
  }

  // S4 블록 추출 및 파싱
  private extractS4(content: string): { comps: ComponentLine[], images: ImageLine[] } | null {
    try {
      // 정규화
      const normalized = this.normalizeResponse(content);

      // BEGIN_S4 ... END_S4 추출
      const match = normalized.match(/BEGIN_S4([\s\S]*?)END_S4/);
      if (!match) {
        console.warn('⚠️ BEGIN_S4 블록을 찾을 수 없음');
        return null;
      }

      const blockContent = match[1].trim();
      const lines = this.splitLinesSafely(blockContent);

      const comps: ComponentLine[] = [];
      const images: ImageLine[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('VERSION=')) {
          // 버전 확인만
          continue;
        } else if (trimmed.startsWith('COMP,')) {
          const comp = this.parseRecordLine(trimmed);
          if (comp && comp.id && comp.type && comp.section) {
            comps.push({
              id: comp.id,
              type: comp.type,
              variant: comp.variant,
              section: comp.section,
              role: comp.role || 'content',
              gridSpan: comp.gridSpan,
              mode: comp.mode || 'enhanced',
              text: comp.text,
              src: comp.src,
              width: comp.width ? parseInt(String(comp.width)) : undefined,
              height: comp.height ? parseInt(String(comp.height)) : undefined,
              slotRef: comp.slotRef
            });
          }
        } else if (trimmed.startsWith('IMG,')) {
          const img = this.parseRecordLine(trimmed);
          if (img && img.filename && img.section) {
            images.push({
              filename: img.filename as '1.png' | '2.png',
              purpose: img.purpose || 'diagram',
              section: img.section,
              place: img.place || 'center',
              width: parseInt(String(img.width)) || 520,
              height: parseInt(String(img.height)) || 320,
              alt: String(img.alt || '').slice(0, 80),
              caption: String(img.caption || '').slice(0, 80)
            });
          }
        }
      }

      return { comps, images };

    } catch (error) {
      console.error('❌ S4 파싱 오류:', error);
      return null;
    }
  }

  // 정규화 (Step3와 동일)
  private normalizeResponse(content: string): string {
    let normalized = content;

    // 개행 보존: CRLF → LF
    normalized = normalized.replace(/\r\n/g, '\n');

    // 전각 쉼표 임시 치환
    const TEMP = '__FULL_WIDTH_COMMA__';
    normalized = normalized.replace(/，/g, TEMP);

    // 스마트 따옴표 → ASCII
    normalized = normalized.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    // 코드펜스 제거
    normalized = normalized.replace(/```+/g, '');

    // HTML 태그 제거
    normalized = normalized.replace(/<[^>\n]*>/g, '');

    // 전각 콜론 → ASCII, 탭/폼피드만 공백화
    normalized = normalized.replace(/：/g, ':').replace(/[\t\f]+/g, ' ');

    // 임시 토큰 복원
    normalized = normalized.replace(new RegExp(TEMP, 'g'), ',');

    return normalized;
  }

  // 라인 안전 분리 (Step3와 동일)
  private splitLinesSafely(block: string): string[] {
    return block
      .replace(/\s*COMP,/g, '\nCOMP,')
      .replace(/\s*IMG,/g, '\nIMG,')
      .replace(/\s*VERSION=/g, '\nVERSION=')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }

  // 레코드 파싱 (Step3와 동일)
  private parseRecordLine(line: string): any {
    const record: any = {};

    const regex = /(\w+)\s*=\s*("([^"]*)"|[^,]+)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const key = match[1];
      const value = match[3] || match[2];
      record[key] = value.trim();
    }

    return Object.keys(record).length > 0 ? record : null;
  }

  // 검증 및 강제 보정
  private coerceAndValidate(
    parsed: { comps: ComponentLine[], images: ImageLine[] },
    wireframe: any,
    contentMode: string
  ): { plan: { comps: ComponentLine[], images: ImageLine[] }, diagnostics: string[] } {

    const diagnostics: string[] = [];
    const validSections = new Set(wireframe.sections.map((s: any) => s.id));

    // 컴포넌트 검증
    const validComps = parsed.comps.filter(comp => {
      if (!validSections.has(comp.section)) {
        diagnostics.push(`컴포넌트 ${comp.id}: 존재하지 않는 섹션 ${comp.section} 제거됨`);
        return false;
      }

      // 8+4 섹션에서 gridSpan 필수
      const section = wireframe.sections.find((s: any) => s.id === comp.section);
      if (section && section.grid === '8+4' && !comp.gridSpan) {
        comp.gridSpan = 'left'; // 기본값 설정
        diagnostics.push(`컴포넌트 ${comp.id}: gridSpan이 없어서 'left'로 설정됨`);
      }

      return true;
    });

    // 이미지 검증 (최대 2개)
    let validImages = parsed.images.filter(img => {
      if (!validSections.has(img.section)) {
        diagnostics.push(`이미지 ${img.filename}: 존재하지 않는 섹션 ${img.section} 제거됨`);
        return false;
      }

      // 파일명 강제
      if (!['1.png', '2.png'].includes(img.filename)) {
        diagnostics.push(`이미지 파일명 ${img.filename}이 잘못됨`);
        return false;
      }

      return true;
    });

    if (validImages.length > 2) {
      validImages = validImages.slice(0, 2);
      diagnostics.push('이미지가 2개를 초과하여 앞의 2개만 사용됨');
    }

    return {
      plan: { comps: validComps, images: validImages },
      diagnostics
    };
  }

  // 폴백 합성
  private synthesizeFallback(
    projectData: ProjectData,
    wireframe: any
  ): Step4ComponentPlan {
    console.log('🔄 폴백 컴포넌트 계획 생성 중...');

    const comps: ComponentLine[] = [];
    const images: ImageLine[] = [];

    const sections = wireframe.sections || [];

    // 기본 컴포넌트 생성
    sections.forEach((section: any, index: number) => {
      switch (section.role) {
        case 'intro':
          comps.push({
            id: `fallback-h-${index}`,
            type: 'heading',
            variant: 'H1',
            section: section.id,
            role: 'intro',
            mode: projectData.contentMode as 'enhanced' | 'restricted',
            text: projectData.contentMode === 'restricted' ? '제목 영역' : '학습 목표 제시'
          });
          break;

        case 'keyMessage':
          comps.push({
            id: `fallback-c-${index}`,
            type: 'card',
            variant: 'none',
            section: section.id,
            role: 'keyMessage',
            mode: projectData.contentMode as 'enhanced' | 'restricted',
            text: projectData.contentMode === 'restricted' ? '핵심 메시지 카드' : '핵심 개념 요약'
          });
          break;

        case 'content':
          if (section.grid === '8+4') {
            // 좌우 분할
            comps.push({
              id: `fallback-p-${index}`,
              type: 'paragraph',
              variant: 'Body',
              section: section.id,
              role: 'content',
              gridSpan: 'left',
              mode: projectData.contentMode as 'enhanced' | 'restricted',
              text: projectData.contentMode === 'restricted' ? '본문 영역' : '상세 설명 내용'
            });

            comps.push({
              id: `fallback-i-${index}`,
              type: 'image',
              variant: 'none',
              section: section.id,
              role: 'content',
              gridSpan: 'right',
              mode: projectData.contentMode as 'enhanced' | 'restricted',
              src: '1.png'
            });

            // 이미지 정보 추가
            if (images.length === 0 && wireframe.imgBudget >= 1) {
              images.push({
                filename: '1.png',
                purpose: 'diagram',
                section: section.id,
                place: 'right',
                width: 520,
                height: 320,
                alt: '핵심 개념 다이어그램',
                caption: '학습 내용 시각화'
              });
            }
          } else {
            // 전체 폭
            comps.push({
              id: `fallback-p-${index}`,
              type: 'paragraph',
              variant: 'Body',
              section: section.id,
              role: 'content',
              mode: projectData.contentMode as 'enhanced' | 'restricted',
              text: projectData.contentMode === 'restricted' ? '본문 내용' : '학습 내용 설명'
            });
          }
          break;

        default:
          comps.push({
            id: `fallback-p-${index}`,
            type: 'paragraph',
            variant: 'Body',
            section: section.id,
            role: section.role || 'content',
            mode: projectData.contentMode as 'enhanced' | 'restricted',
            text: projectData.contentMode === 'restricted' ? `${section.role} 영역` : `${section.role} 관련 내용`
          });
      }
    });

    return {
      version: 'cmp.v1',
      comps,
      images,
      generatedAt: new Date()
    };
  }
}