import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity } from '../types/workflow.types';

export class VisualIdentityService {
  private openaiService = OpenAIService.getInstance();

  async generateVisualIdentity(projectData: ProjectData): Promise<VisualIdentity> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService.initialize(apiKey);
    
    const client = this.openaiService.getClient();
    
    const prompt = this.buildPrompt(projectData);
    
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 교육 콘텐츠 디자인 전문가입니다. 사용자의 요청에 따라 비주얼 아이덴티티를 설계하고 JSON 형식으로 응답합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI 응답이 비어있습니다.');
      }

      // JSON 응답 파싱
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('유효한 JSON 응답을 찾을 수 없습니다.');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);
      
      // VisualIdentity 타입으로 변환
      const visualIdentity: VisualIdentity = {
        primaryColor: aiResponse.colorPalette?.primary || '#3e88ff',
        secondaryColor: aiResponse.colorPalette?.secondary || '#10B981',
        accentColor: aiResponse.colorPalette?.accent || '#FBBF24',
        fontFamily: aiResponse.typography?.headingFont || 'Pretendard, system-ui, sans-serif',
        fontSize: aiResponse.typography?.baseSize || '18px',
        tone: this.mapToneFromMood(aiResponse.moodAndTone),
        moodBoard: aiResponse.moodAndTone || '친근한, 활기찬, 명료한, 현대적인',
        colorPalette: {
          primary: aiResponse.colorPalette?.primary || '#3e88ff',
          secondary: aiResponse.colorPalette?.secondary || '#10B981',
          accent: aiResponse.colorPalette?.accent || '#FBBF24',
          text: aiResponse.colorPalette?.text || '#1F2937',
          background: aiResponse.colorPalette?.background || '#FFFFFF'
        },
        typography: {
          headingFont: aiResponse.typography?.headingFont || 'Pretendard, system-ui, sans-serif',
          bodyFont: aiResponse.typography?.bodyFont || 'Pretendard, system-ui, sans-serif',
          baseSize: aiResponse.typography?.baseSize || '18px'
        },
        moodAndTone: aiResponse.moodAndTone || '친근한, 활기찬, 명료한, 현대적인',
        componentStyle: aiResponse.componentStyle || '버튼은 둥근 모서리와 부드러운 그림자를 사용하며, 카드는 깔끔한 여백과 미니멀한 디자인을 적용합니다.'
      };

      return visualIdentity;

    } catch (error) {
      console.error('비주얼 아이덴티티 생성 실패:', error);
      throw new Error(`비주얼 아이덴티티 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private buildPrompt(projectData: ProjectData): string {
    return `
당신은 교육 콘텐츠 디자인 전문가입니다. 
다음 프로젝트의 비주얼 아이덴티티를 디자인해주세요:

프로젝트 정보:
- 프로젝트명: ${projectData.projectTitle}
- 대상 학습자: ${projectData.targetAudience}
- 페이지 주제: ${projectData.pages.map(p => p.topic).join(', ')}
- 레이아웃 모드: ${projectData.layoutMode === 'fixed' ? '고정 크기 1600x1000px' : '스크롤 가능'}
- 콘텐츠 모드: ${projectData.contentMode === 'enhanced' ? 'AI 보강' : '원본 유지'}
- 사용자 제안: ${projectData.suggestions || '없음'}

다음 항목들을 JSON 형식으로 제공해주세요:

{
  "moodAndTone": "4개 형용사를 쉼표로 구분 (예: 친근한, 호기심을 자극하는, 명료한, 활기찬)",
  
  "colorPalette": {
    "primary": "#HEX코드 (메인 브랜드 색상)",
    "secondary": "#HEX코드 (보조 색상)",
    "accent": "#HEX코드 (강조 색상)",
    "text": "#HEX코드 (본문 텍스트)",
    "background": "#HEX코드 (배경색)"
  },
  
  "typography": {
    "headingFont": "제목용 폰트 스택 (한글 폰트 포함)",
    "bodyFont": "본문용 폰트 스택 (한글 폰트 포함)",
    "baseSize": "기본 폰트 크기 (최소 18px)"
  },
  
  "componentStyle": "UI 컴포넌트 스타일 가이드라인 (버튼, 카드, 입력 요소, 코드 블록 등 200자 이내)"
}

요구사항:
1. 대상 학습자의 연령과 특성을 고려
2. 교육 콘텐츠의 가독성과 접근성 우선
3. 색상 대비는 WCAG AA 기준 충족 (4.5:1)
4. 한국어 텍스트 렌더링 최적화
5. JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요
    `;
  }

  private mapToneFromMood(moodAndTone: string): 'professional' | 'friendly' | 'playful' {
    const mood = moodAndTone.toLowerCase();
    
    if (mood.includes('전문적') || mood.includes('정확한') || mood.includes('체계적')) {
      return 'professional';
    } else if (mood.includes('재미') || mood.includes('게임') || mood.includes('활기') || mood.includes('밝은')) {
      return 'playful';
    } else {
      return 'friendly';
    }
  }

  // 색상 접근성 검증
  validateColorContrast(backgroundColor: string, textColor: string): boolean {
    // 간단한 대비율 계산 (실제로는 더 복잡한 WCAG 계산이 필요)
    const bgLuminance = this.getLuminance(backgroundColor);
    const textLuminance = this.getLuminance(textColor);
    
    const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                         (Math.min(bgLuminance, textLuminance) + 0.05);
    
    return contrastRatio >= 4.5; // WCAG AA 기준
  }

  private getLuminance(hex: string): number {
    // HEX to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    // Relative luminance
    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // 미리 정의된 안전한 색상 조합들
  getPresetColorPalettes() {
    return [
      {
        name: '교육용 블루',
        colorPalette: {
          primary: '#3e88ff',
          secondary: '#10B981',
          accent: '#FBBF24',
          text: '#1F2937',
          background: '#FFFFFF'
        }
      },
      {
        name: '친근한 그린',
        colorPalette: {
          primary: '#10B981',
          secondary: '#3e88ff',
          accent: '#F59E0B',
          text: '#374151',
          background: '#F9FAFB'
        }
      },
      {
        name: '활기찬 오렌지',
        colorPalette: {
          primary: '#F59E0B',
          secondary: '#8B5CF6',
          accent: '#EF4444',
          text: '#1F2937',
          background: '#FFFBEB'
        }
      }
    ];
  }
}