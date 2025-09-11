import { OpenAIService } from './openai.service';
import { loadApiKey } from './storage.service';
import { ProjectData, VisualIdentity, LayoutProposal, PageEnhancement } from '../types/workflow.types';
import { LayoutPromptService } from './layout.prompt.service';

export class PageEnhancementService {
  private openaiService = OpenAIService.getInstance();

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
    this.openaiService.initialize(apiKey);
    
    console.log(`🚀 ${layoutProposals.length}개 페이지 인터랙션/애니메이션 병렬 생성 시작`);
    
    // 모든 페이지에 대해 병렬로 API 호출 생성
    const enhancementPromises = layoutProposals.map((layoutProposal, index) => {
      console.log(`⚡ 병렬 큐 추가: 페이지 ${layoutProposal.metadata.pageNumber} (${layoutProposal.pageTitle})`);
      return this.generateSinglePageEnhancement(
        projectData, 
        visualIdentity, 
        layoutProposal, 
        layoutProposals
      );
    });

    console.log(`🔥 병렬 처리 실행: ${enhancementPromises.length}개 Promise 동시 시작!`);

    try {
      // 모든 페이지를 병렬로 처리
      const results = await Promise.allSettled(enhancementPromises);
      
      const pageEnhancements: PageEnhancement[] = [];
      const failedPages: string[] = [];
      
      // 결과 처리
      results.forEach((result, index) => {
        const layoutProposal = layoutProposals[index];
        
        if (result.status === 'fulfilled' && result.value) {
          pageEnhancements.push(result.value);
          console.log(`✅ 페이지 ${layoutProposal.metadata.pageNumber} 인터랙션 생성 완료`);
        } else {
          console.error(`❌ 페이지 ${layoutProposal.metadata.pageNumber} 인터랙션 생성 실패:`, 
            result.status === 'rejected' ? result.reason : '알 수 없는 오류');
          
          failedPages.push(`페이지 ${layoutProposal.metadata.pageNumber}`);
          
          // 실패한 페이지에 대해 폴백 인터랙션 생성
          const fallbackEnhancement = this.generateFallbackEnhancement(layoutProposal);
          pageEnhancements.push(fallbackEnhancement);
        }
      });
      
      // 페이지 번호 순으로 정렬
      pageEnhancements.sort((a, b) => {
        const pageA = layoutProposals.find(p => p.pageId === a.pageId);
        const pageB = layoutProposals.find(p => p.pageId === b.pageId);
        return (pageA?.metadata.pageNumber || 0) - (pageB?.metadata.pageNumber || 0);
      });
      
      // 실행 결과 요약
      const successCount = pageEnhancements.length - failedPages.length;
      
      const totalTime = Math.round((Date.now() - Date.now()) / 1000); // 실제로는 시작 시간을 변수로 저장해야 함
      
      console.group(`🎉 [병렬] 인터랙션/애니메이션 병렬 생성 완료 - ${new Date().toLocaleTimeString()}`);
      console.log(`⚡ 병렬 처리 방식: Promise.allSettled로 동시 처리`);
      console.log(`📊 전체 페이지: ${layoutProposals.length}개`);
      console.log(`✅ 성공: ${successCount}개`);
      console.log(`🔄 폴백: ${failedPages.length}개`);
      
      if (failedPages.length > 0) {
        console.log(`⚠️ 실패한 페이지들:`);
        failedPages.forEach(page => console.log(`  - ${page}`));
      }
      console.groupEnd();
      
      return pageEnhancements;
      
    } catch (error) {
      console.error('병렬 인터랙션 생성 중 심각한 오류:', error);
      throw new Error(`인터랙션 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async generateSinglePageEnhancement(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposal: LayoutProposal,
    allLayoutProposals: LayoutProposal[]
  ): Promise<PageEnhancement> {
    try {
      const startTime = Date.now();
      console.log(`🎬 [병렬] 페이지 ${layoutProposal.metadata.pageNumber} (${layoutProposal.pageTitle}) 애니메이션 생성 시작 - ${new Date().toLocaleTimeString()}`);
      
      const prompt = this.buildDetailedInteractionPrompt(
        projectData, 
        visualIdentity, 
        layoutProposal, 
        allLayoutProposals
      );
      
      console.log(`🚀 [병렬] 페이지 ${layoutProposal.metadata.pageNumber} OpenAI API 호출 시작 - ${new Date().toLocaleTimeString()}`);
      
      const response = await this.openaiService.generateCompletion(
        prompt,
        `[병렬] 페이지 ${layoutProposal.metadata.pageNumber} 요소별 인터랙션/애니메이션 설계`
      );
      
      console.log(`✅ [병렬] 페이지 ${layoutProposal.metadata.pageNumber} OpenAI API 응답 받음 - ${new Date().toLocaleTimeString()}`);
      
      // JSON 파싱 시도
      let parsedResponse;
      try {
        parsedResponse = this.parseAIResponse(response.content);
        console.log(`🎬 페이지 ${layoutProposal.metadata.pageNumber} 인터랙션 JSON 파싱 성공`);
        
        // 응답 구조 검증
        if (!this.validateEnhancementResponse(parsedResponse, layoutProposal)) {
          throw new Error('인터랙션 응답 구조가 올바르지 않습니다');
        }
        
      } catch (parseError) {
        console.error(`🎬 페이지 ${layoutProposal.metadata.pageNumber} JSON 파싱 실패:`, parseError);
        throw parseError;
      }

      // 토큰 사용량 로그
      if (response.usage) {
        console.log(`🎬 페이지 ${layoutProposal.metadata.pageNumber} 인터랙션 토큰: ${response.usage.total_tokens}`);
      }

      // PageEnhancement 객체로 변환
      const pageEnhancement: PageEnhancement = {
        pageId: parsedResponse.pageId || layoutProposal.pageId,
        pageTitle: parsedResponse.pageTitle || layoutProposal.pageTitle,
        elementInteractions: parsedResponse.elementInteractions || [],
        pageTransitions: parsedResponse.pageTransitions || {
          pageLoad: {
            sequence: [
              {
                elements: ["전체"],
                delay: "0s",
                description: "기본 페이지 로드"
              }
            ]
          },
          pageExit: {
            description: "페이지 이탈 애니메이션",
            animation: "fade-out 0.3s ease-in"
          }
        },
        globalAnimations: parsedResponse.globalAnimations || {
          scrollBehavior: projectData.layoutMode === 'scrollable' ? '기본 스크롤' : '고정형',
          responsiveAnimations: '기본 반응형 설정',
          performanceOptimizations: '기본 최적화'
        }
      };

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      console.log(`✅ [병렬] 페이지 ${layoutProposal.metadata.pageNumber} 완료 (${duration}초 소요, ${pageEnhancement.elementInteractions.length}개 요소) - ${new Date().toLocaleTimeString()}`);
      return pageEnhancement;

    } catch (error) {
      console.error(`🎬 페이지 ${layoutProposal.metadata.pageNumber} 인터랙션 생성 실패:`, error);
      throw error;
    }
  }

  private validateEnhancementResponse(response: any, layoutProposal: LayoutProposal): boolean {
    try {
      // 기본 구조 확인
      if (!response.elementInteractions || !Array.isArray(response.elementInteractions)) {
        console.error('elementInteractions 배열이 없음');
        return false;
      }
      
      // Step3 요소와의 매칭 확인
      const step3ElementNames = layoutProposal.detailedElements.map(el => el.elementName);
      const step4ElementNames = response.elementInteractions.map(ei => ei.elementId);
      
      // 모든 Step3 요소가 Step4에 매핑되었는지 확인
      const missingElements = step3ElementNames.filter(name => !step4ElementNames.includes(name));
      if (missingElements.length > 0) {
        console.warn(`Step3 요소 중 Step4에서 누락된 요소들: ${missingElements.join(', ')}`);
        // 경고만 하고 계속 진행 (부분적으로라도 사용)
      }
      
      console.log(`Step3 요소 ${step3ElementNames.length}개 중 ${step4ElementNames.length}개 매핑됨`);
      return true;
      
    } catch (error) {
      console.error('인터랙션 응답 검증 중 오류:', error);
      return false;
    }
  }

  private generateFallbackEnhancement(layoutProposal: LayoutProposal): PageEnhancement {
    // Step3 요소들을 기반으로 기본 인터랙션 생성
    const elementInteractions = layoutProposal.detailedElements.map(element => ({
      elementId: element.elementName,
      elementType: element.elementType,
      staticState: {
        description: `${element.elementName}의 기본 정적 상태`,
        initialStyling: element.styling
      },
      loadAnimation: {
        type: 'fade-in',
        duration: '0.6s',
        delay: '0.2s',
        timing: 'ease-out',
        keyframes: 'opacity: 0 → 1, transform: translateY(20px) → translateY(0)',
        educationalPurpose: `${element.purpose}를 부드럽게 소개`
      },
      interactionStates: {
        hover: {
          description: '마우스 호버 시 강조 효과',
          styling: {
            transform: 'scale(1.02)',
            transition: '0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          additionalEffects: '부드러운 확대와 그림자 효과'
        },
        focus: {
          description: '포커스 시 접근성 강조',
          styling: {
            outline: `2px solid ${layoutProposal.designSpecs?.colorScheme?.includes('blue') ? '#3B82F6' : '#6366F1'}`,
            outlineOffset: '2px'
          },
          additionalEffects: '접근성을 위한 명확한 포커스 표시'
        },
        active: {
          description: '클릭/터치 시 반응',
          styling: {
            transform: 'scale(0.98)',
            transition: '0.1s ease'
          },
          additionalEffects: '클릭 피드백을 위한 살짝 축소'
        }
      },
      feedbackAnimations: {
        success: {
          trigger: '성공적인 상호작용 완료',
          animation: '초록색 체크마크 + 0.3초 glow 효과',
          duration: '0.8s'
        },
        loading: {
          trigger: '처리 중 상태',
          animation: '회전하는 스피너 또는 pulse 효과',
          duration: 'continuous'
        }
      },
      educationalEnhancements: {
        learningSupport: element.purpose,
        specialInteractions: [
          {
            name: '학습 강조',
            description: '중요한 교육 내용 하이라이트',
            trigger: 'click 또는 long-press',
            effect: '배경 색상 변화 + 텍스트 강조',
            purpose: '학습자의 주의 집중 및 기억 강화'
          }
        ]
      },
      technicalSpecs: {
        cssClasses: [
          `${element.elementType}-element`,
          'interactive-element',
          'fade-in-element'
        ],
        jsEvents: ['click', 'mouseenter', 'mouseleave', 'focus', 'blur'],
        accessibility: {
          ariaLabels: `${element.elementName} - ${element.elementType} 요소`,
          keyboardSupport: 'Tab으로 포커스 이동, Enter/Space로 활성화',
          screenReader: `${element.elementName}, ${element.elementType} 타입, ${element.purpose}`
        }
      }
    }));

    return {
      pageId: layoutProposal.pageId,
      pageTitle: layoutProposal.pageTitle,
      elementInteractions,
      pageTransitions: {
        pageLoad: {
          sequence: [
            {
              elements: ['header'],
              delay: '0s',
              description: '헤더 영역 먼저 등장'
            },
            {
              elements: ['content', 'media'],
              delay: '0.2s',
              description: '메인 콘텐츠 등장'
            },
            {
              elements: ['footer', 'interactive'],
              delay: '0.4s',
              description: '인터랙티브 요소 마지막 등장'
            }
          ]
        },
        pageExit: {
          description: '페이지 이탈 시 부드러운 페이드아웃',
          animation: 'fade-out 0.3s ease-in'
        }
      },
      globalAnimations: {
        scrollBehavior: layoutProposal.designSpecs?.primaryLayout === 'scrollable' 
          ? '스크롤에 따른 요소별 순차 등장' 
          : '고정형 레이아웃으로 스크롤 없음',
        responsiveAnimations: '모바일에서는 애니메이션 시간 20% 단축',
        performanceOptimizations: 'transform과 opacity만 사용하여 60fps 보장'
      }
    };
  }

  buildDetailedInteractionPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposal: LayoutProposal,
    allLayoutProposals: LayoutProposal[]
  ): string {
    const contentModeText = projectData.contentMode === 'enhanced' 
      ? 'AI 보강 (적절한 상호작용으로 학습 효과 향상)' 
      : '원본 유지 (간결하고 직관적인 인터랙션)';

    const layoutModeText = projectData.layoutMode === 'scrollable' ? '세로 스크롤 허용' : '1600px x 1000px 고정 크기';

    return `
당신은 교육용 웹 인터페이스 전문가입니다.
Step3에서 완성된 **정적 레이아웃의 각 요소**를 바탕으로, **학습에 도움이 되는 적절한 수준의 인터랙션**을 설계해주세요.

## 📋 프로젝트 컨텍스트
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **현재 페이지**: ${layoutProposal.metadata.pageNumber}/${projectData.pages.length} - ${layoutProposal.pageTitle}
- **레이아웃 모드**: ${layoutModeText}
- **콘텐츠 처리**: ${contentModeText}

## 🎨 교육용 인터랙션 설계 원칙
- **분위기**: ${visualIdentity.moodAndTone}
- **메인 색상**: ${visualIdentity.colorPalette.primary}
- **보조 색상**: ${visualIdentity.colorPalette.secondary}
- **기본 원칙**: 
  * 학습 방해 없는 자연스러운 움직임
  * 필요한 경우에만 적절한 피드백 제공
  * 과도한 효과보다는 명확한 정보 전달 우선

## 🏗️ Step3 정적 레이아웃 - 요소별 상세 분석

### 전체 페이지 구조 이해
**레이아웃 설명**: ${layoutProposal.layoutDescription}

**디자인 사양**:
- 주요 레이아웃: ${layoutProposal.designSpecs.primaryLayout}
- 색상 조합: ${layoutProposal.designSpecs.colorScheme}
- 시선 흐름: ${layoutProposal.designSpecs.visualFlow}
- 교육 전략: ${layoutProposal.designSpecs.educationalStrategy}

### 각 요소별 상세 정보 및 인터랙션 설계 대상

${layoutProposal.detailedElements.map((element, index) => `
---
## 요소 ${index + 1}: ${element.elementName}

**기본 정보**:
- 타입: ${element.elementType}
- 위치: ${element.position.top} (상단) / ${element.position.left} (좌측)
- 크기: ${element.position.width} × ${element.position.height}
- 현재 스타일: ${JSON.stringify(element.styling)}

**콘텐츠 내용**:
${element.content}

**교육적 목적**:
${element.purpose}

**예정된 인터랙션 유형**:
${element.interactionPlaceholder || '기본 정적 요소'}

**이 요소를 위한 구체적 설계 요구사항**:
1. **정적 상태**: 기본 시각적 상태 정의
2. **로드 애니메이션**: 페이지 로드 시 등장 방식
3. **인터랙션 상태들**: hover, focus, active, disabled 등
4. **피드백 애니메이션**: 사용자 액션에 대한 즉각적 반응
5. **교육적 연결**: 이 요소의 교육 목적에 맞는 특별한 인터랙션
`).join('')}

---

## 🎯 요소별 인터랙션 설계 프레임워크

### 1. 요소 타입별 표준 인터랙션 패턴

**header 요소**:
- 스크롤 시 고정/축소 애니메이션
- 네비게이션 메뉴 토글 (있는 경우)
- 진행률 표시 업데이트 (있는 경우)

**content 요소**:
- 텍스트: 부드러운 fade-in 등장
- 이미지: 점진적 로딩 표시
- 리스트: 간단한 순차 표시

**sidebar 요소**:
- 기본적인 네비게이션 표시
- 현재 위치 강조

**footer 요소**:
- 페이지 전환 버튼
- 진행률 표시

**media 요소**:
- 이미지: 기본 로딩과 캡션
- 다이어그램: 필요시 단계별 표시

**static_interactive 요소**:
- 버튼: 기본적인 hover와 클릭 피드백
- 카드: 간단한 강조 효과

### 2. 교육 효과별 맞춤 인터랙션

**학습 동기 유발**:
- 명확한 진행률 표시
- 완료 상태 시각적 표시

**이해도 증진**:
- 중요 내용 적절한 강조
- 관련 정보 그룹화 표시

**기억 강화**:
- 핵심 포인트 색상 구분
- 요약 정보 명확한 배치

### 3. 성능 및 접근성 고려사항

**성능 최적화**:
- GPU 가속 속성 사용 (transform, opacity)
- 60fps 유지를 위한 duration 조절
- will-change 속성 적절한 사용

**접근성**:
- prefers-reduced-motion 지원
- 키보드 네비게이션
- 스크린 리더 호환성
- 고대비 모드 지원

## 📋 JSON 출력 형식

다음 형식으로 **Step3의 각 요소에 정확히 매칭되는 인터랙션/애니메이션**을 설계하세요:

{
  "pageId": "${layoutProposal.pageId}",
  "pageTitle": "${layoutProposal.pageTitle}",
  "elementInteractions": [
    {
      "elementId": "Step3의 정확한 elementName",
      "elementType": "Step3의 elementType과 일치",
      "staticState": {
        "description": "요소의 기본 정적 상태 설명",
        "initialStyling": {
          "기본 CSS 속성들": "값"
        }
      },
      "loadAnimation": {
        "type": "fade-in|slide-up|scale-in",
        "duration": "0.4s",
        "delay": "0.1s",
        "timing": "ease-out",
        "keyframes": "부드러운 등장 애니메이션",
        "educationalPurpose": "자연스러운 콘텐츠 등장으로 주의 집중"
      },
      "interactionStates": {
        "hover": {
          "description": "마우스 호버 시 미묘한 변화",
          "styling": { "opacity": "0.8", "transition": "0.2s ease" },
          "additionalEffects": "부드러운 강조 효과"
        },
        "focus": {
          "description": "포커스 시 변화 (접근성)",
          "styling": { "outline": "2px solid ${visualIdentity.colorPalette.primary}" },
          "additionalEffects": "추가 효과"
        },
        "active": {
          "description": "클릭/활성화 시 변화",
          "styling": { "transform": "scale(0.98)" },
          "additionalEffects": "눌림 효과"
        },
        "disabled": {
          "description": "비활성화 상태 (해당하는 경우)",
          "styling": { "opacity": "0.5", "cursor": "not-allowed" },
          "additionalEffects": "비활성화 표시"
        }
      },
      "feedbackAnimations": {
        "success": {
          "trigger": "성공적인 액션 완료 시",
          "animation": "간단한 체크마크 표시",
          "duration": "0.4s"
        },
        "error": {
          "trigger": "오류 발생 시",
          "animation": "색상 변화로 오류 표시",
          "duration": "0.3s"
        },
        "loading": {
          "trigger": "처리 중 상태",
          "animation": "간단한 로딩 표시",
          "duration": "continuous"
        }
      },
      "educationalEnhancements": {
        "learningSupport": "이 요소가 학습을 어떻게 지원하는지",
        "specialInteractions": [
          {
            "name": "교육 특화 인터랙션 이름",
            "description": "구체적 작동 방식",
            "trigger": "발생 조건",
            "effect": "시각적/기능적 효과",
            "purpose": "교육적 목적"
          }
        ]
      },
      "technicalSpecs": {
        "cssClasses": ["적용될 CSS 클래스들"],
        "jsEvents": ["필요한 JavaScript 이벤트들"],
        "accessibility": {
          "ariaLabels": "접근성 레이블",
          "keyboardSupport": "키보드 조작 방법",
          "screenReader": "스크린 리더 지원사항"
        }
      }
    }
  ],
  "pageTransitions": {
    "pageLoad": {
      "sequence": [
        {
          "elements": ["header", "navigation"],
          "delay": "0s",
          "description": "첫 번째로 나타날 요소들"
        },
        {
          "elements": ["main-content", "title"],
          "delay": "0.2s",
          "description": "두 번째로 나타날 요소들"
        },
        {
          "elements": ["sidebar", "media"],
          "delay": "0.4s",
          "description": "세 번째로 나타날 요소들"
        }
      ]
    },
    "pageExit": {
      "description": "페이지 이탈 시 애니메이션",
      "animation": "fade-out 0.3s ease-in"
    }
  },
  "globalAnimations": {
    "scrollBehavior": "${projectData.layoutMode === 'scrollable' ? '스크롤 기반 애니메이션 정의' : '고정형이므로 해당없음'}",
    "responsiveAnimations": "반응형 화면에서의 애니메이션 조정사항",
    "performanceOptimizations": "성능 최적화를 위한 설정들"
  }
}

**중요한 제약사항**:
1. ✅ **완전한 매칭**: Step3의 모든 detailedElements와 정확히 1:1 대응
2. ✅ **요소별 맞춤화**: 각 요소의 타입, 목적, 콘텐츠에 맞는 인터랙션
3. ✅ **교육 효과 중심**: 모든 애니메이션이 학습 목표와 연결
4. ✅ **실제 구현 가능**: CSS/JavaScript로 실제 구현 가능한 수준
5. ✅ **접근성 준수**: 모든 인터랙션이 접근성 가이드라인 준수
6. ✅ **성능 고려**: 60fps 유지 가능한 최적화된 애니메이션
7. ✅ **브랜드 일관성**: 비주얼 아이덴티티와 완전 조화

**출력 예시 (간단한 구조)**:
{
  "pageId": "${layoutProposal.pageId}",
  "pageTitle": "${layoutProposal.pageTitle}",
  "elementInteractions": [
    {
      "elementId": "첫 번째 요소 이름",
      "elementType": "header",
      "staticState": {
        "description": "기본 상태 설명",
        "initialStyling": {"color": "#333"}
      },
      "loadAnimation": {
        "type": "fade-in",
        "duration": "0.6s",
        "delay": "0s",
        "timing": "ease-out",
        "keyframes": "opacity: 0 to 1",
        "educationalPurpose": "부드러운 도입"
      },
      "interactionStates": {
        "hover": {
          "description": "호버 효과",
          "styling": {"transform": "scale(1.05)"},
          "additionalEffects": "그림자 증가"
        }
      },
      "feedbackAnimations": {
        "success": {
          "trigger": "완료시",
          "animation": "체크마크",
          "duration": "0.5s"
        }
      },
      "educationalEnhancements": {
        "learningSupport": "학습 지원 방식",
        "specialInteractions": []
      },
      "technicalSpecs": {
        "cssClasses": ["header-element"],
        "jsEvents": ["click"],
        "accessibility": {
          "ariaLabels": "헤더 영역",
          "keyboardSupport": "Tab 키",
          "screenReader": "헤더"
        }
      }
    }
  ],
  "pageTransitions": {
    "pageLoad": {
      "sequence": [
        {"elements": ["header"], "delay": "0s", "description": "헤더 등장"}
      ]
    },
    "pageExit": {
      "description": "페이드아웃",
      "animation": "fade-out 0.3s"
    }
  },
  "globalAnimations": {
    "scrollBehavior": "기본 스크롤",
    "responsiveAnimations": "기본 반응형",
    "performanceOptimizations": "transform/opacity 사용"
  }
}

**중요**: 반드시 유효한 JSON 형태로만 응답하세요. 설명이나 주석 없이 JSON 객체만 출력하세요.
    `;
  }

  /**
   * JSON 응답 파싱 (인터랙션 전용)
   */
  private parseAIResponse(content: string): any {
    try {
      // 1단계: 기본 JSON 파싱 시도
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.log('기본 JSON 파싱 실패, 보정 시도...');
      
      try {
        // 2단계: JSON 객체만 추출하여 파싱
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
          throw new Error('유효한 JSON 객체 구조를 찾을 수 없습니다');
        }
        
        const jsonOnly = content.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonOnly);
        return parsed;
      } catch (error2) {
        console.error('모든 JSON 파싱 시도 실패:', error2);
        throw new Error(`인터랙션 JSON 파싱 실패: ${error2.message}`);
      }
    }
  }
}

export const pageEnhancementService = new PageEnhancementService();