/**
 * Step4 텍스트 파싱 엔진
 *
 * AI가 생성한 상세한 애니메이션/인터랙션 설계 텍스트를 파싱합니다.
 * 구조화된 마크다운 형식의 응답을 처리
 */
export class ParsingEngine {
  /**
   * Step4 AI 응답 파싱 (새로운 텍스트 형식)
   * @param content AI 응답 텍스트
   * @returns 파싱된 상세 설계 결과
   */
  parseStep4Response(content: string): {
    animationDescription: string;
    interactionDescription: string;
  } {
    console.log('🔍 Step4 텍스트 응답 파싱 시작');

    try {
      // 전체 응답을 그대로 저장
      const fullResponse = content.trim();

      // "애니메이션" 섹션 추출
      const animationMatch = fullResponse.match(/\*\*애니메이션\*\*:([\s\S]*?)(?:\*\*상호작용\*\*:|$)/);
      let animationDescription = '';
      if (animationMatch) {
        animationDescription = animationMatch[1].trim();
      }

      // "상호작용" 섹션 추출
      const interactionMatch = fullResponse.match(/\*\*상호작용\*\*:([\s\S]*?)$/);
      let interactionDescription = '';
      if (interactionMatch) {
        interactionDescription = interactionMatch[1].trim();
      }

      // 섹션을 찾지 못한 경우 전체 텍스트를 분할
      if (!animationDescription && !interactionDescription) {
        console.warn('⚠️ 구조화된 섹션을 찾을 수 없음, 전체 텍스트를 처리');
        const midPoint = Math.floor(fullResponse.length / 2);
        animationDescription = fullResponse.substring(0, midPoint).trim();
        interactionDescription = fullResponse.substring(midPoint).trim();
      }

      // 빈 값 처리
      if (!animationDescription) {
        animationDescription = this.getFallbackResult().animationDescription;
      }
      if (!interactionDescription) {
        interactionDescription = this.getFallbackResult().interactionDescription;
      }

      console.log('✅ Step4 텍스트 파싱 성공');
      console.log('📊 파싱 결과:', {
        animationLength: animationDescription.length,
        interactionLength: interactionDescription.length
      });

      return {
        animationDescription,
        interactionDescription
      };

    } catch (error) {
      console.error('❌ 텍스트 파싱 실패:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * 파싱 실패 시 기본값 반환
   */
  private getFallbackResult(): {
    animationDescription: string;
    interactionDescription: string;
  } {
    return {
      animationDescription: `### 애니메이션 및 상호작용
- **애니메이션**: 학습 몰입을 높이는 점진적 정보 공개 설계

**1) 페이지 최초 로드 시퀀스(0-1.5초, ease-out)**
- 0-300ms: 페이지 배경이 부드럽게 페이드인
- 200-800ms: 주요 제목이 위에서 16px 내려오며 등장
- 400-1000ms: 콘텐츠 섹션들이 60ms 간격으로 순차 페이드인
- 800-1200ms: 이미지와 인터랙티브 요소들이 미세한 스케일 효과와 함께 등장

**2) 콘텐츠 영역별 애니메이션**
- 텍스트 블록: 스크롤 진입 시 페이드업 효과로 가독성 향상
- 카드 요소: 0.98에서 1.0 스케일로 부드러운 등장, 학습자 주의 집중
- 이미지: 마스크 리빌 효과로 시각적 흥미 유발`,

      interactionDescription: `**- **상호작용**: 직관적이고 접근성을 고려한 피드백 설계

**A) 카드 및 버튼 상호작용**
- Hover: 6px 상승 + 그림자 강화, 시각적 피드백 제공
- Focus: 3px 파란색 포커스 링, 키보드 네비게이션 지원
- Click: 0.98 스케일 압축 후 원복, 명확한 클릭 피드백

**B) 텍스트 및 링크 요소**
- Hover: 밑줄 애니메이션, 색상 변화로 상호작용 가능성 표시
- 접근성: 최소 44px 터치 타겟, 색상 대비 4.5:1 이상 보장

**C) 접근성 및 성능 최적화**
- 키보드 네비게이션: Tab 순서 최적화, ESC로 모달 닫기
- 감속 모드: prefers-reduced-motion 지원으로 움직임 최소화
- 성능: transform/opacity 기반 애니메이션으로 60fps 보장`
    };
  }
}