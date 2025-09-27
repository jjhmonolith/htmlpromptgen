import { OpenAIService } from './openai.service';
import { ProjectData, VisualIdentity, DesignTokens } from '../types/workflow.types';
import { createStepErrorHandler, FallbackProvider } from './common-error-handler.service';

const BRAND_LOCKS = {
  // 폰트만 브랜드 락으로 유지 (색상은 AI가 생성)
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

class Step2FallbackProvider implements FallbackProvider<{ visualIdentity: VisualIdentity; designTokens: DesignTokens }> {
  constructor(private layoutMode: 'fixed' | 'scrollable') {}

  createFallback(): { visualIdentity: VisualIdentity; designTokens: DesignTokens } {
    const visualIdentity: VisualIdentity = {
      moodAndTone: ['명료', '친근', '탐구', '안정'],
      colorPalette: {
        primary: '#004D99',
        secondary: '#E9F4FF',
        accent: '#FFCC00',
        text: '#0F172A',
        background: '#FFFFFF'
      },
      typography: {
        headingFont: BRAND_LOCKS.headingFont,
        bodyFont: BRAND_LOCKS.bodyFont,
        baseSize: '20pt',
        headingStyle: '명료하고 신뢰할 수 있는',
        bodyStyle: '편안하게 읽기 쉬운'
      },
      componentStyle: '라운드 20–28px와 낮은 그림자，정보를 칩으로 층위화하고 본문 가독성을 우선'
    };

    const designTokens = this.layoutMode === 'fixed' ? FIXED_TOKENS : SCROLL_TOKENS;
    return { visualIdentity, designTokens };
  }
}

export class Step2VisualIdentityService {
  private errorHandler = createStepErrorHandler('Step2');
  constructor(private openAIService: OpenAIService) {}

  async generateVisualIdentity(projectData: ProjectData): Promise<{ visualIdentity: VisualIdentity; designTokens: DesignTokens }> {
    // 입력 검증
    this.errorHandler.validateInput('projectData', projectData, (data) => data && typeof data === 'object');
    this.errorHandler.validateInput('layoutMode', projectData.layoutMode, (mode) => mode === 'fixed' || mode === 'scrollable');

    const fallbackProvider = new Step2FallbackProvider(projectData.layoutMode);

    return this.errorHandler.handle(
      async () => {
        console.log('🎨 Step2: 비주얼 아이덴티티 생성 시작');
        console.log('📋 입력 프로젝트 데이터:', projectData);

        const prompt = this.createStep2Prompt(projectData);
        console.log('📝 Step2 프롬프트 생성 완료');

        console.log('🚀 OpenAI API 호출 시작...');
        const response = await this.openAIService.generateStructuredCompletion(
          prompt,
          this.getResponseSchema(),
          'Step2 Visual Identity',
          {
            model: 'gpt-5-mini',
            reasoningEffort: 'low'
          }
        );

        console.log('✅ OpenAI API 응답 수신');

        // API 응답 검증
        this.errorHandler.validateApiResponse(response);

        const parsedData = response.content;
        console.log('✅ Step2 파싱 완료:', parsedData);

        const finalResult = this.assembleStep2(parsedData, projectData.layoutMode);
        console.log('🎯 Step2 최종 결과 조립 완료');

        return finalResult;
      },
      fallbackProvider,
      { strategy: 'fallback', logLevel: 'error' }
    );
  }

  private getResponseSchema(): any {
    return {
      type: "object",
      properties: {
        moodAndTone: {
          type: "string",
          description: "4개의 형용사를 쉼표로 구분한 문자열"
        },
        colorPalette: {
          type: "object",
          properties: {
            primary: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
            secondary: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
            accent: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
            text: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
            background: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" }
          },
          required: ["primary", "secondary", "accent", "text", "background"],
          additionalProperties: false
        },
        typography: {
          type: "object",
          properties: {
            headingFont: { type: "string" },
            bodyFont: { type: "string" },
            baseSize: { type: "string", pattern: "^\\d+px$" }
          },
          required: ["headingFont", "bodyFont", "baseSize"],
          additionalProperties: false
        },
        componentStyle: {
          type: "string",
          description: "UI 컴포넌트 스타일 가이드"
        }
      },
      required: ["moodAndTone", "colorPalette", "typography", "componentStyle"],
      additionalProperties: false
    };
  }

  private createStep2Prompt(projectData: ProjectData): string {
    return `당신은 프로젝트의 전체적인 비주얼 컨셉을 잡는 아트 디렉터입니다. 사용자가 제공한 프로젝트 개요를 바탕으로, 프로젝트의 '비주얼 아이덴티티'를 정의해주세요.

### :스크롤: 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **사용자 추가 제안**: ${projectData.additionalRequirements || '기본적인 교육용 디자인'}

### :클립보드: 생성할 항목
1. **Mood & Tone**: 프로젝트의 전반적인 분위기를 설명하는 핵심 키워드 3-4개를 제시해주세요. (예: "활기찬, 재미있는, 다채로운, 친근한")
2. **Color Palette**: 분위기에 맞는 색상 팔레트를 HEX 코드로 제안해주세요. (primary, secondary, accent, text, background)
3. **Typography**: 제목과 본문에 어울리는 폰트 패밀리와 기본 사이즈를 제안해주세요. (headingFont, bodyFont, baseSize)
4. **Component Style**: 버튼, 카드 등 UI 요소의 전반적인 스타일을 간결하게 설명해주세요. (예: "버튼은 모서리가 둥글고, 카드에는 약간의 그림자 효과를 적용합니다.")

### :컴퓨터: 출력 형식
반드시 다음 JSON 형식으로 응답해주세요:
{
    "moodAndTone": "활기찬, 재미있는, 다채로운, 친근한",
    "colorPalette": {
        "primary": "#4F46E5",
        "secondary": "#7C3AED",
        "accent": "#F59E0B",
        "text": "#1F2937",
        "background": "#FFFFFF"
    },
    "typography": {
        "headingFont": "Inter, system-ui, sans-serif",
        "bodyFont": "Inter, system-ui, sans-serif",
        "baseSize": "16px"
    },
    "componentStyle": "버튼은 모서리가 둥글고 호버 시 살짝 위로 올라가는 효과를 줍니다. 카드는 부드러운 그림자와 함께 깨끗한 흰색 배경을 가집니다."
}`;
  }


  // JSON 스키마 기반 구조화된 응답 - 복잡한 파싱 불필요

  private assembleStep2(parsedData: any, layoutMode: 'fixed' | 'scrollable'): { visualIdentity: VisualIdentity; designTokens: DesignTokens } {
    const visualIdentity: VisualIdentity = {
      moodAndTone: parsedData.moodAndTone.split(',').map((mood: string) => mood.trim()),
      colorPalette: {
        primary: parsedData.colorPalette.primary,
        secondary: parsedData.colorPalette.secondary,
        accent: parsedData.colorPalette.accent,
        text: parsedData.colorPalette.text,
        background: parsedData.colorPalette.background
      },
      typography: {
        headingFont: parsedData.typography.headingFont,
        bodyFont: parsedData.typography.bodyFont,
        baseSize: parsedData.typography.baseSize,
        headingStyle: '견고하면서도 친근한',
        bodyStyle: '읽기 편안하고 깔끔한'
      },
      componentStyle: parsedData.componentStyle
    };

    const designTokens = layoutMode === 'fixed' ? FIXED_TOKENS : SCROLL_TOKENS;

    return { visualIdentity, designTokens };
  }


}
