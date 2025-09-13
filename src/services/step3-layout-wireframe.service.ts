import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';

// 페이지별 레이아웃 제안 타입
export interface PageLayoutProposal {
  pageId: string;
  pageTitle: string;
  pageNumber: number;
  layoutDescription: string; // 단순 텍스트 설명
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
          const prompt = this.createStructuredPageLayoutPrompt(page, projectData, visualIdentity, index);
          const schema = this.createWireframeSchema();
          const response = await this.openAIService.generateStructuredCompletion(prompt, schema, `Step3-Page${page.pageNumber}`);
          
          const wireframeContent = response.content;
          const layoutDescription = this.convertWireframeToDescription(wireframeContent);
          
          const pageProposal: PageLayoutProposal = {
            pageId: page.id,
            pageTitle: page.topic,
            pageNumber: page.pageNumber,
            layoutDescription: layoutDescription,
            generatedAt: new Date()
          };
          
          console.log(`✅ 페이지 ${page.pageNumber} 병렬 생성 완료`);
          return pageProposal;
          
        } catch (error) {
          console.error(`❌ 페이지 ${page.pageNumber} Structured Output 실패:`, error);
          
          // Structured Output 실패 시 기존 방식으로 폴백
          try {
            console.log(`🔄 페이지 ${page.pageNumber} 기존 방식으로 폴백 시도`);
            const prompt = this.createPageLayoutPrompt(page, projectData, visualIdentity, index);
            const response = await this.openAIService.generateCompletion(prompt, `Step3-Page${page.pageNumber}-Fallback`);
            
            const wireframeContent = this.extractWireframeFromResponse(response.content, page.pageNumber);
            const layoutDescription = wireframeContent 
              ? this.convertWireframeToDescription(wireframeContent)
              : this.createFallbackDescription(page.topic);
            
            return {
              pageId: page.id,
              pageTitle: page.topic,
              pageNumber: page.pageNumber,
              layoutDescription: layoutDescription,
              generatedAt: new Date()
            };
          } catch (fallbackError) {
            console.error(`❌ 페이지 ${page.pageNumber} 폴백도 실패:`, fallbackError);
            
            // 최종 폴백: 하드코딩된 기본 레이아웃
            return {
              pageId: page.id,
              pageTitle: page.topic,
              pageNumber: page.pageNumber,
              layoutDescription: this.createFallbackDescription(page.topic),
              generatedAt: new Date()
            };
          }
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
      
      const fallbackResult = this.createFallbackResult(projectData);
      console.log('🔄 Step3 폴백 결과 적용');
      return fallbackResult;
    }
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
${prevPage ? `이전: "${prevPage.topic}"에서 연결` : '첫 페이지 - 학습 동기 유발'}
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

  // Structured Output용 프롬프트 생성
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

    return `당신은 웹 페이지 레이아웃 설계 전문가입니다. 교육용 와이어프레임을 JSON 형식으로 생성해주세요.

**프로젝트 정보:**
- 제목: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 페이지: ${page.pageNumber}/${projectData.pages.length} - ${page.topic}
- 역할: ${pageRole}
- 레이아웃 모드: ${projectData.layoutMode}

**디자인 토큰:**
- 주색상: ${visualIdentity.colorPalette.primary}
- 보조색상: ${visualIdentity.colorPalette.secondary || '#50E3C2'}
- 강조색상: ${visualIdentity.colorPalette.accent || '#F5A623'}

**연결 맥락:**
${prevPage ? `이전: "${prevPage.topic}"에서 연결` : '첫 페이지 - 학습 동기 유발'}
${nextPage ? `다음: "${nextPage.topic}"로 전환 준비` : '마지막 페이지 - 학습 마무리'}

다음 구조로 와이어프레임을 생성해주세요:

- version: "wire.v1" (고정값)
- viewportMode: "${projectData.layoutMode}"
- flow: "${pageFlow}"
- sections: 배열 (3-6개 섹션)

각 섹션은 다음 속성을 가져야 합니다:
- id: 섹션 식별자 (예: "header", "main", "footer")
- role: title/subtitle/content/visual/interactive/navigation/summary 중 하나
- grid: "1-12"(전체폭) 또는 "8+4"(좌우분할) 또는 "2-11"(여백포함) 형식
- height: "auto" 또는 픽셀값 (예: "120")
- content: 해당 섹션의 구체적 내용 설명
- gapBelow: 다음 섹션과의 간격 픽셀값 (예: "32")

${page.topic} 주제에 맞는 교육적이고 실용적인 와이어프레임을 설계해주세요.`;
  }

  // 와이어프레임 응답에서 구조화된 데이터 추출
  private extractWireframeFromResponse(responseContent: string, pageNumber: number): any {
    try {
      const startMarker = `BEGIN_S3_PAGE${pageNumber}`;
      const endMarker = `END_S3_PAGE${pageNumber}`;
      
      let startIndex = responseContent.indexOf(startMarker);
      let endIndex = responseContent.indexOf(endMarker);
      
      // 마커가 없으면 코드 블록을 찾아봄
      if (startIndex === -1 || endIndex === -1) {
        console.log(`🔍 페이지 ${pageNumber}: 마커 없음, 코드 블록 또는 VERSION 패턴 검색`);
        
        // ```로 감싸진 코드 블록 찾기
        const codeBlockStart = responseContent.indexOf('```');
        const codeBlockEnd = responseContent.lastIndexOf('```');
        
        if (codeBlockStart !== -1 && codeBlockEnd !== -1 && codeBlockStart !== codeBlockEnd) {
          let codeContent = responseContent.substring(codeBlockStart + 3, codeBlockEnd).trim();
          // 언어 식별자 제거 (```plaintext, ```javascript 등)
          const firstLineEnd = codeContent.indexOf('\n');
          if (firstLineEnd !== -1 && !codeContent.startsWith('VERSION=')) {
            codeContent = codeContent.substring(firstLineEnd + 1);
          }
          console.log(`✅ 페이지 ${pageNumber}: 코드 블록에서 추출`);
          return this.parseWireframeLines(codeContent.split('\n'));
        }
        
        // VERSION= 패턴 찾기 (코드 블록이 없는 경우)
        const versionIndex = responseContent.indexOf('VERSION=');
        if (versionIndex !== -1) {
          const wireframeContent = responseContent.substring(versionIndex);
          console.log(`✅ 페이지 ${pageNumber}: VERSION 패턴에서 추출`);
          return this.parseWireframeLines(wireframeContent.split('\n'));
        }
        
        console.warn(`⚠️ 페이지 ${pageNumber}: 와이어프레임 패턴을 찾을 수 없음, 폴백 사용`);
        return null;
      }
      
      const wireframeContent = responseContent.substring(startIndex + startMarker.length, endIndex).trim();
      const lines = wireframeContent.split('\n').filter(line => line.trim());
      
      console.log(`✅ 페이지 ${pageNumber}: 마커에서 추출`);
      return this.parseWireframeLines(lines);
      
    } catch (error) {
      console.error(`❌ 페이지 ${pageNumber} 와이어프레임 추출 실패:`, error);
      return null;
    }
  }

  // 와이어프레임 라인들을 구조화된 데이터로 파싱
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

  // 와이어프레임을 읽기 쉬운 설명으로 변환
  private convertWireframeToDescription(wireframe: any): string {
    if (!wireframe || !wireframe.sections || wireframe.sections.length === 0) {
      return '페이지 상단에 제목을 배치하고, 중앙에 주요 콘텐츠, 하단에 네비게이션을 포함하는 기본적인 3단 구조로 구성됩니다.';
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

  // 간단한 폴백 설명 생성
  private createFallbackDescription(topic: string): string {
    return `페이지 상단에 "${topic}" 제목을 큰 폰트로 배치하고, 중앙 영역에 주요 콘텐츠를 설명하는 텍스트와 함께 관련 이미지나 다이어그램을 좌우 분할 레이아웃으로 배치합니다. 하단에는 학습자의 이해를 돕는 요약 정보나 다음 단계로의 연결고리를 제공하는 네비게이션 영역이 포함됩니다.`;
  }

  private createFallbackResult(projectData: ProjectData): LayoutWireframe {
    const fallbackPages: PageLayoutProposal[] = projectData.pages.map((page, index) => {
      const wireframe = {
        version: 'wire.v1',
        viewportMode: projectData.layoutMode,
        flow: index === 0 ? 'A:intro' : index === projectData.pages.length - 1 ? 'E:bridge' : 'C:content',
        sections: [
          { id: 'header', role: 'title', grid: '1-12', height: '120', content: '제목+부제목', gapBelow: '32' },
          { id: 'main', role: 'content', grid: '8+4', height: 'auto', content: '텍스트+이미지', gapBelow: '48' },
          { id: 'footer', role: 'navigation', grid: '3-10', height: '80', content: '연결+버튼', gapBelow: '0' }
        ]
      };
      
      return {
        pageId: page.id,
        pageTitle: page.topic,
        pageNumber: page.pageNumber,
        layoutDescription: this.convertWireframeToDescription(wireframe),
        generatedAt: new Date()
      };
    });

    return {
      layoutMode: projectData.layoutMode,
      pages: fallbackPages,
      generatedAt: new Date()
    };
  }
}