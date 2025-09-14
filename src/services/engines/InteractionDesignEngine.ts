import { InteractionSpecification, ComponentStyleSpecification } from '../../types/step4.types';

/**
 * Step4 상호작용 및 애니메이션 디자인 엔진
 *
 * Phase 3에서 교육적 효과를 높이기 위한 인터랙션 패턴을 생성하고 관리합니다.
 * 기본 애니메이션부터 스크롤 기반 인터랙션까지 포괄적으로 지원합니다.
 */
export class InteractionDesignEngine {

  /**
   * 컴포넌트들에 적절한 인터랙션 효과를 추가
   * @param components 컴포넌트 스타일 명세 배열
   * @param layoutMode 레이아웃 모드 (fixed/scrollable)
   * @returns 생성된 인터랙션 명세 배열
   */
  generateInteractions(
    components: ComponentStyleSpecification[],
    layoutMode: 'fixed' | 'scrollable'
  ): InteractionSpecification[] {
    const interactions: InteractionSpecification[] = [];

    // 컴포넌트별 기본 인터랙션 생성
    components.forEach((component, index) => {
      const basicInteraction = this.createBasicInteraction(component, index, layoutMode);
      if (basicInteraction) {
        interactions.push(basicInteraction);
      }

      // 특정 컴포넌트 타입에 추가 인터랙션 적용
      const specialInteraction = this.createSpecialInteraction(component, layoutMode);
      if (specialInteraction) {
        interactions.push(specialInteraction);
      }
    });

    // 스크롤 기반 순차 등장 효과 (scrollable 모드에서)
    if (layoutMode === 'scrollable') {
      const sequentialInteractions = this.createSequentialRevealEffects(components);
      interactions.push(...sequentialInteractions);
    }

    return interactions;
  }

  /**
   * 기본 인터랙션 생성 (hover, focus 효과)
   */
  private createBasicInteraction(
    component: ComponentStyleSpecification,
    index: number,
    layoutMode: 'fixed' | 'scrollable'
  ): InteractionSpecification | null {

    // 이미지 컴포넌트에는 hover 확대 효과
    if (component.type === 'image') {
      return {
        id: `interaction_${component.id}_hover`,
        target: component.id,
        trigger: 'hover',
        effect: 'scale',
        duration: '200ms',
        easing: 'ease-out',
        parameters: {
          scale: 1.05,
          opacity: 0.9
        }
      };
    }

    // 헤딩 컴포넌트에는 부드러운 등장 효과
    if (component.type === 'heading') {
      return {
        id: `interaction_${component.id}_reveal`,
        target: component.id,
        trigger: layoutMode === 'scrollable' ? 'visible' : 'load',
        effect: 'fadeIn',
        duration: '600ms',
        delay: `${index * 150}ms`, // 순차 등장
        easing: 'ease-out',
        parameters: {
          opacity: 1
        }
      };
    }

    // 카드 컴포넌트에는 호버 시 그림자 강화
    if (component.type === 'card') {
      return {
        id: `interaction_${component.id}_hover`,
        target: component.id,
        trigger: 'hover',
        effect: 'highlight',
        duration: '150ms',
        easing: 'ease-in-out',
        parameters: {
          opacity: 0.95
        }
      };
    }

    return null;
  }

  /**
   * 특수 인터랙션 생성 (컴포넌트 타입별 특화)
   */
  private createSpecialInteraction(
    component: ComponentStyleSpecification,
    _layoutMode: 'fixed' | 'scrollable'
  ): InteractionSpecification | null {

    // 첫 번째 헤딩에는 특별한 등장 효과
    if (component.type === 'heading' && component.id.includes('1')) {
      return {
        id: `interaction_${component.id}_special`,
        target: component.id,
        trigger: 'load',
        effect: 'slideIn',
        duration: '800ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        parameters: {
          direction: 'up',
          distance: 30,
          opacity: 1
        }
      };
    }

    // 마지막 컴포넌트에는 완료 강조 효과
    if (component.id.includes('conclusion') || component.id.includes('summary')) {
      return {
        id: `interaction_${component.id}_emphasis`,
        target: component.id,
        trigger: 'visible',
        effect: 'bounce',
        duration: '400ms',
        delay: '200ms',
        easing: 'ease-out'
      };
    }

    return null;
  }

  /**
   * 순차적 등장 효과 생성 (스크롤 기반)
   */
  private createSequentialRevealEffects(
    components: ComponentStyleSpecification[]
  ): InteractionSpecification[] {
    return components.map((component, index) => ({
      id: `interaction_sequential_${component.id}`,
      target: component.id,
      trigger: 'visible',
      effect: 'slideIn',
      duration: '500ms',
      delay: `${index * 100}ms`, // 100ms씩 지연
      easing: 'ease-out',
      parameters: {
        direction: 'up',
        distance: 20,
        opacity: 1
      },
      conditions: {
        scrollPosition: Math.min(10 + (index * 15), 80), // 스크롤 위치별 트리거
        userInteraction: false
      }
    }));
  }

  /**
   * 간소화된 진행 상태 인터랙션 생성 (네비게이션 제거)
   */
  generateProgressInteractions(_totalPages: number, _currentPage: number): InteractionSpecification[] {
    // 네비게이션 관련 인터랙션은 별도 플랫폼에서 제공하므로 제거
    return [];
  }

  /**
   * 간소화된 접근성 인터랙션 (기본만)
   */
  generateA11yInteractions(): InteractionSpecification[] {
    // 복잡성을 피하고 기본적인 포커스 효과만 제공
    return [
      {
        id: 'basic_focus_highlight',
        target: 'focusable-element',
        trigger: 'focus',
        effect: 'highlight',
        duration: '150ms',
        easing: 'ease-out',
        parameters: {
          opacity: 0.95
        }
      }
    ];
  }

  /**
   * 레이아웃 모드별 인터랙션 최적화
   */
  optimizeForLayoutMode(
    interactions: InteractionSpecification[],
    layoutMode: 'fixed' | 'scrollable'
  ): InteractionSpecification[] {
    return interactions.map(interaction => {
      if (layoutMode === 'fixed') {
        // Fixed 모드: 빠르고 간결한 애니메이션
        return {
          ...interaction,
          duration: this.adjustDurationForFixed(interaction.duration),
          delay: interaction.delay ? this.adjustDurationForFixed(interaction.delay) : undefined
        };
      } else {
        // Scrollable 모드: 여유롭고 부드러운 애니메이션
        return {
          ...interaction,
          duration: this.adjustDurationForScrollable(interaction.duration),
          easing: this.optimizeEasingForScrollable(interaction.easing)
        };
      }
    });
  }

  /**
   * Fixed 모드용 지속시간 조정 (더 빠르게)
   */
  private adjustDurationForFixed(duration: string): string {
    const numValue = parseInt(duration);
    return `${Math.max(100, numValue * 0.7)}ms`;
  }

  /**
   * Scrollable 모드용 지속시간 조정 (더 여유롭게)
   */
  private adjustDurationForScrollable(duration: string): string {
    const numValue = parseInt(duration);
    return `${numValue * 1.2}ms`;
  }

  /**
   * Scrollable 모드용 이징 함수 최적화
   */
  private optimizeEasingForScrollable(easing?: string): string {
    if (!easing) return 'ease-out';

    // 더 부드러운 이징 함수들로 변경
    const easingMap: Record<string, string> = {
      'ease-in': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
    };

    return easingMap[easing] || easing;
  }

  /**
   * 인터랙션 품질 검증
   */
  validateInteractions(interactions: InteractionSpecification[]): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 중복 target 검사
    const targetCounts = new Map<string, number>();
    interactions.forEach(interaction => {
      targetCounts.set(interaction.target, (targetCounts.get(interaction.target) || 0) + 1);
    });

    targetCounts.forEach((count, target) => {
      if (count > 3) {
        warnings.push(`Target "${target}"에 ${count}개의 인터랙션이 할당됨. 성능 저하 가능성`);
      }
    });

    // 지속시간 검증
    interactions.forEach(interaction => {
      const duration = parseInt(interaction.duration);
      if (duration > 1000) {
        warnings.push(`인터랙션 "${interaction.id}"의 지속시간이 1초를 초과함 (${duration}ms)`);
      }
      if (duration < 100) {
        suggestions.push(`인터랙션 "${interaction.id}"의 지속시간이 너무 짧을 수 있음 (${duration}ms)`);
      }
    });

    // 접근성 검증
    const hasA11yInteractions = interactions.some(i =>
      i.trigger === 'focus' || i.id.includes('a11y') || i.id.includes('accessibility')
    );

    if (!hasA11yInteractions) {
      suggestions.push('접근성 향상을 위한 포커스 기반 인터랙션 추가를 고려하세요');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}