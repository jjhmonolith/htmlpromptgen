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
    const layoutGuide = this.getLayoutModeGuide(projectData.layoutMode);
    const contentGuide = this.getContentModeGuide(projectData.contentMode);
    const audienceGuide = this.getAudienceGuide(projectData.targetAudience);

    return `당신은 교육 콘텐츠의 비주얼 아이덴티티를 디자인하는 전문 BI 디자이너입니다. 주어진 프로젝트에 맞는 무드, 색상 팔레트, 타이포그래피, 컴포넌트 스타일을 제안해주세요.

### 📚 프로젝트 정보
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **사용자 추가 제안**: ${projectData.additionalRequirements || '기본적인 교육용 디자인'}

### 📐 레이아웃 제약사항
${layoutGuide}

### 🎨 콘텐츠 생성 방침
${contentGuide}

### 👥 대상 학습자 특성
${audienceGuide}

### 📋 생성할 항목
1. **Mood & Tone**: 프로젝트의 전반적인 분위기를 설명하는 핵심 키워드 3-4개를 제시해주세요. (예: "활기찬, 재미있는, 다채로운, 친근한")
2. **Color Palette**: 분위기에 맞는 색상 팔레트를 HEX 코드로 제안해주세요. (primary, secondary, accent, text, background)
3. **Typography**: 제목과 본문에 어울리는 폰트 패밀리와 기본 사이즈를 제안해주세요. (headingFont, bodyFont, baseSize)
4. **Component Style**: 버튼, 카드 등 UI 요소의 전반적인 스타일을 간결하게 설명해주세요. (예: "버튼은 모서리가 둥글고, 카드에는 약간의 그림자 효과를 적용합니다.")

### 💻 출력 형식
반드시 다음 JSON 형식으로 응답해주세요. 모든 항목을 빠짐없이 채워주세요.
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
        "headingFont": "Pretendard, system-ui, sans-serif",
        "bodyFont": "Noto Sans KR, system-ui, sans-serif",
        "baseSize": "18px"
    },
    "componentStyle": "버튼은 모서리가 둥글고 호버 시 살짝 위로 올라가는 효과를 줍니다. 카드는 부드러운 그림자와 함께 깨끗한 흰색 배경을 가집니다."
}`;
  }

  private getLayoutModeGuide(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `**스크롤 없는 1600×1000px 고정 화면**에 최적화된 디자인이 필요합니다. 제한된 공간에서 최대한의 임팩트를 낼 수 있는 간결하고 효율적인 비주얼 요소를 제안하세요. 압축적이면서도 아름다운 디자인을 위해 작은 여백, 미니멀한 컴포넌트, 명확한 색상 구분을 고려하세요.`;
    } else {
      return `**1600px 너비 스크롤 가능 화면**에 최적화된 디자인이 필요합니다. 세로로 자유롭게 스크롤할 수 있으므로 호흡감 있는 레이아웃을 위해 넉넉한 여백, 풍부한 시각적 요소, 스토리텔링하듯 자연스러운 흐름을 만드는 디자인을 제안하세요.`;
    }
  }

  private getContentModeGuide(contentMode: 'original' | 'enhanced' | 'restricted'): string {
    if (contentMode === 'enhanced') {
      return `제공된 프로젝트 정보를 바탕으로 **창의적으로 내용을 보강하고 확장**하여 풍부한 교육 콘텐츠를 만드는 방향입니다. 학습자의 이해를 돕는 다양한 시각적 요소, 흥미로운 색상 조합, 매력적인 컴포넌트 스타일을 자유롭게 제안하세요.`;
    } else {
      return `제공된 프로젝트 정보를 **그대로 유지**하면서 추가적인 확장 없이 본질에 집중하는 방향입니다. 심플하고 정돈된 디자인으로 콘텐츠 자체에 집중할 수 있도록 절제된 색상과 깔끔한 컴포넌트 스타일을 제안하세요.`;
    }
  }

  private getAudienceGuide(targetAudience: string): string {
    if (targetAudience.includes('초등') || targetAudience.includes('어린이')) {
      return `초등학생과 어린이를 대상으로 하므로 밝고 친근하며 호기심을 자극하는 분위기가 중요합니다. 생생한 색상과 둥근 모서리, 재미있는 요소를 고려하세요.`;
    } else if (targetAudience.includes('중학') || targetAudience.includes('청소년')) {
      return `중학생을 대상으로 하므로 어리지 않다고 느끼면서도 부담스럽지 않은 세련된 분위기가 효과적입니다. 트렌디하면서도 교육적인 균형을 맞춘 디자인을 고려하세요.`;
    } else if (targetAudience.includes('고등') || targetAudience.includes('고등학생')) {
      return `고등학생을 대상으로 하므로 성숙하면서도 지루하지 않은 트렌디한 감성이 효과적입니다. 모던하고 세련된 색상과 깔끔한 타이포그래피를 고려하세요.`;
    } else if (targetAudience.includes('성인') || targetAudience.includes('대학생')) {
      return `성인 학습자를 대상으로 하므로 전문적이면서도 접근하기 쉬운 신뢰할 수 있는 분위기가 필요합니다. 차분하고 안정적인 색상과 읽기 편한 타이포그래피를 고려하세요.`;
    }
    return `${targetAudience}의 특성을 고려한 적절한 분위기 연출이 중요합니다.`;
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
