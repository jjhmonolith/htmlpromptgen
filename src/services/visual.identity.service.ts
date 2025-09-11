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
        model: 'gpt-4o',
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
        max_tokens: 8000
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

### 1. 가독성 최우선 컬러 시스템
- **배경 대비 텍스트**: 최소 7:1 대비율로 장시간 읽기에 최적화
- **제목 강조 색상**: 배경과 충분한 대비로 섹션 구분 명확
- **눈의 피로감 방지**: 부드러운 색조로 긴 스크롤에서도 편안함
- **색상 계층 구조**: Primary(메인) → Secondary(보조) → Accent(강조) 순서로 시각적 흐름 유도

### 2. 프로젝트 맞춤형 디자인 분위기
#### 대상별 특화:
- **어린이 대상**: 밝고 친근한 색상, 부드러운 곡선, 큰 아이콘
- **청소년 대상**: 트렌디하고 역동적인 색상, 현대적 타이포그래피
- **성인 대상**: 전문적이고 차분한 색상, 깔끔한 레이아웃
- **전문가 대상**: 고급스럽고 신뢰감 있는 색상, 정교한 디테일

#### 주제별 창의적 특화:
- **과학/기술**: 사이버펑크 네온 그라디언트, 홀로그래픽 이펙트, 기하학 패턴, 글리치 효과, 미래적 글래스모피즘
- **예술/창작**: 아르누보 곡선, 워터컬러 블렌딩, 비대칭 그리드, 브러시 텍스처, 추상적 도형 조합, 색상 폭발 효과
- **역사/인문**: 빈티지 세리프, 고전 장식 패턴, 페이지 에이징 효과, 양피지 텍스처, 수채화 번짐 효과, 금박 액센트
- **언어/문학**: 타이포그래피 아트, 글리프 디자인, 책 페이지 넘김 애니메이션, 잉크 플로우 효과, 손글씨 캘리그래피

### 3. 공간 활용 철학
- 가로: 1600px 고정, 세로: 콘텐츠 양에 따라 **자유롭게 확장**
- **길이 제한 없이** 완전한 정보 전달 우선
- **충분한 간격**으로 가독성 확보
- 섹션 간 **여유로운 여백** (60-80px)

### 4. 현대적 디자인 시스템 (스크롤형)
- **글래스모피즘**: 반투명 요소, 블러 백드롭, 서브틀 그라디언트
- **네오모피즘**: 소프트 그림자, 엠보스드 버튼, 미니멀 하이라이트
- **그라디언트 메쉬**: 유기적 색상 블렌딩, 노이즈 텍스처 오버레이
- **브로큰 그리드**: 비대칭 레이아웃, 오프셋 요소, 다이나믹 여백
- **모션 그래픽**: 패럴랙스 스크롤링, 모폴링 애니메이션, 파티클 시스템

다음 항목들을 JSON 형식으로 제공해주세요:

{
  "moodAndTone": "프로젝트 주제(${projectData.pages.map(p => p.topic).join(', ')})와 대상(${projectData.targetAudience})에 최적화된 4개 형용사 (예: 여유로운, 탐험적인, 몰입감 있는, 친근한)",
  
  "colorPalette": {
    "primary": "#HEX코드 (프로젝트 주제에 맞는 메인 색상 - 긴 스크롤에도 피로감 없도록, 최소 7:1 텍스트 대비율)",
    "secondary": "#HEX코드 (대상 연령에 적합한 보조 색상, primary와 조화롭되 충분히 구분)",
    "accent": "#HEX코드 (스크롤 진행 표시용 강조색, 시선을 끄는 생생한 색상)",
    "text": "#HEX코드 (장시간 읽기에 최적화된 텍스트 색상, 배경 대비 최소 7:1)",
    "background": "#HEX코드 (아이보호와 집중력을 위한 따뜻하고 편안한 배경색)"
  },
  
  "typography": {
    "headingFont": "대상(${projectData.targetAudience})과 주제에 맞는 제목용 폰트 (계층 구조 명확)",
    "bodyFont": "긴 텍스트 읽기용 최적화 폰트 (가독성 최우선)",
    "baseSize": "스크롤 환경 최적 크기 (최소 18px, 대상 연령 고려)"
  },
  
  "componentStyle": "${projectData.projectTitle} 프로젝트와 ${projectData.targetAudience} 대상에 특화된 창의적 스크롤형 UI: 글래스모피즘 카드, 비대칭 그리드 레이아웃, 모폴링 버튼, 그라디언트 메쉬 배경, 파티클 애니메이션, 홀로그래픽 테두리, 3D 변환 효과. 주제별 독창적 디자인 시스템 적용하여 시각적 임팩트 극대화 (250자 이내)"
}

**스크롤형 특화 요구사항:**
1. 긴 스크롤에도 **피로감 없는** 색상 선택 (대상 연령 고려)
2. 섹션 구분이 **자연스럽게** 보이는 디자인
3. 스크롤 진행 상황을 **시각적으로 안내**하는 요소
4. 모바일 환경에서도 **편안한** 스크롤 경험
5. **배경 대비 텍스트 가시성 7:1 이상** 보장 (제목, 본문 모두)
6. 프로젝트 주제(${projectData.pages.map(p => p.topic).join(', ')})에 맞는 **구체적 분위기와 형태**
7. 대상(${projectData.targetAudience})의 특성을 반영한 **맞춤형 디자인**
8. JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요
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

### 1. 가독성 최우선 컬러 시스템 (고정형 특화)
- **배경 대비 제목**: 최소 7:1 대비율로 즉시 인식 가능
- **텍스트 계층 구조**: Primary(제목) → Secondary(부제목) → Text(본문) 명확한 대비
- **제한된 공간 최적화**: 강렬한 대비로 정보 전달력 극대화
- **색상 효율성**: 적은 색상으로 최대 임팩트 (3-4색 이내)

### 2. 프로젝트 맞춤형 디자인 분위기 (고정형 특화)
#### 대상별 특화:
- **어린이 대상**: 밝고 활기찬 색상, 큰 아이콘, 간단한 구성
- **청소년 대상**: 모던하고 역동적인 색상, 트렌디한 UI 요소
- **성인 대상**: 전문적이고 신뢰감 있는 색상, 효율적 레이아웃
- **전문가 대상**: 고급스럽고 차분한 색상, 정보 밀도 최적화

#### 주제별 창의적 특화 (고정형):
- **과학/기술**: 네오모피즘, 사이버그리드 패턴, 홀로그램 테두리, LED 글로우 효과, 메탈릭 그라디언트
- **예술/창작**: 브로큰 그리드, 색상 블리딩, 추상 도형 마스킹, 브러시 스트로크 테두리, 컬러 스플래시
- **역사/인문**: 페이퍼 텍스처, 펜 잉크 효과, 고딕 장식 프레임, 마블링 패턴, 골드 포일 강조
- **언어/문학**: 타이포그래피 레이어링, 북 스파인 디자인, 손글씨 오버레이, 페이지 코너 폴딩

### 3. 공간 효율 극대화
- **엄격히 고정된** 1600x1000px 프레임
- **여백 최소화**로 콘텐츠 밀도 극대화  
- **압축적 표현**으로 핵심 정보 전달
- 모든 요소가 **한 화면에 완결**

### 4. 현대적 디자인 시스템 (고정형)
- **클레이모피즘**: 플라스틱 표면 질감, 입체적 그림자, 메탈릭 하이라이트
- **브루탈리즘**: 거친 테두리, 원시적 폰트, 고대비 색상 충돌
- **그라디언트 보더**: 무지개 테두리, 홀로그래픽 아웃라인, 네온 글로우
- **기하학적 마스킹**: 다각형 클리핑, 프랙탈 패턴, 모자이크 효과
- **레이어드 깊이**: Z-인덱스 활용, 플로팅 요소, 멀티 플레인 구성

다음 항목들을 JSON 형식으로 제공해주세요:

{
  "moodAndTone": "프로젝트 주제(${projectData.pages.map(p => p.topic).join(', ')})와 대상(${projectData.targetAudience})에 최적화된 고정형에 적합한 4개 형용사 (예: 명료한, 집중된, 임팩트 있는, 효율적인)",
  
  "colorPalette": {
    "primary": "#HEX코드 (프로젝트 주제에 맞는 강렬한 메인 색상 - 즉시 시선 집중, 배경 대비 최소 7:1)",
    "secondary": "#HEX코드 (대상 연령에 적합한 명확한 보조 색상, primary와 강한 대비)",
    "accent": "#HEX코드 (핵심 정보 강조용 고대비 색상, 시선을 확실히 끄는 색)",
    "text": "#HEX코드 (제한 공간에서 최고 가독성 텍스트 색상, 배경 대비 최소 7:1)",
    "background": "#HEX코드 (콘텐츠 밀도 고려한 깔끔한 배경색, 모든 텍스트와 7:1 대비)"
  },
  
  "typography": {
    "headingFont": "대상(${projectData.targetAudience})과 주제에 맞는 고정형 제목용 폰트 (임팩트와 압축성)",
    "bodyFont": "제한 공간 최적화 본문 폰트 (밀도와 가독성 균형)",
    "baseSize": "고정 프레임 최적 크기 (최소 16px, 공간 효율 고려)"
  },
  
  "componentStyle": "${projectData.projectTitle} 프로젝트와 ${projectData.targetAudience} 대상에 특화된 창의적 고정형 UI: 클레이모피즘 요소, 브루탈리즘 타이포그래피, 그라디언트 보더, 기하학적 마스킹, 레이어드 깊이감, 홀로그래픽 하이라이트, 네온 글로우 액센트. 제한된 공간에서 최대 시각적 임팩트와 정보 전달력 달성 (250자 이내)"
}

**고정형 특화 요구사항:**
1. 제한된 공간에서 **최대 정보 전달량** 달성 (대상 연령 고려)
2. **즉석에서 이해** 가능한 직관적 디자인
3. **픽셀 단위 정확도**로 레이아웃 최적화
4. 스크롤 없이 **완결된 경험** 제공
5. **배경 대비 모든 텍스트 7:1 이상** 보장 (제목, 본문, 라벨 모두)
6. 프로젝트 주제(${projectData.pages.map(p => p.topic).join(', ')})에 맞는 **구체적 분위기와 형태**
7. 대상(${projectData.targetAudience})의 특성을 반영한 **효율적 맞춤형 디자인**
8. JSON 형식으로만 응답하고 다른 설명은 포함하지 마세요
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