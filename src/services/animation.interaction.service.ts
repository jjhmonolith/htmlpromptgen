import { 
  ProjectData, 
  VisualIdentity, 
  LayoutProposal, 
  PageEnhancement,
  ElementInteraction,
  PageTransitions,
  GlobalAnimations
} from '../types/workflow.types';
import { loadApiKey } from './storage.service';
import OpenAI from 'openai';

export class AnimationInteractionService {
  private openaiService: OpenAI | null = null;

  constructor() {
    // OpenAI 클라이언트 초기화는 generatePageEnhancements에서 수행
  }

  /**
   * 페이지별 애니메이션과 상호작용 요소를 생성합니다
   */
  async generatePageEnhancements(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[]
  ): Promise<PageEnhancement[]> {
    // API 키 확인 및 OpenAI 클라이언트 초기화
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 설정해주세요.');
    }

    // OpenAI 클라이언트 초기화
    this.openaiService = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    const enhancements: PageEnhancement[] = [];

    for (const layoutProposal of layoutProposals) {
      const prompt = this.buildAnimationPrompt(projectData, visualIdentity, layoutProposal);
      
      try {
        console.log(`Step4: ${layoutProposal.pageTitle} 애니메이션 생성 시작`);
        
        const response = await this.openaiService.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: '당신은 웹 애니메이션 및 인터랙션 디자인 전문가입니다. 교육 콘텐츠에 최적화된 애니메이션과 상호작용을 설계하고 JSON 형식으로 응답합니다.'
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

        console.log(`Step4: ${layoutProposal.pageTitle} AI 응답 받음:`, content.substring(0, 200) + '...');
        
        const enhancement = this.parseAnimationResponse(content, layoutProposal.pageId);
        enhancements.push(enhancement);
        
        console.log(`Step4: ${layoutProposal.pageTitle} 파싱 완료`);
        
      } catch (error) {
        console.error(`페이지 ${layoutProposal.pageTitle} 애니메이션 생성 실패:`, error);
        // 기본 애니메이션으로 폴백
        enhancements.push(this.createFallbackEnhancement(layoutProposal.pageId, projectData, visualIdentity));
      }
    }

    return enhancements;
  }

  /**
   * Step 4 애니메이션 프롬프트 생성
   */
  private buildAnimationPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposal: LayoutProposal
  ): string {
    // Step3 요소들 추출
    const step3Elements = layoutProposal.detailedElements || [];
    
    // 레이아웃 정보 추출
    const layoutInfo = projectData.layoutMode === 'scrollable' && layoutProposal.layoutDescription
      ? layoutProposal.layoutDescription
      : layoutProposal.layout
        ? `구조: ${layoutProposal.layout.structure}\n메인 콘텐츠: ${layoutProposal.layout.mainContent}\n시각적 요소: ${layoutProposal.layout.visualElements}`
        : '레이아웃 정보 없음';

    // Step3 요소 정보를 포함한 컨텍스트
    const elementsContext = step3Elements.length > 0 
      ? `\nStep3에서 정의된 요소들:\n${step3Elements.map(el => 
          `- ${el.elementName} (${el.elementType}): ${el.content.substring(0, 100)}... 
            위치: ${el.position.width}×${el.position.height} at (${el.position.left}, ${el.position.top})
            목적: ${el.purpose}`
        ).join('\n')}`
      : '\n(Step3 요소 정보 없음)';

    return `당신은 최첨단 웹 애니메이션 및 인터랙션 디자인 전문가입니다.
다음 교육 페이지에 창의적이고 시선을 끄는 고급 애니메이션과 상호작용을 설계해주세요:

🎬 **창의적 애니메이션 기법 활용 필수**:
- **텍스트 타이핑 애니메이션**: 타이프라이터 효과, 글자별 순차 등장, 커서 깜빡임
- **3D 변환 효과**: perspective, rotateX/Y/Z, translateZ, 입체 카드 뒤집기
- **파티클 시스템**: 배경 파티클, 터치 파티클, 폭발 효과, 반짝임 효과
- **모폴링 애니메이션**: 도형 변환, 경로 애니메이션, SVG 모핑
- **글래스모피즘**: 블러 백드롭, 반투명 레이어, 유리 효과
- **네오모피즘**: 소프트 그림자, 엠보스 효과, 인셋 섀도우
- **그라디언트 애니메이션**: 색상 이동, 각도 회전, 크기 변화
- **패럴랙스 효과**: 다층 스크롤, 원근감, 깊이 표현

페이지 컨텍스트:
- 페이지 주제: ${layoutProposal.pageTitle}
- 대상 학습자: ${projectData.targetAudience}
- 분위기: ${visualIdentity.moodAndTone}
- 레이아웃 모드: ${projectData.layoutMode === 'scrollable' ? '스크롤 가능' : '고정 크기'}
- 색상: Primary ${visualIdentity.colorPalette.primary}, Secondary ${visualIdentity.colorPalette.secondary}, Accent ${visualIdentity.colorPalette.accent}

레이아웃 정보:
${layoutInfo}${elementsContext}

필요한 이미지:
${layoutProposal.images.map(img => `- ${img.filename}: ${img.description}`).join('\n')}

다음 형식으로 정확히 JSON 응답해주세요:

{
  "pageTitle": "${layoutProposal.pageTitle}",
  "elementInteractions": [
    {
      "elementId": "Step3 요소의 elementName과 정확히 일치",
      "elementType": "Step3 요소의 elementType",
      "staticState": {
        "description": "정적 상태 설명",
        "initialStyling": {
          "property": "value"
        }
      },
      "loadAnimation": {
        "type": "typewriter|morphIn|particle|rotate3D|glassSlide|neoEmerge|gradientWave|parallaxFloat 중 하나 선택",
        "duration": "600ms~2000ms (복잡한 애니메이션일수록 길게)",
        "delay": "0ms~800ms (순차적 등장을 위해)",
        "timing": "cubic-bezier(0.4, 0, 0.2, 1) 또는 커스텀 이징",
        "keyframes": "구체적인 keyframe 단계별 설명",
        "advancedEffects": {
          "particle": "파티클 효과가 있는 경우 상세 설정",
          "3d": "3D 변환이 있는 경우 perspective 설정",
          "filter": "blur, brightness 등 필터 효과",
          "transform": "복합 변환 효과"
        },
        "educationalPurpose": "시선 집중, 순차적 학습, 기억 강화 등"
      },
      "interactionStates": {
        "hover": {
          "description": "호버 상태 설명",
          "styling": {
            "property": "value"
          },
          "additionalEffects": "추가 효과"
        },
        "focus": {
          "description": "포커스 상태 설명", 
          "styling": {
            "property": "value"
          },
          "additionalEffects": "추가 효과"
        }
      },
      "feedbackAnimations": {
        "success": {
          "trigger": "성공 상황",
          "animation": "애니메이션 설명",
          "duration": "300ms"
        },
        "error": {
          "trigger": "오류 상황",
          "animation": "애니메이션 설명", 
          "duration": "300ms"
        }
      },
      "educationalEnhancements": {
        "learningSupport": "학습 지원 방식",
        "specialInteractions": [
          {
            "name": "특별 인터랙션 이름",
            "description": "설명",
            "trigger": "트리거 조건",
            "effect": "효과",
            "purpose": "교육적 목적"
          }
        ]
      },
      "technicalSpecs": {
        "cssClasses": ["class1", "class2"],
        "jsEvents": ["click", "scroll"],
        "accessibility": {
          "ariaLabels": "aria-label 값",
          "keyboardSupport": "키보드 지원 설명",
          "screenReader": "스크린리더 지원"
        }
      }
    }
  ],
  "pageTransitions": {
    "pageLoad": {
      "sequence": [
        {
          "elements": ["element1", "element2"],
          "delay": "0ms",
          "description": "로드 시퀀스 설명"
        }
      ]
    },
    "pageExit": {
      "description": "페이지 이탈 애니메이션",
      "animation": "애니메이션 설명"
    }
  },
  "globalAnimations": {
    "scrollBehavior": "부드러운 스크롤, 패럴랙스 효과, 인터섹션 애니메이션",
    "responsiveAnimations": "디바이스별 최적화된 애니메이션 시스템", 
    "performanceOptimizations": "transform/opacity 최적화, will-change 활용",
    "advancedEffects": {
      "particleSystem": "배경 파티클 시스템 설정 (Canvas/WebGL)",
      "morphingElements": "SVG 모핑, 패스 애니메이션",
      "glassEffects": "backdrop-filter, 반투명 레이어",
      "3dTransforms": "perspective 설정, 3D 카드 플립",
      "gradientAnimations": "그라디언트 이동, 색상 변화",
      "textEffects": "타이핑 효과, 글자별 애니메이션",
      "microInteractions": "버튼 리플 효과, 상태 피드백"
    },
    "libraryIntegration": {
      "gsap": "GSAP 라이브러리 활용한 고급 애니메이션",
      "lottie": "복잡한 벡터 애니메이션 (필요시)",
      "particles": "파티클 라이브러리 통합",
      "threejs": "3D 효과 구현 (고급 케이스)"
    }
  }
}

🎯 **핵심 애니메이션 규칙**:
1. **창의성 필수**: 평범한 fade/slide 금지, 반드시 위에 나열된 고급 기법 활용
2. **텍스트 애니메이션**: 제목/본문에 타이핑, 모핑, 글자별 등장 효과 반드시 적용
3. **3D 효과**: 카드, 버튼, 패널에 perspective, rotateX/Y/Z 활용한 입체감 구현
4. **파티클 시스템**: 배경이나 인터랙션에 파티클 효과로 시각적 임팩트 강화
5. **글래스모피즘**: 반투명 요소에 backdrop-filter 적용하여 현대적 느낌 구현
6. **그라디언트 애니메이션**: 정적 색상 금지, 동적 그라디언트로 생동감 표현
7. **마이크로 인터랙션**: 모든 클릭/호버에 리플, 변형, 상태 변화 효과
8. **순차적 등장**: 요소들의 지연 시간을 활용한 시각적 리듬감 조성

**기술적 요구사항**:
- elementInteractions의 각 elementId는 Step3 요소의 elementName과 정확히 일치
- ${step3Elements.length > 0 ? `Step3 요소들: ${step3Elements.map(el => el.elementName).join(', ')}` : '모든 요소에 대해 일반적인 인터랙션 생성'}
- 성능 최적화 (transform, opacity, will-change 활용)
- 접근성 보장 (prefers-reduced-motion 고려)
- ${visualIdentity.moodAndTone}에 맞는 애니메이션 스타일
- ${projectData.layoutMode === 'scrollable' ? '스크롤 트리거 애니메이션 중점적으로 설계' : '페이지 로드 애니메이션 중점적으로 설계'}
- 대상 학습자(${projectData.targetAudience})에 적합한 인터랙션 복잡도`;
  }

  /**
   * AI 응답을 PageEnhancement 객체로 파싱
   */
  private parseAnimationResponse(response: string, pageId: string): PageEnhancement {
    try {
      console.log(`Step4: 응답 파싱 시작 for pageId: ${pageId}`);
      console.log(`원본 응답 (첫 500자):`, response.substring(0, 500));
      
      // JSON 추출 - 간단한 파싱 로직
      let jsonStr = response;
      
      // 1. 코드 블록 제거
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // 2. JSON 객체 부분만 추출
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        console.log('Step4: JSON 객체 추출 성공');
      }
      
      // 3. JSON 파싱
      const data = JSON.parse(jsonStr);
      console.log('Step4: JSON 파싱 성공:', Object.keys(data));

      return {
        pageId,
        pageTitle: data.pageTitle || `페이지 ${pageId}`,
        elementInteractions: Array.isArray(data.elementInteractions) ? data.elementInteractions : this.getDefaultElementInteractions(),
        pageTransitions: data.pageTransitions || this.getDefaultPageTransitions(),
        globalAnimations: data.globalAnimations || this.getDefaultGlobalAnimations()
      };
    } catch (error) {
      console.error('Step4: 애니메이션 응답 파싱 실패:', error);
      console.log('Step4: 원본 응답 전체:', response);
      
      // 파싱 실패 시 기본값 반환
      console.log('Step4: 기본값으로 폴백');
      return {
        pageId,
        pageTitle: `페이지 ${pageId}`,
        elementInteractions: this.getDefaultElementInteractions(),
        pageTransitions: this.getDefaultPageTransitions(),
        globalAnimations: this.getDefaultGlobalAnimations()
      };
    }
  }

  /**
   * 폴백 애니메이션 생성
   */
  private createFallbackEnhancement(
    pageId: string,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): PageEnhancement {
    return {
      pageId,
      pageTitle: `페이지 ${pageId}`,
      elementInteractions: this.getDefaultElementInteractions(),
      pageTransitions: this.getDefaultPageTransitions(),
      globalAnimations: this.getDefaultGlobalAnimations()
    };
  }

  /**
   * 기본 요소 인터랙션 설정
   */
  private getDefaultElementInteractions(): ElementInteraction[] {
    return [
      {
        elementId: "Main Header",
        elementType: "header",
        staticState: {
          description: "페이지 상단의 제목 영역",
          initialStyling: {
            opacity: "0",
            transform: "translateY(-20px)"
          }
        },
        loadAnimation: {
          type: "fadeInUp",
          duration: "600ms",
          delay: "0ms",
          timing: "ease-out",
          keyframes: "opacity: 0 → 1, transform: translateY(-20px) → translateY(0)",
          educationalPurpose: "사용자의 주의를 페이지 주제로 자연스럽게 유도"
        },
        interactionStates: {
          hover: {
            description: "호버 시 미세한 강조 효과",
            styling: {
              color: "var(--accent-color)",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)"
            },
            additionalEffects: "부드러운 색상 전환"
          }
        },
        feedbackAnimations: {
          success: {
            trigger: "헤더 클릭 시",
            animation: "미세한 펄스 효과",
            duration: "300ms"
          }
        },
        educationalEnhancements: {
          learningSupport: "제목을 통해 학습 주제를 명확히 인식시킴",
          specialInteractions: []
        },
        technicalSpecs: {
          cssClasses: ["main-header", "fade-in-up"],
          jsEvents: ["load"],
          accessibility: {
            ariaLabels: "페이지 메인 제목",
            keyboardSupport: "포커스 가능",
            screenReader: "제목 레벨 1로 인식"
          }
        }
      }
    ];
  }

  /**
   * 기본 페이지 트랜지션 설정
   */
  private getDefaultPageTransitions(): PageTransitions {
    return {
      pageLoad: {
        sequence: [
          {
            elements: ["Main Header"],
            delay: "0ms",
            description: "페이지 제목이 먼저 나타남"
          },
          {
            elements: ["Introduction Section"],
            delay: "300ms", 
            description: "소개 내용이 이어서 나타남"
          },
          {
            elements: ["Navigation Footer"],
            delay: "600ms",
            description: "네비게이션이 마지막에 나타남"
          }
        ]
      },
      pageExit: {
        description: "페이지가 위로 슬라이드되며 사라짐",
        animation: "translateY(-100%) with opacity fade"
      }
    };
  }

  /**
   * 기본 글로벌 애니메이션 설정
   */
  private getDefaultGlobalAnimations(): GlobalAnimations {
    return {
      scrollBehavior: "부드러운 스크롤 (smooth scrolling) 및 스크롤 트리거 애니메이션 활성화",
      responsiveAnimations: "모바일에서는 애니메이션 간소화, 데스크톱에서는 풍부한 효과",
      performanceOptimizations: "transform과 opacity 속성 위주 사용, will-change 최적화 적용"
    };
  }

  /**
   * 애니메이션 프리셋 제공
   */
  getAnimationPresets() {
    return {
      gentle: {
        name: "부드러운",
        description: "차분하고 부드러운 애니메이션",
        durations: { fast: "200ms", normal: "400ms", slow: "600ms" },
        easings: ["ease-out", "cubic-bezier(0.2, 0.8, 0.2, 1)"]
      },
      playful: {
        name: "활기찬",
        description: "재미있고 생동감 있는 애니메이션",
        durations: { fast: "300ms", normal: "500ms", slow: "800ms" },
        easings: ["ease-in-out", "cubic-bezier(0.68, -0.55, 0.265, 1.55)"]
      },
      professional: {
        name: "전문적",
        description: "깔끔하고 전문적인 애니메이션",
        durations: { fast: "150ms", normal: "300ms", slow: "450ms" },
        easings: ["ease", "cubic-bezier(0.4, 0, 0.2, 1)"]
      }
    };
  }

  /**
   * 접근성을 고려한 애니메이션 설정
   */
  getAccessibilityGuidelines() {
    return {
      reducedMotion: "사용자가 모션 감소를 선호하는 경우 애니메이션 비활성화",
      duration: "애니메이션 지속시간을 적절히 조절 (너무 빠르거나 느리지 않게)",
      trigger: "예측 가능한 트리거 사용 (사용자 액션에 의한)",
      purpose: "애니메이션이 기능적 목적을 가져야 함 (단순 장식 금지)"
    };
  }
}