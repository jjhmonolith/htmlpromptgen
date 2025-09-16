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
    return new Promise(async (resolve) => {
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
    const constraintGuide = this.getSpaceConstraintGuide(projectData.layoutMode);
    const audienceContext = this.getAudienceContext(projectData.targetAudience);

    return `🎨 교육용 감성 무드 창작 브리프

당신은 교육 콘텐츠의 감정적 경험을 설계하는 창의적 파트너입니다.
개발자가 "이런 분위기로 만들어보고 싶다!"고 느낄 수 있는 영감적 무드 가이드를 작성해주세요.

## 📚 프로젝트 맥락
**주제**: ${projectData.projectTitle}
**학습자**: ${projectData.targetAudience}
${audienceContext}

## 📐 중요한 공간 제약 (반드시 고려!)
${constraintGuide}

## 🎭 당신의 임무
이 교육 프로젝트가 학습자에게 어떤 감정적 경험을 선사할지 상상해보세요.
단순히 "파란색을 써라"가 아니라 "왜 이 색상이 이 순간의 학습에 도움이 되는가"를 생각해주세요.

다음과 같은 서술형 무드 가이드를 자유롭게 작성해주세요:

---

**🌟 이 교안이 전하고 싶은 감정과 분위기**
(학습자가 느껴야 할 감정의 여정을 2-3문장으로 서술)

**🎨 색상 감성 이야기**
- **주요 색상**: "[감정을 불러일으키는 색상 설명]" (예: "신뢰감을 주는 딥 블루")
- **보조 색상**: "[분위기를 받쳐주는 색상 설명]"
- **강조 색상**: "[중요한 순간에 사용할 색상 설명]"

**✨ 타이포그래피의 성격**
- **제목 스타일**: "[어떤 느낌으로 읽혀야 하는지]" (예: "자신감 있으면서도 친근한")
- **본문 스타일**: "[어떤 느낌으로 읽혀야 하는지]" (예: "편안하게 읽히는")

**🎪 전체적인 컴포넌트 성격**
(요소들이 서로 어떻게 조화를 이루면서도 각각의 개성을 살릴 수 있는지 2-3문장으로)

**🎯 개발자를 위한 창의적 방향성**
"이런 점을 고려하시면 더 좋을 것 같아요..." 식으로 구체적 제안이 아닌 영감을 주는 방향성 제시

---

**중요**: HEX 코드나 픽셀 단위는 언급하지 마세요. 감성과 경험 중심으로 서술해주세요.`;
  }

  private getSpaceConstraintGuide(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `**🚨 Fixed Mode (1600×1000px) - 절대 준수!**
- 모든 콘텐츠가 스크롤 없이 한 화면에 들어와야 함
- 높이 1000px를 절대 넘을 수 없음 (개발자가 이 점을 놓치기 쉬움)
- 공간 효율성이 핵심: 압축적이면서도 아름다운 디자인이 필요
- "제한된 공간에서 최대한의 임팩트"를 낼 수 있는 무드 제안`;
    } else {
      return `**📜 Scrollable Mode (1600×무제한) - 가로 너비만 준수!**
- 가로 1600px는 절대 넘을 수 없음 (개발자가 가로 오버플로우 실수하기 쉬움)
- 세로는 자유롭게 스크롤 가능하여 여유로운 구성 가능
- 호흡감 있는 레이아웃: 섹션별 충분한 여백과 단계적 전개
- "스토리텔링하듯 자연스러운 흐름"을 만들 수 있는 무드 제안`;
    }
  }

  private getAudienceContext(targetAudience: string): string {
    if (targetAudience.includes('초등') || targetAudience.includes('어린이')) {
      return `**👶 어린이 대상**: 밝고 친근하며 호기심을 자극하는 분위기가 중요합니다.`;
    } else if (targetAudience.includes('중학') || targetAudience.includes('청소년')) {
      return `**🧒 중학생 대상**: 어리지 않다고 느끼면서도 부담스럽지 않은 세련된 분위기가 좋습니다.`;
    } else if (targetAudience.includes('고등') || targetAudience.includes('고등학생')) {
      return `**👨‍🎓 고등학생 대상**: 성숙하면서도 지루하지 않은, 트렌디한 감성이 효과적입니다.`;
    } else if (targetAudience.includes('성인') || targetAudience.includes('대학생')) {
      return `**👩‍💼 성인 대상**: 전문적이면서도 접근하기 쉬운, 신뢰할 수 있는 분위기가 필요합니다.`;
    }
    return `**🎯 대상 학습자**: ${targetAudience}의 특성을 고려한 적절한 분위기 연출이 중요합니다.`;
  }

  private parseStep2Response(content: string): Step2RawResponse {
    console.log('🔍 Step2 창의적 브리프 처리 시작');
    console.log('📄 전체 응답 내용:', content.substring(0, 500) + '...');

    // 자연어 응답을 기본 구조로 변환
    const creativeBrief = this.extractCreativeMood(content);

    const result: Step2RawResponse = {
      version: 'creative.v1',
      mood: creativeBrief.emotionalKeywords || '친근한,창의적인,교육적인,희망적인',
      colorPrimary: '#2563EB', // 기본 신뢰감 있는 블루
      colorSecondary: '#F1F5F9', // 기본 배경색
      colorAccent: '#F59E0B', // 기본 강조색
      baseSizePt: 20, // 기본 크기
      componentStyle: creativeBrief.fullText || '창의적이고 교육적인 디자인'
    };

    console.log('✅ 창의적 브리프 처리 완료:', {
      mood: result.mood,
      hasFullText: result.componentStyle.length > 50
    });

    return result;
  }

  private extractCreativeMood(content: string): { emotionalKeywords: string; fullText: string } {
    // 실제로는 자연어 처리하지만 현재는 기본값 반환
    // 향후 더 정교한 자연어 파싱 또는 AI 기반 키워드 추출 적용 가능

    // 감정 키워드 추출 시도
    let emotionalKeywords = '';
    const moodPatterns = [
      /(?:분위기|느낌|감정).*?([가-힣]+(?:적인|한|로운))/g,
      /(?:색상|컬러).*?([가-힣]+(?:적인|한|로운))/g
    ];

    const foundMoods: string[] = [];
    moodPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        foundMoods.push(match[1]);
      }
    });

    if (foundMoods.length >= 4) {
      emotionalKeywords = foundMoods.slice(0, 4).join(',');
    }

    return {
      emotionalKeywords,
      fullText: content.trim()
    };
  }

  // 기존의 복잡한 파싱 메서드들 제거됨 - 창의적 브리프 시스템에서는 불필요

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

  private getLayoutStyleGuide(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'fixed') {
      return `📐 **고정형 레이아웃 (1600×1000px) 제약사항:**
- 한 화면에 모든 콘텐츠가 들어가야 하므로 효율적이고 간결한 스타일 필요
- 공간 활용도를 최대화하는 미니멀한 디자인 컨셉
- 작은 radius(8-16px), 얇은 border, 컴팩트한 spacing 권장
- 색상은 명확한 구분과 가독성을 우선시
- 컴포넌트별 여백을 최소화하여 공간 효율성 극대화

**COMPONENT_STYLE 작성 가이드:**
- "간결하고 효율적인", "공간 최적화", "미니멀", "컴팩트" 등의 키워드 활용
- 예시: "얇은 테두리와 작은 반경으로 공간을 효율적으로 활용하는 미니멀한 스타일"`;
    } else {
      return `📜 **스크롤형 레이아웃 (1600×무제한) 활용 가능:**
- 세로 스크롤이 가능하므로 풍부하고 시각적으로 매력적인 스타일 허용
- 넉넉한 여백과 다양한 시각적 요소를 활용한 풍부한 디자인
- 큰 radius(16-32px), 그림자 효과, 넉넉한 spacing 활용 권장
- 색상은 계층적 구조와 시각적 흐름을 고려한 조화로운 팔레트
- 교육적 효과를 높이는 다양한 시각적 장치 활용

**COMPONENT_STYLE 작성 가이드:**
- "풍부하고 매력적인", "시각적 계층", "교육적 몰입감", "다양한 요소" 등의 키워드 활용
- 예시: "넉넉한 여백과 부드러운 그림자로 교육적 몰입감을 높이는 현대적 스타일"`;
    }
  }
}