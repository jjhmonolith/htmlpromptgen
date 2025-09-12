import { OpenAIService } from './openai.service';
import { ProjectData, Step2RawResponse, VisualIdentity, DesignTokens } from '../types/workflow.types';

const BRAND_LOCKS = {
  text: "#0F172A",
  background: "#FFFFFF",
  headingFont: "Pretendard",
  bodyFont: "Noto Sans KR"
};

const FIXED_TOKENS: DesignTokens = {
  viewport: { width: 1600, height: 1000 },
  safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
  grid: { columns: 12, gap: 24 },
  spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
  radius: { sm: 8, md: 16, lg: 24 },
  elevation: {
    low: "0 2px 4px rgba(0, 0, 0, 0.1)",
    medium: "0 4px 8px rgba(0, 0, 0, 0.15)",
    high: "0 8px 16px rgba(0, 0, 0, 0.2)"
  },
  zIndex: { base: 0, image: 10, card: 20, text: 30 }
};

const SCROLL_TOKENS: DesignTokens = {
  viewport: { width: 1600 },
  safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
  grid: { columns: 12, gap: 24 },
  spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
  radius: { sm: 8, md: 16, lg: 24 },
  elevation: {
    low: "0 2px 4px rgba(0, 0, 0, 0.1)",
    medium: "0 4px 8px rgba(0, 0, 0, 0.15)",
    high: "0 8px 16px rgba(0, 0, 0, 0.2)"
  },
  zIndex: { base: 0, image: 10, card: 20, text: 30 }
};

export class Step2VisualIdentityService {
  constructor(private openAIService: OpenAIService) {}

  generateVisualIdentity(projectData: ProjectData): Promise<{ visualIdentity: VisualIdentity; designTokens: DesignTokens }> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🎨 Step2: 비주얼 아이덴티티 생성 시작');
        console.log('📋 입력 프로젝트 데이터:', projectData);
        
        const prompt = this.createStep2Prompt(projectData);
        console.log('📝 Step2 프롬프트 생성 완료');
        console.log('🔍 생성된 프롬프트:', prompt.substring(0, 500) + '...');
        
        console.log('🚀 OpenAI API 호출 시작...');
        const response = await this.openAIService.createCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          top_p: 1,
          max_tokens: 1000,
          stop: ["END_S2"]
        });
        console.log('✅ OpenAI API 응답 수신:', response);

        if (!response?.choices?.[0]?.message?.content) {
          console.error('❌ 응답 구조 오류:', response);
          throw new Error('Step2: 응답이 비어있습니다');
        }

        const rawContent = response.choices[0].message.content;
        console.log('🔄 Step2 원시 응답 수신:', rawContent.substring(0, 200) + '...');
        
        const parsedData = this.parseStep2Response(rawContent);
        console.log('✅ Step2 파싱 완료:', parsedData);
        
        const finalResult = this.assembleStep2(parsedData, projectData.layoutMode);
        console.log('🎯 Step2 최종 결과 조립 완료');
        
        resolve(finalResult);
      } catch (error) {
        console.error('❌ Step2 생성 실패:', error);
        
        const fallbackResult = this.createFallbackResult(projectData.layoutMode);
        console.log('🔄 Step2 폴백 결과 적용');
        resolve(fallbackResult);
      }
    });
  }

  private createStep2Prompt(projectData: ProjectData): string {
    const s1Json = JSON.stringify({
      projectData: {
        projectTitle: projectData.projectTitle,
        targetAudience: projectData.targetAudience,
        layoutMode: projectData.layoutMode,
        contentMode: projectData.contentMode,
        pages: projectData.pages
      }
    }, null, 2);

    // 랜덤성을 위한 시드 추가
    const creativeSeed = Math.floor(Math.random() * 1000);

    return `교육용 프로젝트를 위한 비주얼 아이덴티티를 설계해주세요.

프로젝트 정보:
${s1Json}

다음 형식으로 응답해주세요:

BEGIN_S2
VERSION=vi.v1
MOOD=형용사1,형용사2,형용사3,형용사4
COLOR_PRIMARY=#RRGGBB
COLOR_SECONDARY=#RRGGBB  
COLOR_ACCENT=#RRGGBB
BASE_SIZE_PT=18
COMPONENT_STYLE=교육용 디자인 컨셉 설명
END_S2

요구사항:
- 색상은 HEX 형식 6자리로 작성
- BASE_SIZE_PT는 18 또는 20으로 선택
- MOOD는 쉼표로 구분된 4개 형용사
- 프로젝트 주제에 적합한 창의적 디자인 제안`;
  }

  private parseStep2Response(content: string): Step2RawResponse {
    console.log('🔍 Step2 응답 파싱 시작');
    console.log('📄 전체 응답 내용:', content);
    
    const extracted = this.extractBetween(content, "BEGIN_S2", "END_S2");
    if (!extracted) {
      console.error('❌ 마커 파싱 실패. 응답에서 BEGIN_S2 또는 END_S2를 찾을 수 없습니다.');
      console.log('🔍 BEGIN_S2 위치:', content.indexOf('BEGIN_S2'));
      console.log('🔍 END_S2 위치:', content.indexOf('END_S2'));
      throw new Error('BEGIN_S2/END_S2 마커를 찾을 수 없습니다');
    }

    const lines = extracted.split('\n').filter(line => line.trim());
    const kvPairs: Record<string, string> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        kvPairs[key.trim()] = valueParts.join('=').trim();
      }
    }

    console.log('📋 파싱된 K/V 쌍:', kvPairs);

    const result: Step2RawResponse = {
      version: kvPairs.VERSION || 'vi.v1',
      mood: kvPairs.MOOD || '',
      colorPrimary: this.normalizeHex(kvPairs.COLOR_PRIMARY || '#004D99'),
      colorSecondary: this.normalizeHex(kvPairs.COLOR_SECONDARY || '#E9F4FF'),
      colorAccent: this.normalizeHex(kvPairs.COLOR_ACCENT || '#FFCC00'),
      baseSizePt: this.parseBaseSizePt(kvPairs.BASE_SIZE_PT || '20'),
      componentStyle: this.normalizeCommaText(kvPairs.COMPONENT_STYLE || '기본 스타일')
    };

    this.validateStep2Data(result);
    return result;
  }

  private extractBetween(text: string, startMarker: string, endMarker: string): string | null {
    const startIndex = text.indexOf(startMarker);
    
    if (startIndex === -1) {
      return null;
    }
    
    const endIndex = text.indexOf(endMarker, startIndex);
    
    if (endIndex === -1) {
      // END 마커가 없으면 START 마커 이후의 모든 내용을 사용
      console.log('⚠️ END 마커를 찾을 수 없습니다. START 마커 이후의 모든 내용을 사용합니다.');
      return text.slice(startIndex + startMarker.length).trim();
    }
    
    return text.slice(startIndex + startMarker.length, endIndex).trim();
  }

  private normalizeHex(hex: string): string {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    
    if (cleanHex.length === 3) {
      return '#' + cleanHex.split('').map(char => char + char).join('');
    }
    
    if (cleanHex.length === 6) {
      return '#' + cleanHex.toUpperCase();
    }
    
    return '#004D99';
  }

  private parseBaseSizePt(value: string): number {
    const num = parseInt(value, 10);
    return (num === 18 || num === 20) ? num : 20;
  }

  private normalizeCommaText(text: string): string {
    return text.replace(/，/g, ',');
  }

  private validateStep2Data(data: Step2RawResponse): void {
    const warnings: string[] = [];
    
    if (!data.mood || data.mood.split(',').length !== 4) {
      warnings.push('MOOD 형용사 4개 필요');
    }
    
    if (!/^#[0-9A-F]{6}$/i.test(data.colorPrimary)) {
      warnings.push('COLOR_PRIMARY HEX 형식 오류');
    }
    
    if (!/^#[0-9A-F]{6}$/i.test(data.colorSecondary)) {
      warnings.push('COLOR_SECONDARY HEX 형식 오류');
    }
    
    if (!/^#[0-9A-F]{6}$/i.test(data.colorAccent)) {
      warnings.push('COLOR_ACCENT HEX 형식 오류');
    }
    
    if (data.baseSizePt !== 18 && data.baseSizePt !== 20) {
      warnings.push('BASE_SIZE_PT는 18 또는 20만 허용');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Step2 검증 경고:', warnings);
    }
  }

  private assembleStep2(rawKV: Step2RawResponse, layoutMode: 'fixed' | 'scrollable'): { visualIdentity: VisualIdentity; designTokens: DesignTokens } {
    const visualIdentity: VisualIdentity = {
      moodAndTone: rawKV.mood.split(',').map(mood => mood.trim()),
      colorPalette: {
        primary: rawKV.colorPrimary,
        secondary: rawKV.colorSecondary,
        accent: rawKV.colorAccent,
        text: BRAND_LOCKS.text,
        background: BRAND_LOCKS.background
      },
      typography: {
        headingFont: BRAND_LOCKS.headingFont,
        bodyFont: BRAND_LOCKS.bodyFont,
        baseSize: `${rawKV.baseSizePt}pt`
      },
      componentStyle: rawKV.componentStyle
    };

    const designTokens = layoutMode === 'fixed' ? FIXED_TOKENS : SCROLL_TOKENS;

    return { visualIdentity, designTokens };
  }

  private createFallbackResult(layoutMode: 'fixed' | 'scrollable'): { visualIdentity: VisualIdentity; designTokens: DesignTokens } {
    const visualIdentity: VisualIdentity = {
      moodAndTone: ['명료', '친근', '탐구', '안정'],
      colorPalette: {
        primary: '#004D99',
        secondary: '#E9F4FF', 
        accent: '#FFCC00',
        text: BRAND_LOCKS.text,
        background: BRAND_LOCKS.background
      },
      typography: {
        headingFont: BRAND_LOCKS.headingFont,
        bodyFont: BRAND_LOCKS.bodyFont,
        baseSize: '20pt'
      },
      componentStyle: '라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선'
    };

    const designTokens = layoutMode === 'fixed' ? FIXED_TOKENS : SCROLL_TOKENS;

    return { visualIdentity, designTokens };
  }
}