import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity, LayoutProposal } from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class LayoutProposalService {
  private openaiService = OpenAIService.getInstance();

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
    const contentModeText = projectData.contentMode === 'enhanced' 
      ? 'AI 보강 (창의적 확장, 풍부한 설명과 예시 추가)' 
      : '원본 기반 다듬기 (입력 내용의 핵심과 양은 그대로 유지하되, 말투와 문장만 교육적으로 적절하게 다듬기)';

    const layoutModeText = projectData.layoutMode === 'scrollable' ? '세로 스크롤 허용' : '1600px x 1000px 고정 크기';
    
    // 기존 페이지들의 디자인 연속성을 위한 정보
    const existingPagesInfo = existingPages.length > 0 
      ? `\n### 🔗 기존 페이지들과의 연속성\n${existingPages.map(p => 
          `**페이지 ${p.metadata.pageNumber}**: ${p.pageTitle} - ${p.designSpecs?.primaryLayout || '기본 레이아웃'}`
        ).join('\n')}\n`
      : '';

    return `
당신은 세계적인 교육 UI/UX 디자인 전문가입니다.
다음 교육 콘텐츠의 **단일 페이지**에 대해 **정적 레이아웃 구조**를 상세히 설계해주세요.

**중요**: 이 단계에서는 **정적 레이아웃과 시각적 디자인**에만 집중하며, 인터랙션과 애니메이션은 다음 단계에서 별도로 추가됩니다.

## 📋 프로젝트 전체 컨텍스트
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience} 
- **전체 구조**: ${projectData.pages.length}페이지 중 ${currentPage.pageNumber}번째 페이지
- **레이아웃 모드**: ${layoutModeText}
- **콘텐츠 처리 방식**: ${contentModeText}

## 🎨 통일된 비주얼 아이덴티티
- **전체 분위기**: ${visualIdentity.moodAndTone}
- **메인 색상**: ${visualIdentity.colorPalette.primary}
- **보조 색상**: ${visualIdentity.colorPalette.secondary}  
- **제목 폰트**: ${visualIdentity.typography.headingFont}
- **본문 폰트**: ${visualIdentity.typography.bodyFont}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}

## 📖 전체 페이지 흐름 맵
${projectData.pages.map((page, index) => 
  `**${page.pageNumber}. ${page.topic}** ${page.pageNumber === currentPage.pageNumber ? '👈 **현재 설계 대상**' : ''}
   └ ${page.description || '상세 설명 없음'}`
).join('\n')}

${existingPagesInfo}

## 🎯 현재 페이지 상세 정보
- **페이지 번호**: ${currentPage.pageNumber}/${projectData.pages.length}
- **페이지 주제**: ${currentPage.topic}
- **상세 설명**: ${currentPage.description || '상세 설명이 제공되지 않았으므로 주제를 바탕으로 창의적으로 확장하세요'}
- **이전 페이지와의 연관성**: ${currentPage.pageNumber > 1 ? '이전 페이지와 자연스러운 학습 흐름 연결 필요' : '도입부로서 흥미와 관심 유발 필요'}
- **다음 페이지 준비**: ${currentPage.pageNumber < projectData.pages.length ? '다음 페이지로의 자연스러운 전환 고려' : '학습 내용의 완결성과 정리 필요'}

## 📝 콘텐츠 처리 지침

### ${projectData.contentMode === 'enhanced' ? '✨ AI 보강 모드' : '📝 원본 기반 다듬기 모드'}
${projectData.contentMode === 'enhanced' 
  ? '**창의적 확장 모드**: 입력된 내용을 바탕으로 교육적 효과를 높이기 위해 풍부한 설명, 구체적 예시, 추가 맥락을 포함하여 내용을 대폭 확장합니다.'
  : `**원본 기반 다듬기 모드**: 
- ✅ **내용량 유지**: 입력된 내용의 핵심 정보와 전체 분량을 그대로 유지
- ✅ **말투 개선**: 대상 학습자(${projectData.targetAudience})에게 적합한 친근하고 명확한 말투로 조정  
- ✅ **문장 다듬기**: 가독성과 이해도를 높이는 자연스러운 문장 구조로 개선
- ✅ **교육적 표현**: 학습 효과를 높이는 적절한 교육용 어조와 표현으로 조정
- ❌ **내용 추가 금지**: 새로운 정보나 예시 추가하지 않음
- ❌ **내용 삭제 금지**: 원본의 핵심 내용 삭제하지 않음  
- ❌ **구조 변경 금지**: 원본 내용의 전체적 구성과 흐름 유지

**예시**:
원본: "이것은 중요한 개념이다. 잘 알아두자."
개선: "이것은 우리가 꼭 알아야 할 중요한 개념입니다. 차근차근 이해해보세요."`}

## 🏗️ 전문가급 HTML 개발 구조 (정적 레이아웃 중심)

### 1. 파일 구조 시스템
\`\`\`
page${currentPage.pageNumber}/
├── index.html                 # 메인 HTML 파일
├── styles/
│   ├── layout.css            # 레이아웃 구조 전용
│   ├── components.css        # 컴포넌트 스타일
│   ├── typography.css        # 타이포그래피 시스템
│   └── responsive.css        # 반응형 스타일
├── assets/
│   ├── images/              # 페이지별 이미지
│   ├── icons/               # 아이콘 세트
│   └── media/               # 멀티미디어 자료
└── common/                   # 공통 컴포넌트 참조
    ├── header-component.html
    ├── navigation.html
    └── shared-styles.css
\`\`\`

### 2. 정적 디자인 시스템 상세 적용

**색상 시스템 (구체적 활용)**
- Primary (${visualIdentity.colorPalette.primary}): 메인 제목, 중요 섹션 배경, 강조 영역
- Secondary (${visualIdentity.colorPalette.secondary}): 서브 제목, 구분선, 액센트 요소
- 텍스트: #2D3748 (메인), #4A5568 (서브), #718096 (보조)
- 배경: #FFFFFF (메인), #F7FAFC (섹션), #EDF2F7 (카드)
- 경계선: #E2E8F0 (기본), #CBD5E0 (강조)

**타이포그래피 시스템 (픽셀 단위 명시)**
- H1 (메인 제목): ${visualIdentity.typography.headingFont}, 42px, Bold, 1.2 line-height
- H2 (섹션 제목): ${visualIdentity.typography.headingFont}, 32px, Semibold, 1.25 line-height  
- H3 (서브 제목): ${visualIdentity.typography.headingFont}, 24px, Medium, 1.3 line-height
- Body (본문): ${visualIdentity.typography.bodyFont}, 16px, Regular, 1.6 line-height
- Caption (캡션): ${visualIdentity.typography.bodyFont}, 14px, Regular, 1.5 line-height

**간격 시스템 (교육 최적화)**
${projectData.layoutMode === 'scrollable' 
  ? `- 섹션간 여백: 80px (충분한 구분감)
- 컴포넌트간 여백: 48px (자연스러운 시선 이동)  
- 요소간 여백: 24px (적절한 그룹핑)
- 내부 패딩: 32px (편안한 읽기 공간)`
  : `- 섹션간 여백: 40px (공간 효율성)
- 컴포넌트간 여백: 24px (밀도 최적화)
- 요소간 여백: 16px (컴팩트 배치)  
- 내부 패딩: 20px (효율적 공간 활용)`}

## 🎯 창의적 정적 레이아웃 설계 요구사항

🚀 **혁신적 레이아웃 패턴 필수 적용**:
- **비대칭 그리드**: 전통적 격자 탈피, 불규칙 배치로 시각적 흥미 유발
- **브로큰 그리드**: 격자 시스템 의도적 파괴, 오버랩과 오프셋 활용
- **플루이드 레이아웃**: 유기적 곡선, 자연스러운 흐름, 경직된 직선 배제
- **레이어드 디자인**: Z-인덱스 활용한 깊이감, 다층 구조, 그림자 효과
- **분할 화면**: 화면 분할, 듀얼 콘텐츠, 컬러 블록 대비
- **원형/다각형**: 전통적 사각형 탈피, 기하학적 다양성
- **콘텐츠 마스킹**: 이미지나 텍스트를 특별한 형태로 클리핑

### A. 시선 흐름 설계 (Visual Hierarchy) - 창의적 접근
1. **주의 집중점 (Primary Focus)**
   - 위치: 명확한 좌표 지정 (top: Xpx, left: Ypx)
   - 크기: 구체적 크기 (width: Wpx, height: Hpx)  
   - 스타일: 색상, 폰트, 효과 상세 명시
   - 목적: 학습자의 첫 시선을 끌 핵심 요소

2. **정보 전달 순서 (Reading Flow)**
   - 1단계 → 2단계 → 3단계 순서로 시선 이동 경로 설계
   - 각 단계별 요소의 정확한 배치와 강조 방법
   - Z-패턴 또는 F-패턴 적용한 최적 배치

3. **시각적 그룹핑 (Visual Grouping)**
   - 관련 정보들의 근접성 원리 적용
   - 구분선, 배경색, 여백을 통한 명확한 그룹핑
   - 각 그룹의 경계와 내부 구조 상세 기술

### B. 모든 페이지 요소의 완전한 정적 명세

**반드시 다음 모든 요소를 창의적으로 설계하세요:**

1. **혁신적 헤더 영역** (전통적 상단 고정 탈피)
   - **비대칭 배치**: 좌우 불균형, 오프셋 로고, 사이드 네비게이션
   - **플로팅 요소**: 화면 위에 떠있는 듯한 효과, 그림자와 블러
   - **분할 헤더**: 좌우 다른 색상/텍스처, 대각선 분할, 기하학적 형태
   - **원형 브랜딩**: 원형 로고 영역, 방사형 메뉴, 곡선 네비게이션
   - **글래스 효과**: 반투명 배경, backdrop-filter, 서브틀 그라디언트

2. **혁명적 메인 콘텐츠 영역** (격자 시스템 파괴)
   - **브로큰 그리드**: 의도적 정렬 파괴, 스태거드 레이아웃, 비정형 배치
   - **오버랩 섹션**: 요소 간 겹침, Z-인덱스 활용, 레이어드 깊이감
   - **원형/육각형 콘텐츠**: 사각형 탈피, 다각형 클리핑, 기하학적 마스킹
   - **분할 콘텐츠**: 좌우/상하 컬러 블록, 대각선 분할, 듀얼 테마
   - **플루이드 텍스트**: 곡선을 따라 흐르는 텍스트, 패스 기반 레이아웃
   - **플로팅 카드**: 중력을 무시한 배치, 임의 회전, 자유로운 위치

3. **창의적 사이드바/보조 영역** (고정 개념 탈피)
   - **플로팅 사이드바**: 콘텐츠 위에 떠있는 반투명 패널
   - **원형 네비게이션**: 화면 모서리 원형 메뉴, 방사형 확장
   - **세로형 텍스트**: 90도 회전 타이포그래피, 독창적 읽기 경험
   - **분산 배치**: 화면 곳곳에 흩어진 보조 정보, 자석 효과
   - **모폴링 형태**: 상황에 따라 변형되는 유기적 사이드바

4. **혁신적 하단 영역** (전통적 푸터 대체)
   - **오버랩 CTA**: 콘텐츠와 겹치는 액션 버튼, 스티키 효과
   - **곡선 분할**: 물결 모양 경계선, 유기적 전환
   - **원형 진행**: 원형 프로그레스, 방사형 네비게이션
   - **분산 요약**: 핵심 포인트가 화면에 떠있는 카드 형태
   - **3D 버튼**: 입체적 CTA, perspective 효과, 그림자 깊이감

### C. 교육 효과 극대화 요소 (정적 디자인)

1. **시각적 학습 동기 유발**
   - 흥미로운 비주얼: 구체적 이미지/그래픽 설명
   - 진행상황 표시: 프로그래스 바, 단계 표시 (정적)
   - 성취감 표현: 체크리스트, 완료 배지 디자인

2. **이해도 향상 레이아웃**
   - 핵심 개념 하이라이트: 색상, 테두리, 배경 처리
   - 예시/사례: 박스 처리, 아이콘, 구분
   - 요약 정리: 카드 형태, 목록 형태

3. **기억 강화 시각 요소**
   - 반복 학습: 중요 포인트 재등장 디자인
   - 시각적 기억술: 아이콘, 색상 코딩, 패턴
   - 연결고리: 이전/다음 내용과의 연관성 시각적 표시

## 📐 ${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'} 특화 설계

${projectData.layoutMode === 'scrollable' 
  ? `### 스크롤형 정적 레이아웃 최적화
- **자연스러운 스크롤 유도**: 콘텐츠 미리보기, 시각적 연결 요소
- **스크롤 섹션 구분**: 명확한 경계선, 배경 변화
- **스크롤 위치 안내**: 진행률 표시 디자인, 현재 위치 표시
- **무한 확장 가능**: 콘텐츠 길이 제한 없는 유연한 구조
- **모바일 최적화**: 터치 인터페이스 고려한 요소 크기`
  : `### 고정형 정적 레이아웃 최적화  
- **1600x1000px 완벽 활용**: 모든 픽셀 영역의 용도 명시
- **시선 집중도 최대화**: 핵심 정보를 중앙 영역에 배치
- **정보 밀도 최적화**: 중요도에 따른 크기 차등 배치
- **스크롤 없는 완결성**: 모든 정보가 한 화면에 표현
- **공간 효율 극대화**: 여백 최소화, 콘텐츠 최대화`}

## 🖼️ 필수 이미지/미디어 상세 기획 (자리표시자 시스템 적용)

**각 이미지에 대해 다음을 모두 명시하세요:**
- 파일명: page${currentPage.pageNumber}_[용도]_[설명].png
- 크기: 정확한 픽셀 크기 (예: 800x400px)
- 위치: **CSS 스타일 형태**로 정확히 명시 (예: "width: 800px; height: 400px; margin: 40px auto; display: block;")
- 내용: 구체적인 이미지 내용과 스타일
- 목적: 학습 효과와 연결된 목적
- AI 생성 프롬프트: 상세한 생성 지시사항

**중요**: position 필드는 실제 HTML에서 사용할 수 있는 완전한 CSS 스타일 문자열로 작성하세요.
예시: "width: 600px; height: 300px; margin: 20px auto; display: block; border-radius: 8px;"

### D. 차세대 레이아웃 창조성 (Layout Innovation Revolution)

🎨 **혁신적 공간 재정의**:
- **네거티브 스페이스 마스터리**: 빈 공간도 의미있는 디자인 요소로 활용, 시각적 휴식과 강조 효과
- **비선형 읽기 패턴**: 기존 Z/F 패턴을 뛰어넘는 창의적 시선 유도, 나선형/원형/물결 패턴
- **다차원 레이어링**: 2D 평면을 3D처럼 느끼게 하는 깊이감, 그림자와 원근법 활용
- **반전된 구조**: 전통적 상하좌우 배치의 의도적 뒤바꿈, 예상치 못한 요소 배치

🚀 **시각적 혁명 요소**:
- **글리치 디자인**: 의도적인 시각적 오류로 주의 집중, 픽셀 노이즈와 왜곡 효과
- **데이터 시각화**: 추상적 정보를 직관적 그래픽으로 변환, 인포그래픽 통합
- **미니멀 복합성**: 단순해 보이지만 복층적 의미를 담은 디자인, 숨겨진 디테일
- **인터스티셜 디자인**: 섹션 간 전환부에 특별한 시각적 처리, 자연스러운 흐름 연결

💫 **감각적 레이아웃 혁신**:
- **색상 심리학 적용**: 기억 촉진과 감정 유발을 위한 전략적 색상 배치
- **패턴 기억법**: 반복되는 시각적 패턴으로 정보 각인 효과 극대화
- **스토리텔링 구조**: 내러티브를 반영한 순차적 배치, 학습 여정 시각화
- **감정적 연결점**: 학습자 경험과 연결되는 시각적 메타포, 공감대 형성

## 📋 JSON 출력 형식

다음 형식으로 **완전하고 상세한 정적 레이아웃** 응답을 제공하세요:

{
  "pageTitle": "구체적이고 매력적인 페이지 제목",
  "layoutDescription": "전체 페이지의 종합적 정적 설계 설명 (HTML 구조, CSS 스타일링, 전체적인 배치 철학)",
  "detailedElements": [
    {
      "elementType": "header|content|sidebar|footer|media|static_interactive",
      "elementName": "구체적 요소명",
      "position": {
        "top": "0px",
        "left": "0px", 
        "width": "100%",
        "height": "120px"
      },
      "styling": {
        "backgroundColor": "#FFFFFF",
        "color": "#2D3748",
        "fontSize": "24px",
        "fontWeight": "600",
        "border": "1px solid #E2E8F0",
        "borderRadius": "8px",
        "padding": "24px",
        "margin": "16px 0"
      },
      "content": "실제 들어갈 구체적 콘텐츠 내용",
      "purpose": "이 요소의 교육적 목적과 학습 효과",
      "interactionPlaceholder": "Step4에서 추가될 인터랙션 유형 (hover|click|form|animation 등)"
    }
  ],
  "designSpecs": {
    "primaryLayout": "grid|flexbox|absolute",
    "colorScheme": "적용된 색상 조합과 의미",
    "typography": "폰트 사용 전략과 위계",
    "spacing": "여백과 간격 시스템",
    "visualFlow": "시선 흐름 설계 전략",
    "educationalStrategy": "교육 효과 극대화 전략",
    "interactionReadiness": "Step4 인터랙션 추가를 위한 준비 상태"
  },
  "images": [
    {
      "filename": "page${currentPage.pageNumber}_hero_concept.png",
      "size": "800x400",
      "position": "width: 800px; height: 400px; margin: 40px auto; display: block; border-radius: 8px;",
      "description": "매우 구체적인 이미지 내용 설명",
      "purpose": "학습 목적과 연결된 이미지 역할",
      "aiPrompt": "AI 이미지 생성을 위한 상세한 프롬프트"
    }
  ]
}

**중요한 제약사항:**
1. ✅ **정적 레이아웃 중심**: 인터랙션/애니메이션은 Step4에서 별도 처리
2. ✅ **완전성**: 페이지의 모든 정적 요소가 빠짐없이 설계되어야 함
3. ✅ **구체성**: 모든 크기, 색상, 위치가 정확한 값으로 명시되어야 함  
4. ✅ **교육성**: 모든 디자인 결정이 학습 효과와 연결되어야 함
5. ✅ **일관성**: 전체 프로젝트의 비주얼 아이덴티티와 일치해야 함
6. ✅ **Step4 준비**: 인터랙션 추가를 위한 요소 식별 및 준비
7. ✅ **실용성**: 실제 HTML/CSS로 구현 가능한 수준이어야 함
8. ✅ **콘텐츠 처리**: ${projectData.contentMode === 'enhanced' ? '창의적 확장으로 풍부한 내용' : '원본 내용의 핵심과 분량 유지하되 말투와 문장만 교육적으로 개선'}해야 함

JSON 객체 외에는 어떤 텍스트도 출력하지 마세요.
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
- 분위기: ${visualIdentity.moodAndTone}
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
    try {
      // 1단계: 기본 JSON 파싱 시도
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.log('기본 JSON 파싱 실패, 보정 시도...');
      
      try {
        // 2단계: JSON 객체만 추출하여 파싱
        const jsonOnly = this.extractJsonObject(content);
        const parsed = JSON.parse(jsonOnly);
        return parsed;
      } catch (error2) {
        console.log('JSON 추출 후 파싱 실패, layoutDescription 보정 시도...');
        
        try {
          // 3단계: layoutDescription 필드 보정 후 파싱
          const jsonOnly = this.extractJsonObject(content);
          const repaired = this.repairLayoutDescription(jsonOnly);
          const parsed = JSON.parse(repaired);
          return parsed;
        } catch (error3) {
          console.error('모든 JSON 파싱 시도 실패:', error3);
          throw new Error(`JSON 파싱 실패: ${error3.message}`);
        }
      }
    }
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
      if (!response.pageTitle || !response.layoutDescription) {
        console.error(`페이지 ${page.pageNumber} 필수 필드 누락`);
        return false;
      }
      
      if (!response.detailedElements || !Array.isArray(response.detailedElements)) {
        console.error(`페이지 ${page.pageNumber} detailedElements 누락 또는 잘못된 형식`);
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
