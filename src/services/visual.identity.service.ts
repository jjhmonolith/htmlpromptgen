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
    if (projectData.layoutMode === 'scrollable') {
      return this.buildScrollablePrompt(projectData);
    } else {
      return this.buildFixedPrompt(projectData);
    }
  }

  private buildScrollablePrompt(projectData: ProjectData): string {
    return `
당신은 교육 콘텐츠 디자인 전문가입니다. 
📜 **스크롤 가능 레이아웃**을 위한 비주얼 아이덴티티를 디자인해주세요.

## 프로젝트 정보
- 프로젝트명: ${projectData.projectTitle}
- 대상 학습자: ${projectData.targetAudience}
- 페이지 주제: ${projectData.pages.map(p => p.topic).join(', ')}
- 콘텐츠 모드: ${projectData.contentMode === 'enhanced' ? 'AI 보강' : '원본 유지'}
- 사용자 제안: ${projectData.suggestions || '없음'}

## 📜 스크롤 가능 레이아웃 전용 디자인 원칙

**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

### 1. 공간 활용 철학
- 가로: 1600px 고정, 세로: 콘텐츠 양에 따라 **자유롭게 확장**
- **길이 제한 없이** 완전한 정보 전달 우선
- **충분한 간격**으로 가독성 확보
- 섹션 간 **여유로운 여백** (60-80px)

### 2. 시각적 흐름 설계
- 스크롤 진행에 따른 **점진적 정보 공개**
- **자연스러운 읽기 흐름** 유지
- 긴 콘텐츠도 **피로감 없는** 색상 조합
- **스크롤 유도** 시각적 단서 포함

다음 항목들을 JSON 형식으로 제공해주세요:

{
  "moodAndTone": "스크롤형에 적합한 4개 형용사 (예: 여유로운, 탐험적인, 몰입감 있는, 친근한)",
  
  "colorPalette": {
    "primary": "#HEX코드 (부드러운 메인 색상 - 긴 스크롤에도 피로감 없도록)",
    "secondary": "#HEX코드 (차분한 보조 색상)",
    "accent": "#HEX코드 (스크롤 진행 표시용 강조색)",
    "text": "#HEX코드 (긴 텍스트 읽기에 최적화된 색상)",
    "background": "#HEX코드 (아이보호를 위한 따뜻한 배경)"
  },
  
  "typography": {
    "headingFont": "스크롤형 제목용 폰트 (계층 구조 명확)",
    "bodyFont": "긴 텍스트 읽기용 최적화 폰트",
    "baseSize": "스크롤 환경 최적 크기 (최소 18px)"
  },
  
  "componentStyle": "스크롤형 UI 가이드라인: 카드형 섹션, 부드러운 모서리, 스크롤 인디케이터, 점진적 공개 애니메이션, 충분한 패딩 (200자 이내)"
}

**스크롤형 특화 요구사항:**
1. 긴 스크롤에도 **피로감 없는** 색상 선택
2. 섹션 구분이 **자연스럽게** 보이는 디자인
3. 스크롤 진행 상황을 **시각적으로 안내**하는 요소
4. 모바일 환경에서도 **편안한** 스크롤 경험
5. JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요
    `;
  }

  private buildFixedPrompt(projectData: ProjectData): string {
    return `
당신은 교육 콘텐츠 디자인 전문가입니다. 
📐 **고정 크기 레이아웃**을 위한 비주얼 아이덴티티를 디자인해주세요.

## 프로젝트 정보
- 프로젝트명: ${projectData.projectTitle}
- 대상 학습자: ${projectData.targetAudience}
- 페이지 주제: ${projectData.pages.map(p => p.topic).join(', ')}
- 콘텐츠 모드: ${projectData.contentMode === 'enhanced' ? 'AI 보강' : '원본 유지'}
- 사용자 제안: ${projectData.suggestions || '없음'}

## 📐 고정 크기 레이아웃 전용 디자인 원칙

**정확히 1600x1000px 프레임 안에서 최대 효율을 달성합니다.**

### 1. 공간 효율 극대화
- **엄격히 고정된** 1600x1000px 프레임
- **여백 최소화**로 콘텐츠 밀도 극대화  
- **압축적 표현**으로 핵심 정보 전달
- 모든 요소가 **한 화면에 완결**

### 2. 시각적 임팩트 집중
- **강렬한 첫인상**으로 즉시 관심 유도
- **명확한 시각적 계층**으로 정보 우선순위 표현
- **대비 강화**로 제한된 공간에서 가독성 확보
- **일목요연한** 레이아웃으로 직관적 이해

다음 항목들을 JSON 형식으로 제공해주세요:

{
  "moodAndTone": "고정형에 적합한 4개 형용사 (예: 명료한, 집중된, 임팩트 있는, 효율적인)",
  
  "colorPalette": {
    "primary": "#HEX코드 (강렬한 메인 색상 - 즉시 시선 집중)",
    "secondary": "#HEX코드 (명확한 보조 색상)",
    "accent": "#HEX코드 (핵심 정보 강조용 고대비 색상)",
    "text": "#HEX코드 (제한 공간에서 최고 가독성)",
    "background": "#HEX코드 (콘텐츠 밀도 고려한 배경)"
  },
  
  "typography": {
    "headingFont": "고정형 제목용 폰트 (임팩트와 압축성)",
    "bodyFont": "제한 공간 최적화 폰트 (밀도와 가독성)",
    "baseSize": "고정 프레임 최적 크기 (최소 16px)"
  },
  
  "componentStyle": "고정형 UI 가이드라인: 컴팩트한 카드, 날카로운 모서리, 고대비 경계선, 정보 밀도 우선, 최소 패딩으로 공간 효율 (200자 이내)"
}

**고정형 특화 요구사항:**
1. 제한된 공간에서 **최대 정보 전달량** 달성
2. **즉석에서 이해** 가능한 직관적 디자인
3. **픽셀 단위 정확도**로 레이아웃 최적화
4. 스크롤 없이 **완결된 경험** 제공
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