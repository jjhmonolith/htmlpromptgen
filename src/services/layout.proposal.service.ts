import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity, LayoutProposal } from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class LayoutProposalService {
  private openaiService = OpenAIService.getInstance();

  // 공개 메서드로 단일 페이지 생성 노출
  async generateSinglePageLayoutInternal(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    page: any,
    existingPages: LayoutProposal[] = [],
    maxRetries: number = 2
  ): Promise<LayoutProposal> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    return this.generateSinglePageLayout(projectData, visualIdentity, page, existingPages, maxRetries);
  }

  async generateLayoutProposals(
    projectData: ProjectData, 
    visualIdentity: VisualIdentity,
    maxRetries: number = 2
  ): Promise<LayoutProposal[]> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    console.log(`🚀 ${projectData.pages.length}개 페이지 병렬 생성 시작`);
    
    // 모든 페이지에 대해 병렬로 API 호출 생성
    const pagePromises = projectData.pages.map(async (page, index) => {
      return this.generateSinglePageLayout(projectData, visualIdentity, page, [], maxRetries);
    });

    try {
      // 모든 페이지를 병렬로 처리
      const results = await Promise.allSettled(pagePromises);
      
      const layoutProposals: LayoutProposal[] = [];
      const failedPages: string[] = [];
      
      // 결과 처리
      results.forEach((result, index) => {
        const page = projectData.pages[index];
        
        if (result.status === 'fulfilled' && result.value) {
          layoutProposals.push(result.value);
          console.log(`✅ 페이지 ${page.pageNumber} (${page.topic}) 생성 완료`);
        } else {
          console.error(`❌ 페이지 ${page.pageNumber} (${page.topic}) 생성 실패:`, 
            result.status === 'rejected' ? result.reason : '알 수 없는 오류');
          
          failedPages.push(`페이지 ${page.pageNumber}: ${page.topic}`);
          
          // 실패한 페이지에 대해 폴백 응답 생성
          const fallbackData = this.generatePageFallbackResponse(projectData, page);
          const fallbackProposal: LayoutProposal = {
            pageId: page.id,
            pageTitle: fallbackData.pageTitle || page.topic,
            layoutDescription: fallbackData.layoutDescription || '',
            detailedElements: fallbackData.detailedElements || [],
            designSpecs: fallbackData.designSpecs || {},
            images: fallbackData.images || [],
            metadata: {
              pageNumber: page.pageNumber,
              totalPages: projectData.pages.length,
              generatedAt: new Date().toISOString(),
              tokensUsed: 0,
              fallback: true
            }
          };
          layoutProposals.push(fallbackProposal);
        }
      });
      
      // 페이지 번호 순으로 정렬
      layoutProposals.sort((a, b) => a.metadata.pageNumber - b.metadata.pageNumber);
      
      // 실행 결과 요약
      const successCount = layoutProposals.filter(p => !p.metadata.fallback).length;
      const fallbackCount = layoutProposals.filter(p => p.metadata.fallback).length;
      const totalTokens = layoutProposals.reduce((sum, p) => sum + (p.metadata.tokensUsed || 0), 0);
      
      console.group(`🎉 병렬 생성 완료 - 실행 요약`);
      console.log(`📊 전체 페이지: ${projectData.pages.length}개`);
      console.log(`✅ 성공: ${successCount}개`);
      console.log(`🔄 폴백: ${fallbackCount}개`);
      console.log(`💎 총 토큰: ${totalTokens.toLocaleString()}개`);
      console.log(`⚡ 평균 페이지당 토큰: ${Math.round(totalTokens / successCount || 0)}개`);
      
      if (failedPages.length > 0) {
        console.log(`⚠️ 실패한 페이지들:`);
        failedPages.forEach(page => console.log(`  - ${page}`));
      }
      console.groupEnd();
      
      return layoutProposals;
      
    } catch (error) {
      console.error('병렬 페이지 생성 중 심각한 오류:', error);
      throw new Error(`레이아웃 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private async generateSinglePageLayout(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    page: any,
    existingPages: LayoutProposal[] = [],
    maxRetries: number = 2
  ): Promise<LayoutProposal> {
    let lastError: Error | null = null;
    
    // 페이지별 재시도 루프
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`📄 페이지 ${page.pageNumber} (${page.topic}) - 시도 ${attempt}/${maxRetries + 1}`);
        
        // 해당 페이지에 특화된 상세 프롬프트 생성
        const prompt = this.buildDetailedPagePrompt(projectData, visualIdentity, page, existingPages);
        const response = await this.openaiService.generateCompletion(
          prompt, 
          `페이지 ${page.pageNumber} 상세 레이아웃 설계 - ${page.topic}`
        );
        
        // JSON 파싱 및 검증
        let parsedResponse;
        try {
          parsedResponse = this.parseAIResponse(response.content);
          console.log(`📄 페이지 ${page.pageNumber} JSON 파싱 성공`);
          
          // 단일 페이지 응답 검증
          if (!this.validatePageResponse(parsedResponse, page)) {
            throw new Error(`페이지 ${page.pageNumber} 응답 구조가 올바르지 않습니다`);
          }
          
        } catch (parseError) {
          console.error(`📄 페이지 ${page.pageNumber} JSON 파싱 실패:`, parseError);
          throw parseError;
        }

        // 토큰 사용량 로그
        if (response.usage) {
          console.log(`📄 페이지 ${page.pageNumber} 토큰: ${response.usage.total_tokens}`);
        }

        // 페이지 레이아웃 제안으로 변환
        const pageProposal: LayoutProposal = {
          pageId: page.id,
          pageTitle: parsedResponse.pageTitle || page.topic,
          layoutDescription: parsedResponse.layoutDescription || '',
          detailedElements: parsedResponse.detailedElements || [],
          designSpecs: parsedResponse.designSpecs || {},
          images: parsedResponse.images || [],
          metadata: {
            pageNumber: page.pageNumber,
            totalPages: projectData.pages.length,
            generatedAt: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0
          }
        };

        console.log(`✅ 페이지 ${page.pageNumber} 레이아웃 생성 성공`);
        return pageProposal;

      } catch (error) {
        console.error(`📄 페이지 ${page.pageNumber} 시도 ${attempt} 실패:`, error);
        
        if (attempt <= maxRetries) {
          console.log(`📄 페이지 ${page.pageNumber} 재시도 중...`);
          lastError = error instanceof Error ? error : new Error('알 수 없는 오류');
          
          // 재시도 전 잠시 대기 (병렬 처리에서 API 레이트 제한 방지)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        // 마지막 시도도 실패한 경우
        throw lastError || error;
      }
    }
    
    // 이 지점에 도달하면 모든 시도 실패
    throw lastError || new Error(`페이지 ${page.pageNumber} 레이아웃 생성에 실패했습니다`);
  }

  /**
   * 파싱된 응답의 유효성 검증
   */
  private validateParsedResponse(response: any, projectData: ProjectData): boolean {
    try {
      // 기본 구조 확인
      if (!response || !response.pages || !Array.isArray(response.pages)) {
        console.error('응답에 pages 배열이 없음');
        return false;
      }
      
      // 페이지 수 확인 (최소 1개, 최대 프로젝트 페이지 수)
      if (response.pages.length === 0) {
        console.error('pages 배열이 비어있음');
        return false;
      }
      
      // 각 페이지의 필수 필드 확인
      for (const page of response.pages) {
        if (!page.pageNumber || !page.pageTitle) {
          console.error('페이지 필수 필드 누락:', page);
          return false;
        }
        
        // 스크롤형인 경우 layoutDescription 필수
        if (projectData.layoutMode === 'scrollable' && !page.layoutDescription) {
          console.error('스크롤형 페이지에 layoutDescription 누락');
          return false;
        }
      }
      
      console.log('응답 검증 성공');
      return true;
      
    } catch (error) {
      console.error('응답 검증 중 오류:', error);
      return false;
    }
  }

  private buildPrompt(projectData: ProjectData, visualIdentity: VisualIdentity): string {
    // 스크롤형과 고정형에 따라 완전히 다른 프롬프트 사용
    if (projectData.layoutMode === 'scrollable') {
      return this.buildScrollablePrompt(projectData, visualIdentity);
    } else {
      return this.buildFixedPrompt(projectData, visualIdentity);
    }
  }

  buildDetailedPagePrompt(
    projectData: ProjectData, 
    visualIdentity: VisualIdentity, 
    currentPage: any,
    existingPages: LayoutProposal[] = []
  ): string {
    return `[ROLE]
당신은 교육용 웹페이지 레이아웃 전문가입니다. 이 업무는 교육 목적의 정당한 콘텐츠 설계입니다. 스텝1·2 결과(프로젝트 정보, 비주얼 아이덴티티)를 바탕으로, 지정된 페이지의 **정적 레이아웃**을 매우 구체적으로 설계하세요.

[INPUT]
- 프로젝트: ${projectData.projectTitle}
- 대상 학습자: ${projectData.targetAudience}
- 현재 페이지: ${currentPage.pageNumber} / ${projectData.pages.length}
- 현재 페이지 주제: "${currentPage.topic}"
- 레이아웃 모드: ${projectData.layoutMode === 'scrollable' ? '📜 스크롤 가능(1600px 폭, 세로 확장)' : '📐 고정형(1600x1000px)'}
- 콘텐츠 모드: ${projectData.contentMode === 'enhanced' ? '✨ AI 보강' : '📝 원본 유지'}
- 비주얼 아이덴티티:
  - 분위기: ${Array.isArray(visualIdentity.moodAndTone) ? visualIdentity.moodAndTone.join(', ') : visualIdentity.moodAndTone}
  - 색상: Primary ${visualIdentity.colorPalette.primary}, Secondary ${visualIdentity.colorPalette.secondary}, Accent ${visualIdentity.colorPalette.accent}, Text ${visualIdentity.colorPalette.text}, Background ${visualIdentity.colorPalette.background}
  - 타이포: 제목 ${visualIdentity.typography.headingFont}, 본문 ${visualIdentity.typography.bodyFont}, 기본 크기 ${visualIdentity.typography.baseSize}
  - 컴포넌트 스타일: ${visualIdentity.componentStyle}
- 흐름 맥락(참고): 다른 페이지 주제 목록 ${projectData.pages.map(p => `${p.pageNumber}.${p.topic}`).join(' / ')}

[STRICT OUTPUT SHAPE]
**반드시 아래 두 블록 순서로 출력합니다.**
1) [IMAGES_JSON] — 이미지 설명 **JSON만** 출력(유효 JSON, 주석/코드블록/여분 텍스트 금지)
2) 빈 줄 1개
3) [LAYOUT_TEXT] — **한국어 산문**으로만 작성(불릿·표·코드·JSON 금지)

[IMAGES_JSON — SCHEMA]
- 이미지 사용은 학습 이해에 **필수인 최소 개수(권장 1–2장, 최대 3장)**로 제한합니다.
- 파일명은 페이지별로 "1.png", "2.png", "3.png" 순서만 사용.
- placement는 **자연어 앵커**(예: "섹션 C 우측 4컬럼 영역")로 명확히 지시.
- 모든 치수는 **px**, 색상은 **HEX**로 표기.

{
  "images": [
    {
      "filename": "1.png",
      "alt": "이미지 대체텍스트(한국어, 80자 이내)",
      "purpose": "개념 다이어그램 | 비교 | 흐름 | 사례 중 하나",
      "placement": "예: 섹션 C 우측 4컬럼 카드 내부, 상단에서 120px 지점",
      "width": "520px",
      "height": "320px",
      "caption": "캡션(필요 시, 80자 이내)"
    }
    // 2~3번째 이미지가 있다면 동일 스키마로 추가
  ]
}

[LAYOUT_TEXT — WRITING RULES]
- **한국어 산문만** 작성합니다(불릿/넘버링/표/코드 금지).
- 모든 수치에 **단위 명시**(px/pt/HEX). 예: "좌우 안전 여백 96px", "본문 20pt".
- **버튼/링크/네비게이션 요소 금지**. 페이지는 독립적으로 읽히게 구성.
- **상호작용·애니메이션 설명은 이 단계에서 작성하지 않습니다**(스텝4에서 별도 처리). 단, 인터랙션을 **암시하는 공간/여백 예약**은 위치·크기만 기재 가능합니다.
- **이미지 외 장식 일러스트 금지**, 필요 그래픽은 CSS/SVG 단색 도형으로 가정.
- 접근성: 본문 텍스트 대비 **7:1 이상**, 포인트 대비 **4.5:1 이상**을 유지하도록 색 대비를 서술.

[BRANCHING — LAYOUT MODE]
- scrollable(1600×n):
  - 폭 **1600px 고정**, 세로 스크롤 허용. 상단 64–96px, 하단 96–120px 마진, 좌우 **80–120px 안전 여백**을 구체 수치로 지정.
  - **12컬럼 그리드(예: 컬럼 80–96px, 거터 24px)**를 선언하고, 각 섹션의 **가로 점유(예: 8컬럼+4컬럼)**을 문장으로 상세 설명.
  - 섹션 간 간격 **64–96px**를 문장으로 기재. 흐름은 **인트로 헤더 → 핵심 한 줄 → 개념 전개(2컬럼) → 비교/사례 → 정리/브리지**의 자연스러운 서사로 서술.
- fixed(1600×1000):
  - **1600×1000px 완전 고정**, overflow hidden. 모든 요소가 1 화면에 수용되도록 **정확한 폭·높이**를 제시.
  - 좌우 안전 여백 **48–80px**, 상단 타이틀 밴드 높이, 좌/우 컬럼 폭, 카드 높이 등 **픽셀 단위**로 명시.
  - **2~3단 구조**(예: 좌 이미지 880px / 중앙 여백 48px / 우 텍스트 576px 등)로 정보 우선순위가 한눈에 읽히도록 기술.

[BRANCHING — CONTENT MODE]
- enhanced(✨ AI 보강):
  - 산문 내 예시·비유·한 줄 요약 등 **교육적 강화 문장**을 **필요 최소량**으로 제안하되, 과장 금지. 제안 문장의 길이는 **각 1–2문장**으로 제한.
  - 카드/칩/요약상자 등 **교육 특화 컴포넌트 배치**를 구체 위치·크기로 서술.
- original(📝 원본 유지):
  - **새 정보·예시 추가 금지**. 원문 구조를 보존하되, 레이아웃만 최적화.
  - 산문에 샘플 문구 대신 **"원문 ○○문단 배치"**, **"원문 핵심 한 줄 배치"**와 같은 **배치 지시문**을 사용.

[CONTENT TO COVER — IN PROSE]
산문에는 다음을 **문단 형태로** 모두 포함하세요.
1) 전체 캔버스/그리드 설정: 폭·높이/스크롤 정책, 안전 여백, 컬럼·거터 수치, 콘텐츠 최대폭.
2) 배경·색·형태: 배경(단색/그라데이션), 구분선/그림자(rgba 포함), 라운드 반경(예: 20–28px), 컬러 사용 원칙(Primary/Secondary/Accent의 용도).
3) 타이포 스케일: H1/H2/H3/본문/캡션 **pt 단위** 크기·굵기·line-height, 이모지 보조 신호 사용 원칙(필요 시).
4) 섹션별 레이아웃: 인트로/핵심 한 줄/개념 전개(2컬럼)/비교 또는 사례/정리·브리지의 **정확한 위치·폭·높이**와 시선 흐름(상→하, 좌→우).
5) 이미지 배치 문맥: [IMAGES_JSON]에서 정의한 각 이미지의 **앵커·주변 패딩·캡션 처리**를 산문에 재확인.
6) 접근성·가독성: 최소 본문 **18pt 이상**, 대비 기준, 단락 간격(예: 16–20px), 섹션 간격(예: 64–96px).
7) 페이지 독립성: 다른 페이지로 이동시키지 않는 **문장형 브리지** 원칙을 명시.

### 산출 규격(하드 룰)
1. 산문 전용: 본문에는 표/목록/코드/JSON 금지.
2. 수치 강제: 모든 크기/여백/폰트/그리드에 단위 표기(px/pt/HEX).
3. 타이포 최소치: 본문 ≥ 18pt(스크롤형 19–20pt 권장), H1/H2는 명시.
4. 이미지 최소주의: 학습 필수만 0–2개(최대 3개). 파일명은 "1.png", "2.png", … 만 사용.
5. 접근성: 본문 대비 ≥ 7:1, 핵심 포인트 대비 ≥ 4.5:1, line-height 1.4–1.6, 탭/포커스 대비 문장으로 명시.
6. 네비게이션 금지: 버튼/링크/페이지 번호/메뉴 등 일절 금지. 다음 주제는 문장형 브리지로만 암시.
7. Z-Index/겹침: 텍스트 가독성 우선(이미지 < 카드 < 텍스트 순).
8. 레이아웃 토큰(필수 명시):
   • 뷰포트/배경: 배경 컬러/그라데이션, 텍스트 가독성 영향 서술
   • 안전 여백: 좌/우/상/하(px)
   • 그리드: 12컬럼 기본, 컬럼 폭/거터(px), 본문 권장 폭(px)
   • 섹션 간 간격: 48–96px 범위
   • 카드/칩: 라운드( px ), 그림자(rgba, 오프셋, 블러)
   • 타이포 스케일: H1/H2/H3/Body/Caption pt와 굵기, line-height
   • 컬러 토큰 사용처: Primary/Secondary/Accent/Text/Border 용도 분장

[QUALITY BAR]
- 수치는 임의가 아닌 **교육용 화면 표준 범위**(예시 수치 참고) 내에서 일관성 있게 선택.
- 중복 서술을 피하고, **실제 구현 가능한 픽셀 수치**만 제시.
- 산문은 **과장된 감탄 표현 없이 명료하고 친근한 톤**으로 작성.

[REMINDERS]
- [IMAGES_JSON] 블록 외에는 **JSON/코드/표/불릿 금지**, **산문만**.
- 버튼/링크/네비게이션 UI 금지.
- 애니메이션·인터랙션 상세는 **스텝4**에서 다룹니다(이 프롬프트에서는 위치·공간 예약까지만).
    `;
  }

  private buildFixedPrompt(projectData: ProjectData, visualIdentity: VisualIdentity): string {
    const contentModeText = projectData.contentMode === 'enhanced' 
      ? 'AI 보강 (창의적 확장, 길이 제한 없이 정보 확장)' 
      : '원본 기반 다듬기 (입력 내용의 핵심과 양은 그대로 유지하되, 말투와 문장만 교육적으로 적절하게 다듬기)';

    return `
당신은 교육 UI/UX 디자인 전문가입니다.
다음 교육 콘텐츠 페이지의 상세 레이아웃을 설계해주세요 (고정형 레이아웃):

프로젝트 컨텍스트:
- 프로젝트명: ${projectData.projectTitle}
- 대상 학습자: ${projectData.targetAudience}
- 총 페이지 수: ${projectData.pages.length}개
- 레이아웃: 1600px x 1000px 고정 크기

비주얼 아이덴티티:
- 분위기: ${Array.isArray(visualIdentity.moodAndTone) ? visualIdentity.moodAndTone.join(', ') : visualIdentity.moodAndTone}
- 색상: Primary ${visualIdentity.colorPalette.primary}, Secondary ${visualIdentity.colorPalette.secondary}
- 폰트: 제목 ${visualIdentity.typography.headingFont}, 본문 ${visualIdentity.typography.bodyFont}
- 컴포넌트 스타일: ${visualIdentity.componentStyle}

콘텐츠 모드: ${contentModeText}

## 📝 콘텐츠 처리 지침

### ${projectData.contentMode === 'enhanced' ? '✨ AI 보강 모드' : '📝 원본 기반 다듬기 모드'}
${projectData.contentMode === 'enhanced' 
  ? '**창의적 확장 모드**: 입력된 내용을 바탕으로 교육적 효과를 높이기 위해 풍부한 설명, 구체적 예시, 추가 맥락을 포함하여 내용을 확장합니다.'
  : `**원본 기반 다듬기 모드**: 
- ✅ **내용량 유지**: 입력된 내용의 핵심 정보와 전체 분량을 그대로 유지
- ✅ **말투 개선**: 대상 학습자(${projectData.targetAudience})에게 적합한 친근하고 명확한 말투로 조정  
- ✅ **문장 다듬기**: 가독성과 이해도를 높이는 자연스러운 문장 구조로 개선
- ✅ **교육적 표현**: 학습 효과를 높이는 적절한 교육용 어조와 표현으로 조정
- ❌ **내용 추가 금지**: 새로운 정보나 예시 추가하지 않음
- ❌ **내용 삭제 금지**: 원본의 핵심 내용 삭제하지 않음  
- ❌ **구조 변경 금지**: 원본 내용의 전체적 구성과 흐름 유지`}

### 🏗️ HTML 전문 개발 방식 (Structure-First Design)

**1. 전문 HTML 구조 설계**
- 모든 HTML 파일은 별도의 CSS, JS 폴더와 연동
- common/ 폴더의 공통 컴포넌트 재사용 패턴
- styles/ 폴더에 모듈화된 CSS 파일
- scripts/ 폴더에 기능별 JavaScript 파일  
- assets/ 폴더에 이미지와 리소스 체계적 관리

**2. 가독성과 심미성을 위한 레이아웃 원칙**
- 컴포넌트 간 충분한 간격: 최소 24px 이상의 마진 (고정형에서 최적화)
- 텍스트 줄간격: 1.5-1.6 배수로 가독성 확보 (공간 효율 고려)
- 섹션별 명확한 시각적 분리: 32-40px 간격
- 일관성 있는 패딩 시스템: 12px, 16px, 24px, 32px 기준

**3. 창의적 컴포넌트 활용 (고정형 특화)**
- 주제별 맞춤형 레이아웃 패턴 (과학: 실험 보드, 역사: 연표 카드, 수학: 문제 풀이판)
- 공간 효율적 인터랙티브 요소: 접이식 패널, 플립 카드, 슬라이더
- 시각적 계층: 컴팩트 카드, 미니 배지, 진행률 표시, 아이콘 그리드
- 교육 특화 컴포넌트: 압축형 퀴즈 박스, 핵심 요점 카드, 하이라이트 박스

### 고정형 레이아웃 규칙

**제한된 공간에서 최대 효율을 추구합니다.**

1. **고정 크기 제약**
   * 가로/세로: 1600px x 1000px 엄격한 고정
   * overflow: hidden 적용 (스크롤 금지)
   * 모든 콘텐츠가 화면 안에 완전히 수용되어야 함

2. **효율적 공간 활용**
   * 그리드 시스템으로 정확한 배치
   * 여백 최적화 (불필요한 공백 최소화)
   * 중요도에 따른 콘텐츠 우선순위 배치
   * 압축된 정보 전달 (핵심만 간결하게)

3. **시각적 밀도 최적화**
   * 콘텐츠 블록의 효율적 배치
   * 이미지와 텍스트의 균형잡힌 조합
   * 시각적 위계를 통한 정보 구조화

## 페이지별 상세 정보
${projectData.pages.map((page, index) => `
**페이지 ${page.pageNumber}: ${page.topic}**
- 설명: ${page.description || '상세 설명 없음'}
`).join('')}

**중요 JSON 출력 규칙:**
1. 오직 유효한 JSON 객체만 출력 (코드펜스 사용 금지)
2. layoutDescription 내의 모든 줄바꿈은 \\n으로 이스케이프
3. layoutDescription 내의 모든 쌍따옴표는 \\"로 이스케이프
4. 제어문자(탭, 폼피드 등) 사용 금지
5. 유니코드 문자는 안전하지만 이스케이프 권장

다음 형식으로 응답하세요:

{
  "pages": [
    {
      "pageNumber": 1,
      "pageTitle": "페이지 제목",
      "layoutDescription": "상세한 고정형 레이아웃 설명 (HTML 구조, CSS 스타일, 컴포넌트 배치, 이미지 위치 등을 포함한 완전한 구현 가이드)",
      "images": [
        {
          "filename": "page1_diagram.png",
          "description": "Educational diagram, clean illustration, textbook style"
        }
      ]
    }
  ]
}

**이미지 생성 규칙:**
1. **설명형 이미지만 생성** - 꾸밈용 이미지 금지, 학습 내용 이해를 돕는 이미지만
2. **구체적인 파일명** - page{번호}_{용도}_{설명}.png 형식
3. **교육용 프롬프트** - 다이어그램, 인포그래픽, 과정 설명, 개념 도식 등
4. **고정형 최적화** - 제한된 공간에 맞는 컴팩트한 디자인

**절대 규칙:**
1. **1600x1000px 엄격한 고정 크기** - 스크롤 금지, 모든 콘텐츠가 화면 안에 수용
2. **전문 HTML 구조** - CSS/JS 분리, 공통 컴포넌트 활용, 모듈화된 개발
3. **효율적 간격** - 컴포넌트간 16-24px, 줄간격 1.5, 섹션간 32px (공간 최적화)
4. **창의적 컴포넌트** - 주제별 맞춤 디자인 패턴, 공간 효율적 배치
5. ${contentModeText}에 따라 콘텐츠 밀도 조절
6. **유효한 JSON만 출력** - 코드펜스, 설명 텍스트 금지
7. **이미지는 학습 도구** - 내용 이해를 돕는 교육용 이미지만
8. **🚫 페이지간 네비게이션 절대 금지** - 다른 페이지로 이동하는 링크, 버튼, 메뉴 등 일체 포함하지 마세요. 각 페이지는 독립적인 단일 페이지로 설계하세요.

JSON 객체 외에는 어떤 텍스트도 출력하지 마세요.
    `;
  }

  /**
   * JSON 객체 추출 (첫 번째 { 부터 마지막 } 까지)
   */
  private extractJsonObject(content: string): string {
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error('유효한 JSON 객체 구조를 찾을 수 없습니다');
    }
    
    return content.substring(firstBrace, lastBrace + 1);
  }

  /**
   * layoutDescription 필드의 이스케이프 문제 수리
   */
  private repairLayoutDescription(content: string): string {
    return content.replace(
      /"layoutDescription"\s*:\s*"(.*?)"/gs,
      (match, layoutContent) => {
        const safeContent = layoutContent
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t')
          .replace(/[\u0000-\u001F]/g, '');
        
        return `"layoutDescription":"${safeContent}"`;
      }
    );
  }

  private parseAIResponse(content: string): any {
    let layoutDescription = '';
    let images: any[] = [];

    // 새로운 형식: JSON 블록 + 산문 형태 파싱
    if (content.includes('[IMAGES_JSON]') && content.includes('[LAYOUT_TEXT]')) {
      // [IMAGES_JSON] 블록 파싱
      const imagesJsonStart = content.indexOf('[IMAGES_JSON]') + '[IMAGES_JSON]'.length;
      const layoutTextStart = content.indexOf('[LAYOUT_TEXT]');
      
      if (imagesJsonStart < layoutTextStart) {
        const jsonPart = content.slice(imagesJsonStart, layoutTextStart).trim();
        try {
          const parsed = JSON.parse(jsonPart);
          images = parsed.images || [];
        } catch (error) {
          console.warn('이미지 JSON 파싱 실패:', error);
          images = [];
        }
      }

      // [LAYOUT_TEXT] 블록 파싱
      const layoutTextContent = content.slice(layoutTextStart + '[LAYOUT_TEXT]'.length).trim();
      layoutDescription = layoutTextContent;
    }
    // 직접 JSON 형태로 시작하는 경우 - 개선된 파싱
    else if (content.trim().startsWith('{') && content.includes('"images"')) {
      try {
        // JSON이 끝나는 지점 찾기 (첫 번째 } 다음에 오는 텍스트 분리)
        const jsonStart = content.indexOf('{');
        let braceCount = 0;
        let jsonEnd = jsonStart;
        
        for (let i = jsonStart; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        
        const jsonPart = content.slice(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonPart);
        images = parsed.images || [];
        
        // JSON 다음에 오는 텍스트를 layoutDescription으로 사용
        const remainingText = content.slice(jsonEnd).trim();
        layoutDescription = remainingText || "AI에서 생성된 레이아웃 설계";
      } catch (error) {
        console.warn('직접 JSON 파싱 실패:', error);
        // 파싱 실패시 전체 텍스트를 layoutDescription으로 사용
        layoutDescription = content.trim();
      }
    }
    // 기존 [BEGIN FINAL LAYOUT] 형식 지원 (하위 호환성)
    else if (content.includes('[BEGIN FINAL LAYOUT]')) {
      // [IMAGES_JSON] 마커가 있는지 확인
      if (content.includes('[IMAGES_JSON]')) {
        const layoutStartIndex = content.indexOf('[BEGIN FINAL LAYOUT]') + '[BEGIN FINAL LAYOUT]'.length;
        const imagesJsonIndex = content.indexOf('[IMAGES_JSON]');
        
        if (layoutStartIndex < imagesJsonIndex) {
          layoutDescription = content.slice(layoutStartIndex, imagesJsonIndex).trim();
          
          const jsonPart = content.slice(imagesJsonIndex + '[IMAGES_JSON]'.length).trim();
          try {
            images = JSON.parse(jsonPart);
            if (!Array.isArray(images)) images = [];
          } catch (error) {
            console.warn('기존 이미지 JSON 파싱 실패:', error);
            images = [];
          }
        } else {
          layoutDescription = content.slice(layoutStartIndex).trim();
        }
      } else {
        layoutDescription = content.slice(content.indexOf('[BEGIN FINAL LAYOUT]') + '[BEGIN FINAL LAYOUT]'.length).trim();
        
        // 기존 이미지 라인 파싱 로직 유지
        const imageLines = Array.from(layoutDescription.matchAll(/^-\s*이미지\s*\|(.+)$/gmi)).map(m => m[1].trim());
        images = imageLines.map(line => {
          const pairs = line.split('|').map(s => s.trim());
          const obj: Record<string, string> = {};
          for (const p of pairs) {
            const m = p.match(/^(\w+)\s*=\s*(?:"([^"]+)"|([^"]+))$/);
            if (m) obj[m[1]] = (m[2] ?? m[3] ?? '').trim();
          }
          return {
            filename: obj.filename || '',
            size: obj.size || '',
            position: obj.position || '',
            alt: obj.alt || '',
            aiPrompt: obj.aiPrompt || '',
          };
        });
      }
    }
    // 마커가 없는 경우
    else {
      console.log('마커 없음, 전체 텍스트를 layoutDescription으로 사용');
      layoutDescription = content.trim();
    }

    return {
      pageTitle: '',
      layoutDescription,
      images,
      detailedElements: [],
      designSpecs: {},
    };
  }

  private extractBetweenMarkers(text: string, startTag: string, endTag: string): string {
    const s = text.indexOf(startTag);
    const e = text.indexOf(endTag);
    if (s === -1 || e === -1 || e <= s) return text.trim();
    return text.slice(s + startTag.length, e).trim();
  }

  private generateFallbackResponse(projectData?: ProjectData): any {
    const pageCount = projectData?.pages.length || 1;
    
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
      const pageNum = i + 1;
      const originalPage = projectData?.pages[i];
      
      pages.push({
        pageNumber: pageNum,
        pageTitle: originalPage?.topic || `페이지 ${pageNum}`,
        layoutDescription: `[페이지 제목: ${originalPage?.topic || `페이지 ${pageNum}`}]\\n\\n## 오류 안내\\n\\nAI 응답 파싱 중 오류가 발생했습니다.\\n\\n### 다음을 시도해보세요:\\n- 프로젝트 내용을 단순화하여 재시도\\n- 잠시 후 다시 생성 버튼 클릭\\n- 페이지 수를 줄여서 시도\\n- 브라우저 새로고침 후 재시도\\n\\n### 기술적 원인\\n- JSON 파싱 오류 (제어문자 또는 이스케이프 문제)\\n- AI 응답 형식 불일치\\n- 네트워크 연결 문제`,
        images: [{
          filename: `error-page${pageNum}.png`,
          description: "레이아웃 생성 오류 안내 이미지: 간단한 에러 아이콘과 재시도 안내 텍스트, 미니멀한 디자인",
          position: "center"
        }]
      });
    }
    
    return { pages };
  }

  private validatePageResponse(response: any, page: any): boolean {
    try {
      // 줄글 파싱에서는 layoutDescription만 있으면 충분
      if (!response.layoutDescription || response.layoutDescription.trim() === '') {
        console.error(`페이지 ${page.pageNumber} layoutDescription 누락`);
        return false;
      }
      
      console.log(`페이지 ${page.pageNumber} 응답 검증 성공`);
      return true;
      
    } catch (error) {
      console.error(`페이지 ${page.pageNumber} 검증 중 오류:`, error);
      return false;
    }
  }

  private generatePageFallbackResponse(projectData: ProjectData, page: any): any {
    return {
      pageTitle: `${page.topic} (폴백 응답)`,
      layoutDescription: `페이지 ${page.pageNumber}: ${page.topic}\\n\\n## 레이아웃 생성 오류\\n\\nAI 응답 생성 중 오류가 발생하여 기본 구조로 대체되었습니다.\\n\\n### 기본 레이아웃 구조:\\n- 헤더: 페이지 제목과 네비게이션\\n- 메인 콘텐츠: ${page.topic} 관련 내용\\n- 사이드바: 관련 정보 및 링크\\n- 푸터: 페이지 전환 및 요약\\n\\n### 다음을 시도해보세요:\\n- 페이지 내용을 더 구체적으로 작성\\n- 잠시 후 재생성 시도\\n- 브라우저 새로고침 후 재시도`,
      detailedElements: [
        {
          elementType: "header",
          elementName: "페이지 헤더",
          position: {
            top: "0px",
            left: "0px",
            width: "100%",
            height: "120px"
          },
          styling: {
            backgroundColor: "#F7FAFC",
            color: "#2D3748",
            fontSize: "32px",
            fontWeight: "600",
            padding: "24px",
            borderBottom: "1px solid #E2E8F0"
          },
          content: page.topic,
          purpose: "페이지 주제 명확화 및 학습 방향 제시",
          interactions: "없음 (폴백 응답)"
        },
        {
          elementType: "content",
          elementName: "메인 콘텐츠",
          position: {
            top: "120px",
            left: "0px",
            width: "100%",
            height: "auto"
          },
          styling: {
            backgroundColor: "#FFFFFF",
            color: "#4A5568",
            fontSize: "16px",
            fontWeight: "400",
            padding: "48px 24px",
            lineHeight: "1.6"
          },
          content: `${page.topic}에 대한 기본 내용이 표시됩니다. 상세한 레이아웃은 재생성을 통해 개선할 수 있습니다.`,
          purpose: "기본적인 학습 내용 제공",
          interactions: "없음 (폴백 응답)"
        }
      ],
      designSpecs: {
        primaryLayout: "기본 레이아웃 (폴백)",
        colorScheme: "기본 색상 조합",
        typography: "기본 타이포그래피",
        spacing: "표준 간격",
        visualFlow: "상단에서 하단으로",
        educationalStrategy: "기본 정보 전달"
      },
      images: [{
        filename: `page${page.pageNumber}_fallback_placeholder.png`,
        size: "400x300",
        position: "center",
        description: "폴백 응답 안내 이미지: 기본 레이아웃 구조를 보여주는 와이어프레임",
        purpose: "시각적 구조 이해 지원",
        aiPrompt: "Simple wireframe layout diagram, clean lines, educational placeholder, minimal design"
      }]
    };
  }
}

export const layoutProposalService = new LayoutProposalService();
