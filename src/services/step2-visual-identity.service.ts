import { OpenAIService } from './openai.service';
import { ProjectData, Step2RawResponse, VisualIdentity, DesignTokens } from '../types/workflow.types';

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
          model: 'gpt-5-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          top_p: 1,
          max_tokens: 1200,
          stop: ["END_S2"]
        });
        console.log('✅ OpenAI API 응답 수신:', response);
        console.log('🧪 Step2 raw.output snapshot:', response?.raw?.output);
        try {
          const rawPreview = JSON.stringify(response?.raw, null, 2);
          console.log('🧪 Step2 raw preview (first 2k chars):', rawPreview?.substring(0, 2000));
        } catch (error) {
          console.warn('⚠️ Step2 raw preview stringify 실패:', error);
        }

        const messageContent = this.extractCompletionContent(response);

        if (!messageContent) {
          console.error('❌ 응답 구조 오류:', response);
          throw new Error('Step2: 응답이 비어있습니다');
        }

        const rawContent = messageContent;
        const fullLogPayload = rawContent && rawContent.length > 0
          ? rawContent
          : this.stringifyRawResponse(response);

        console.log('🧾 Step2 AI 전체 응답:', fullLogPayload);
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

  private extractCompletionContent(response: any): string {
    const rawOutputText = response?.raw?.output_text;
    if (typeof rawOutputText === 'string') {
      const trimmed = rawOutputText.trim();
      if (trimmed.length > 0 && !this.looksLikeMetadata(trimmed)) {
        return trimmed;
      }
    }

    const direct = response?.choices?.[0]?.message?.content;
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return direct.trim();
    }

    if (Array.isArray(direct)) {
      const segmentText = direct
        .map((segment: any) => {
          if (typeof segment === 'string') {
            return segment;
          }
          if (typeof segment?.text === 'string') {
            return segment.text;
          }
          if (typeof segment?.text?.value === 'string') {
            return segment.text.value;
          }
          return '';
        })
        .filter((segment: string) => segment.trim().length > 0)
        .join('\n')
        .trim();

      if (segmentText.length > 0) {
        return segmentText;
      }
    }

    const raw = response?.raw;
    if (!raw) {
      return '';
    }

    if (typeof raw.output_text === 'string') {
      const trimmed = raw.output_text.trim();
      if (trimmed.length > 0 && !this.looksLikeMetadata(trimmed)) {
        return trimmed;
      }
    }

    const output = raw.output;
    if (Array.isArray(output)) {
      const parts = output
        .flatMap((item: any) => item?.content || [])
        .map((part: any) => {
          const partText = this.normalizePartText(part);
          if (partText) {
            return partText;
          }
          if (part?.type === 'output_json' && part?.json) {
            try {
              return JSON.stringify(part.json);
            } catch (error) {
              console.warn('⚠️ Step2 JSON stringify 실패:', error);
              return '';
            }
          }
          return '';
        })
        .filter((segment: string) => typeof segment === 'string' && segment.trim().length > 0);

      if (parts.length > 0) {
        return parts.join('\n').trim();
      }
    }

    const deepText = this.extractDeepText(raw);
    if (deepText) {
      return deepText;
    }

    return '';
  }

  private normalizePartText(part: any): string {
    if (typeof part?.text === 'string') {
      return part.text;
    }

    if (typeof part?.text?.value === 'string') {
      return part.text.value;
    }

    if (typeof part?.value === 'string') {
      return part.value;
    }

    if (typeof part?.data === 'string') {
      return part.data;
    }

    return '';
  }

  private stringifyRawResponse(response: any): string {
    try {
      if (response?.raw) {
        return JSON.stringify(response.raw, null, 2);
      }
      return JSON.stringify(response, null, 2);
    } catch (error) {
      console.warn('⚠️ Step2 응답 직렬화 실패:', error);
      return String(response);
    }
  }

  private extractDeepText(payload: any): string {
    const collected: string[] = [];

    const visit = (node: any) => {
      if (typeof node === 'string') {
        const trimmed = node.trim();
        if (trimmed.length > 0) {
          collected.push(trimmed);
        }
        return;
      }

      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }

      if (node && typeof node === 'object') {
        Object.values(node).forEach(visit);
      }
    };

    visit(payload);

    const markers = ['MOOD', 'COLOR_', 'TYPOGRAPHY', 'COMPONENT_STYLE'];
    const prioritized = collected.find((entry) => !this.looksLikeMetadata(entry) && markers.some((marker) => entry.includes(marker)));
    if (prioritized) {
      return prioritized;
    }

    const filtered = collected.filter((entry) => !this.looksLikeMetadata(entry));
    if (filtered.length > 0) {
      return filtered.join('\n');
    }

    return '';
  }

  private looksLikeMetadata(value: string): boolean {
    const metaPatterns = [/^resp_[a-z0-9]/i, /^rs_[a-z0-9]/i, /^(response|completed|developer|default|auto|disabled)$/i, /^gpt-\d/i];
    return metaPatterns.some((pattern) => pattern.test(value.trim()));
  }

  private createStep2Prompt(projectData: ProjectData): string {
    const constraintGuide = this.getSpaceConstraintGuide(projectData.layoutMode);
    const audienceContext = this.getAudienceContext(projectData.targetAudience);

    return `🎨 교육용 비주얼 아이덴티티 생성

당신은 교육 콘텐츠의 비주얼 아이덴티티를 디자인하는 전문가입니다.
다음 프로젝트에 맞는 무드, 색상, 타이포그래피, 컴포넌트 스타일을 정확한 형식으로 제안해주세요.

## 📚 프로젝트 정보
**주제**: ${projectData.projectTitle}
**학습자**: ${projectData.targetAudience}
${audienceContext}

## 📐 레이아웃 제약사항
${constraintGuide}

## 🎯 요청사항
반드시 아래 정확한 형식으로만 응답해주세요:

**MOOD_ADJECTIVES:**
정확히 4개의 형용사를 쉼표로 구분하여 작성하세요. (예: 따뜻한, 신뢰할만한, 창의적인, 안정적인)

**COLOR_PALETTE:**
PRIMARY: #HEX코드 | 주요 색상 설명
SECONDARY: #HEX코드 | 보조 색상 설명
ACCENT: #HEX코드 | 강조 색상 설명
BACKGROUND: #HEX코드 | 배경 색상 설명
TEXT: #HEX코드 | 텍스트 색상 설명

**TYPOGRAPHY:**
HEADING_FONT: 한글폰트명 | 선택 이유
BODY_FONT: 한글폰트명 | 선택 이유
BASE_SIZE: 숫자pt

**COMPONENT_STYLE_GUIDE:**
이 교육 프로젝트의 UI 컴포넌트 스타일을 마크다운 형식으로 작성하세요.
다음 항목들을 포함하여 구체적으로 설명하세요:
- **모서리 처리**: 둥글기 정도와 적용 방식
- **그림자 효과**: 사용 여부와 강도
- **색상 활용**: 배경, 테두리, 텍스트 색상 사용법
- **여백과 간격**: 내부 패딩과 외부 마진 특성
- **인터랙션**: 호버, 클릭 등 상호작용 스타일
- **계층 구조**: 카드, 버튼, 입력필드 등의 시각적 위계

최소 6-8문장으로 교육적 효과를 고려한 상세한 가이드를 작성하세요.

**중요 사항:**
1. MOOD_ADJECTIVES는 정확히 4개의 한국어 형용사
2. COLOR_PALETTE는 5개 색상 모두 #HEX 코드 포함 필수
3. TYPOGRAPHY는 실제 존재하는 한글 폰트명 (예: Pretendard, Noto Sans KR, 나눔고딕, 맑은고딕 등)
4. COMPONENT_STYLE_GUIDE는 마크다운 문법 사용하여 구조화된 가이드 작성
5. 각 섹션 라벨을 정확히 유지할 것`;
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
    console.log('🔍 Step2 구조화된 파싱 시작');
    console.log('📄 전체 응답 내용:', content.substring(0, 500) + '...');

    // 구조화된 섹션별 파싱
    const moodData = this.parseStructuredMood(content);
    const colorData = this.parseStructuredColors(content);
    const typographyData = this.parseStructuredTypography(content);
    const componentStyleData = this.parseStructuredComponentStyle(content);

    const result: Step2RawResponse = {
      version: 'structured.v2',
      mood: moodData.adjectives,
      colorPrimary: colorData.primary,
      colorSecondary: colorData.secondary,
      colorAccent: colorData.accent,
      colorBackground: colorData.background,
      colorText: colorData.text,
      baseSizePt: typographyData.baseSize,
      headingFont: typographyData.headingFont,
      bodyFont: typographyData.bodyFont,
      headingReason: typographyData.headingReason,
      bodyReason: typographyData.bodyReason,
      componentStyle: componentStyleData || '깔끔하고 교육적인 디자인'
    };

    console.log('✅ 구조화된 파싱 완료:', {
      mood: result.mood,
      colors: {
        primary: result.colorPrimary,
        secondary: result.colorSecondary,
        accent: result.colorAccent,
        background: result.colorBackground,
        text: result.colorText
      },
      fonts: {
        heading: result.headingFont,
        body: result.bodyFont,
        baseSize: result.baseSizePt
      }
    });

    return result;
  }

  private parseStructuredMood(content: string): { adjectives: string } {
    console.log('🎭 구조화된 무드 파싱 시작');
    console.log('🔍 파싱할 내용:', content.substring(0, 1000));

    // 여러 패턴으로 MOOD_ADJECTIVES 매칭 시도
    const patterns = [
      /MOOD_ADJECTIVES:\s*([^\n*]+)/i,
      /MOOD_ADJECTIVES\s*:\s*([^\n*]+)/i,
      /무드.*?형용사.*?:\s*([^\n*]+)/i,
      /형용사.*?:\s*([^\n*]+)/i
    ];

    for (const pattern of patterns) {
      const moodMatch = content.match(pattern);
      if (moodMatch) {
        const rawMoods = moodMatch[1].trim();
        console.log('🎯 원시 무드 텍스트:', rawMoods);

        // 쉼표나 다양한 구분자로 분리
        const adjectives = rawMoods.split(/[,\s]+/)
          .map(mood => mood.trim())
          .filter(mood => mood.length > 0 && mood.length < 10) // 너무 긴 텍스트 제외
          .slice(0, 4); // 정확히 4개만

        if (adjectives.length >= 2) { // 최소 2개 이상일 때만 성공으로 간주
          const result = adjectives.join(',');
          console.log('✅ 구조화된 무드 파싱 성공:', adjectives);
          return { adjectives: result };
        }
      }
    }

    // 폴백: 한국어 형용사 패턴으로 추출 시도
    const koreanAdjectivePattern = /([가-힣]{2,4}[한적은로운])/g;
    const found = [];
    let match;
    while ((match = koreanAdjectivePattern.exec(content)) !== null && found.length < 4) {
      const adj = match[1];
      if (!found.includes(adj)) {
        found.push(adj);
      }
    }

    if (found.length >= 2) {
      console.log('✅ 패턴 매칭으로 무드 추출 성공:', found);
      return { adjectives: found.join(',') };
    }

    console.log('⚠️ 구조화된 무드 파싱 완전 실패, 기본값 사용');
    return { adjectives: '친근한,창의적인,교육적인,안정적인' };
  }

  private parseStructuredColors(content: string): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  } {
    console.log('🎨 구조화된 색상 파싱 시작');

    const colors = {
      primary: '#2563EB',
      secondary: '#F1F5F9',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#0F172A'
    };

    // 각 색상 타입별로 파싱
    const colorTypes = ['PRIMARY', 'SECONDARY', 'ACCENT', 'BACKGROUND', 'TEXT'];

    colorTypes.forEach(type => {
      const pattern = new RegExp(`${type}:\\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})`, 'i');
      const match = content.match(pattern);

      if (match) {
        const hexCode = match[1];
        const key = type.toLowerCase() as keyof typeof colors;
        colors[key] = hexCode;
        console.log(`🎯 ${type} 색상 발견:`, hexCode);
      }
    });

    console.log('✅ 구조화된 색상 파싱 완료:', colors);
    return colors;
  }

  private parseStructuredTypography(content: string): {
    headingFont: string;
    bodyFont: string;
    headingReason: string;
    bodyReason: string;
    baseSize: number;
  } {
    console.log('✍️ 구조화된 타이포그래피 파싱 시작');

    const typography = {
      headingFont: 'Pretendard',
      bodyFont: 'Noto Sans KR',
      headingReason: '견고하면서도 친근한',
      bodyReason: '읽기 편안하고 깔끔한',
      baseSize: 20
    };

    // 헤딩 폰트 파싱
    const headingMatch = content.match(/HEADING_FONT:\s*([^|]+)\s*\|\s*(.+)/i);
    if (headingMatch) {
      typography.headingFont = headingMatch[1].trim();
      typography.headingReason = headingMatch[2].trim();
      console.log('🎯 헤딩 폰트 발견:', typography.headingFont, '|', typography.headingReason);
    }

    // 본문 폰트 파싱
    const bodyMatch = content.match(/BODY_FONT:\s*([^|]+)\s*\|\s*(.+)/i);
    if (bodyMatch) {
      typography.bodyFont = bodyMatch[1].trim();
      typography.bodyReason = bodyMatch[2].trim();
      console.log('📝 본문 폰트 발견:', typography.bodyFont, '|', typography.bodyReason);
    }

    // 기본 크기 파싱
    const sizeMatch = content.match(/BASE_SIZE:\s*(\d+)pt/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size >= 14 && size <= 28) {
        typography.baseSize = size;
        console.log('📏 기본 크기 발견:', size + 'pt');
      }
    }

    console.log('✅ 구조화된 타이포그래피 파싱 완료:', typography);
    return typography;
  }

  private parseStructuredComponentStyle(content: string): string {
    console.log('🎪 구조화된 컴포넌트 스타일 파싱 시작');
    console.log('📄 파싱할 전체 내용 미리보기:', content.substring(0, 2000));

    // 다양한 패턴으로 COMPONENT_STYLE_GUIDE 섹션 추출
    const patterns = [
      // 기본 패턴 - 줄바꿈까지의 내용이 아닌 전체 섹션 추출
      /COMPONENT_STYLE_GUIDE:\s*([\s\S]*?)(?=\n\n\*\*|$)/i,
      /COMPONENT_STYLE_GUIDE\s*:\s*([\s\S]*?)(?=\n\n\*\*|$)/i,

      // 한국어 패턴
      /컴포넌트\s*스타일\s*가이드\s*:?\s*([\s\S]*?)(?=\n\n\*\*|$)/i,

      // 이모지 포함 패턴
      /🎪\s*컴포넌트\s*스타일\s*가이드\s*:?\s*([\s\S]*?)(?=\n\n\*\*|$)/i,

      // 더 넓은 패턴 - 마지막까지 모든 내용 포함
      /COMPONENT_STYLE_GUIDE:\s*([\s\S]*)/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = content.match(pattern);

      if (match) {
        console.log(`🎯 패턴 ${i+1}로 매칭 성공:`, match[0].substring(0, 200));

        let styleGuide = match[1].trim();

        // 프롬프트 지시사항만 최소한으로 제거
        const instructionsToRemove = [
          /이 교육 프로젝트의 UI 컴포넌트 스타일을 마크다운 형식으로 작성하세요\.\s*/gi,
          /다음 항목들을 포함하여 구체적으로 설명하세요:\s*/gi,
          /최소 6-8문장으로 교육적 효과를 고려한 상세한 가이드를 작성하세요\.\s*/gi
        ];

        instructionsToRemove.forEach(pattern => {
          styleGuide = styleGuide.replace(pattern, '');
        });

        // 빈 줄 정리
        styleGuide = styleGuide.replace(/\n\s*\n\s*\n+/g, '\n\n');
        styleGuide = styleGuide.trim();

        console.log('🎨 정제된 스타일 가이드:', styleGuide.substring(0, 300));

        if (styleGuide.length > 20) { // 최소 길이 체크 완화
          console.log('✅ 구조화된 컴포넌트 스타일 파싱 성공! 길이:', styleGuide.length);
          return styleGuide;
        } else {
          console.log('⚠️ 스타일 가이드가 너무 짧음:', styleGuide.length, 'chars');
        }
      }
    }

    // 폴백: 기존 extractComponentStyle 사용
    console.log('⚠️ 구조화된 컴포넌트 스타일 파싱 완전 실패, 기존 방식으로 폴백');
    const fallback = this.extractComponentStyle(content);
    console.log('🔄 폴백 결과:', fallback.substring(0, 200));
    return fallback;
  }

  private extractCreativeMood(content: string): { emotionalKeywords: string; fullText: string } {
    // 감정 키워드 추출 패턴들
    const moodPatterns = [
      // 직접적인 감정 표현
      /([가-힣]+한|[가-힣]+적인|[가-힣]+로운)/g,
      // 분위기 관련 키워드
      /(?:분위기|느낌|감정).*?([가-힣]+)/g,
      // 형용사 패턴
      /([가-힣]{2,}(?:한|적인|로운|다운))/g
    ];

    const foundMoods: string[] = [];
    const seenMoods = new Set<string>();

    moodPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const mood = match[1];
        if (mood.length >= 2 && !seenMoods.has(mood)) {
          // 일반적인 감정/분위기 키워드 필터링
          if (this.isValidMoodKeyword(mood)) {
            foundMoods.push(mood);
            seenMoods.add(mood);
          }
        }
      }
    });

    // 최대 4개까지, 없으면 기본값 사용
    let emotionalKeywords = '';
    if (foundMoods.length > 0) {
      emotionalKeywords = foundMoods.slice(0, 4).join(',');
    }

    console.log('🎭 추출된 감정 키워드:', foundMoods.slice(0, 4));

    return {
      emotionalKeywords,
      fullText: content.trim()
    };
  }

  private isValidMoodKeyword(word: string): boolean {
    // 감정/분위기와 관련된 키워드인지 확인
    const validMoodWords = [
      '친근한', '따뜻한', '차분한', '활발한', '신뢰할만한', '창의적인',
      '교육적인', '희망적인', '안정적인', '역동적인', '현대적인', '깔끔한',
      '부드러운', '밝은', '편안한', '집중할수있는', '흥미로운', '즐거운',
      '신선한', '세련된', '우아한', '자연스러운', '포근한', '생동감있는'
    ];

    return validMoodWords.some(validWord =>
      word.includes(validWord.replace('한', '').replace('적인', '').replace('로운', '')) ||
      validWord.includes(word.replace('한', '').replace('적인', '').replace('로운', ''))
    );
  }

  private extractColors(content: string): { primary?: string; secondary?: string; accent?: string } {
    console.log('🎨 색상 추출 시작');

    // 색상 관련 키워드를 HEX 코드로 매핑
    const colorMap: { [key: string]: string } = {
      // 블루 계열
      '파란': '#2563EB',
      '파랑': '#2563EB',
      '블루': '#2563EB',
      '푸른': '#2563EB',
      '청색': '#2563EB',
      '딥블루': '#1E3A8A',
      '진한파랑': '#1E3A8A',
      '네이비': '#1E3A8A',
      '하늘색': '#60A5FA',
      '연한파랑': '#60A5FA',
      '라이트블루': '#60A5FA',

      // 그린 계열
      '초록': '#16A34A',
      '녹색': '#16A34A',
      '그린': '#16A34A',
      '풀색': '#16A34A',
      '연두': '#84CC16',
      '라이트그린': '#84CC16',
      '진한초록': '#15803D',
      '딥그린': '#15803D',

      // 오렌지/옐로우 계열
      '노란': '#EAB308',
      '노랑': '#EAB308',
      '옐로우': '#EAB308',
      '황색': '#EAB308',
      '주황': '#EA580C',
      '오렌지': '#EA580C',
      '연한노랑': '#FDE047',

      // 레드/핑크 계열
      '빨간': '#DC2626',
      '빨강': '#DC2626',
      '레드': '#DC2626',
      '적색': '#DC2626',
      '분홍': '#EC4899',
      '핑크': '#EC4899',
      '연한분홍': '#F9A8D4',

      // 퍼플 계열
      '보라': '#7C3AED',
      '퍼플': '#7C3AED',
      '자주': '#7C3AED',
      '연한보라': '#A78BFA',

      // 그레이 계열
      '회색': '#6B7280',
      '그레이': '#6B7280',
      '은색': '#6B7280',
      '진한회색': '#374151',
      '연한회색': '#D1D5DB'
    };

    const colors: { primary?: string; secondary?: string; accent?: string } = {};

    // 주요 색상 추출
    const primaryMatch = content.match(/주요?\s*색상[:\s]*([가-힣\s]+)/i);
    if (primaryMatch) {
      const colorName = primaryMatch[1].trim();
      for (const [key, hex] of Object.entries(colorMap)) {
        if (colorName.includes(key)) {
          colors.primary = hex;
          console.log('🎯 주요 색상 발견:', colorName, '→', hex);
          break;
        }
      }
    }

    // 보조 색상 추출
    const secondaryMatch = content.match(/보조\s*색상[:\s]*([가-힣\s]+)/i);
    if (secondaryMatch) {
      const colorName = secondaryMatch[1].trim();
      for (const [key, hex] of Object.entries(colorMap)) {
        if (colorName.includes(key)) {
          colors.secondary = hex;
          console.log('🎨 보조 색상 발견:', colorName, '→', hex);
          break;
        }
      }
    }

    // 강조 색상 추출
    const accentMatch = content.match(/강조\s*색상[:\s]*([가-힣\s]+)/i);
    if (accentMatch) {
      const colorName = accentMatch[1].trim();
      for (const [key, hex] of Object.entries(colorMap)) {
        if (colorName.includes(key)) {
          colors.accent = hex;
          console.log('✨ 강조 색상 발견:', colorName, '→', hex);
          break;
        }
      }
    }

    // 일반적인 색상 키워드도 체크
    if (!colors.primary || !colors.secondary || !colors.accent) {
      for (const [key, hex] of Object.entries(colorMap)) {
        if (content.includes(key)) {
          if (!colors.primary) colors.primary = hex;
          else if (!colors.secondary) colors.secondary = this.lightenColor(hex);
          else if (!colors.accent) colors.accent = this.complementaryColor(hex);
        }
      }
    }

    console.log('🎨 최종 추출된 색상:', colors);
    return colors;
  }

  private lightenColor(hex: string): string {
    // 색상을 밝게 만드는 간단한 로직
    const colorVariants: { [key: string]: string } = {
      '#2563EB': '#DBEAFE', // 블루 → 라이트 블루
      '#16A34A': '#DCFCE7', // 그린 → 라이트 그린
      '#EAB308': '#FEF3C7', // 옐로우 → 라이트 옐로우
      '#DC2626': '#FEE2E2', // 레드 → 라이트 레드
      '#7C3AED': '#EDE9FE', // 퍼플 → 라이트 퍼플
    };

    return colorVariants[hex] || '#F8FAFC';
  }

  private complementaryColor(hex: string): string {
    // 보색 또는 대비되는 색상 반환
    const complementary: { [key: string]: string } = {
      '#2563EB': '#F59E0B', // 블루 → 오렌지
      '#16A34A': '#EC4899', // 그린 → 핑크
      '#EAB308': '#7C3AED', // 옐로우 → 퍼플
      '#DC2626': '#059669', // 레드 → 그린
      '#7C3AED': '#EAB308', // 퍼플 → 옐로우
    };

    return complementary[hex] || '#F59E0B';
  }

  private extractTypography(content: string): { baseSize: number; headingStyle: string; bodyStyle: string } {
    console.log('✍️ 타이포그래피 추출 시작');

    // 기본 크기 추출
    const sizeMatch = content.match(/기본\s*크기[:\s]*(\d+)pt/i);
    let baseSize = 20; // 기본값

    if (sizeMatch) {
      const extractedSize = parseInt(sizeMatch[1]);
      if (extractedSize >= 14 && extractedSize <= 24) {
        baseSize = extractedSize;
        console.log('📏 기본 크기 발견:', extractedSize + 'pt');
      }
    } else {
      // 크기 키워드로 추정
      if (content.includes('큰') || content.includes('대형')) {
        baseSize = 22;
      } else if (content.includes('작은') || content.includes('소형')) {
        baseSize = 16;
      } else if (content.includes('보통') || content.includes('중간')) {
        baseSize = 18;
      }
    }

    // 헤딩 폰트 특성 추출
    const headingMatch = content.match(/헤딩\s*폰트[:\s]*([^(]*?)(?:\(|$)/i);
    let headingStyle = '견고하면서도 친근한';
    if (headingMatch) {
      headingStyle = headingMatch[1].trim().replace(/"/g, '');
      console.log('🎯 헤딩 스타일 발견:', headingStyle);
    }

    // 본문 폰트 특성 추출
    const bodyMatch = content.match(/본문\s*폰트[:\s]*([^(]*?)(?:\(|$)/i);
    let bodyStyle = '읽기 편안하고 깔끔한';
    if (bodyMatch) {
      bodyStyle = bodyMatch[1].trim().replace(/"/g, '');
      console.log('📝 본문 스타일 발견:', bodyStyle);
    }

    console.log('✍️ 최종 타이포그래피:', { baseSize, headingStyle, bodyStyle });
    return { baseSize, headingStyle, bodyStyle };
  }

  private extractComponentStyle(content: string): string {
    console.log('🎪 기존 방식으로 컴포넌트 스타일 추출 시작');

    // 다양한 패턴으로 컴포넌트 스타일 섹션 찾기
    const patterns = [
      /🎪\s*컴포넌트\s*스타일\s*가이드[:\s]*([\s\S]*?)(?=\*\*[^*]|$)/i,
      /컴포넌트\s*스타일\s*가이드[:\s]*([\s\S]*?)(?=\*\*[^*]|$)/i,
      /디자인\s*방향성[:\s]*([\s\S]*?)(?=\*\*[^*]|$)/i,
      /UI\s*컴포넌트.*?스타일[:\s]*([\s\S]*?)(?=\*\*[^*]|$)/i,
      /스타일\s*가이드[:\s]*([\s\S]*?)(?=\*\*[^*]|$)/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = content.match(patterns[i]);
      if (match) {
        let styleText = match[1].trim();

        // 지시사항 제거
        styleText = styleText.replace(/이 교육 프로젝트의.*?하세요[:\.]?\s*/gi, '');
        styleText = styleText.replace(/다음 항목들을.*?하세요[:\.]?\s*/gi, '');
        styleText = styleText.replace(/최소.*?문장으로.*?하세요[:\.]?\s*/gi, '');

        if (styleText.length > 10) {
          console.log(`🎨 패턴 ${i+1}로 컴포넌트 스타일 발견:`, styleText.substring(0, 100) + '...');
          return styleText;
        }
      }
    }

    console.log('⚠️ 기존 방식으로도 컴포넌트 스타일 추출 실패, 기본 가이드 사용');
    return `## 기본 컴포넌트 스타일 가이드

**모서리 처리**: 중간 정도의 둥근 모서리(border-radius: 12px)로 친근함과 현대적 감각을 동시에 표현합니다.

**그림자 효과**: 부드러운 그림자를 적용하여 요소들 간의 계층감을 명확히 하고 시각적 깊이감을 제공합니다.

**색상 활용**: 주요 색상을 배경과 강조 요소에 적절히 배치하고, 텍스트 가독성을 최우선으로 고려합니다.

**여백과 간격**: 충분한 내부 패딩으로 콘텐츠의 호흡감을 확보하고, 일관된 외부 마진으로 정돈된 레이아웃을 구성합니다.`;
  }

  // 기존의 복잡한 파싱 메서드들 제거됨 - 창의적 브리프 시스템에서는 불필요

  private assembleStep2(rawKV: Step2RawResponse, layoutMode: 'fixed' | 'scrollable'): { visualIdentity: VisualIdentity; designTokens: DesignTokens } {
    const visualIdentity: VisualIdentity = {
      moodAndTone: rawKV.mood.split(',').map(mood => mood.trim()),
      colorPalette: {
        primary: rawKV.colorPrimary,
        secondary: rawKV.colorSecondary,
        accent: rawKV.colorAccent,
        // 파싱된 background/text 색상 사용, 없으면 기본값으로 폴백
        text: rawKV.colorText || '#0F172A',
        background: rawKV.colorBackground || '#FFFFFF'
      },
      typography: {
        // 파싱된 폰트 사용, 없으면 브랜드 락으로 폴백
        headingFont: rawKV.headingFont || BRAND_LOCKS.headingFont,
        bodyFont: rawKV.bodyFont || BRAND_LOCKS.bodyFont,
        baseSize: `${rawKV.baseSizePt}pt`,
        // 선택 이유 저장 (새로운 필드)
        headingStyle: rawKV.headingReason || rawKV.headingStyle || '견고하면서도 친근한',
        bodyStyle: rawKV.bodyReason || rawKV.bodyStyle || '읽기 편안하고 깔끔한'
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
