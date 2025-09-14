import { EducationalFeature, ComponentStyleSpecification } from '../../types/step4.types';

/**
 * Step4 간소화된 교육적 기능 엔진
 *
 * Phase 3에서 복잡성을 줄이고 핵심적인 교육 기능만 제공합니다.
 * 포커스 가이드 등 최소한의 기능만 포함합니다.
 */
export class EducationalFeatureEngine {

  /**
   * 간소화된 교육적 기능들 생성 (포커스 가이드 중심)
   * @param pageNumber 현재 페이지 번호 (사용하지 않지만 인터페이스 호환성 위해 유지)
   * @param totalPages 전체 페이지 수 (사용하지 않지만 인터페이스 호환성 위해 유지)
   * @param layoutMode 레이아웃 모드
   * @param components 페이지 내 컴포넌트들
   * @returns 생성된 교육적 기능 배열
   */
  generateEducationalFeatures(
    _pageNumber: number,
    _totalPages: number,
    layoutMode: 'fixed' | 'scrollable',
    components: ComponentStyleSpecification[]
  ): EducationalFeature[] {
    const features: EducationalFeature[] = [];

    // 스크롤 기반 포커스 가이드만 추가 (필요시)
    if (layoutMode === 'scrollable' && components.length > 3) {
      const focusGuideFeature: EducationalFeature = {
        id: 'scroll-focus-guide',
        type: 'focusGuide',
        position: 'center',
        dimensions: {
          width: 80,
          height: 80
        },
        styling: {
          primaryColor: '#004D99',
          secondaryColor: 'rgba(255, 204, 0, 0.3)',
          backgroundColor: 'transparent',
          opacity: 0.7
        },
        behavior: {
          autoUpdate: true,
          userControl: false,
          persistence: false
        }
      };
      features.push(focusGuideFeature);
    }

    return features;
  }

  /**
   * 접근성 기능 생성 (기본만)
   */
  generateAccessibilityFeatures(
    _components: ComponentStyleSpecification[],
    _layoutMode: 'fixed' | 'scrollable'
  ): EducationalFeature[] {
    // 복잡성을 피하고 기본적인 접근성만 제공
    return [];
  }

  /**
   * 분석 기능 생성 (제거됨)
   */
  generateAnalyticsFeatures(): EducationalFeature[] {
    // 복잡성 제거로 분석 기능 비활성화
    return [];
  }

  /**
   * 레이아웃 모드별 교육 기능 최적화
   */
  optimizeForLayoutMode(
    features: EducationalFeature[],
    layoutMode: 'fixed' | 'scrollable'
  ): EducationalFeature[] {
    return features.map(feature => {
      if (layoutMode === 'fixed') {
        // Fixed 모드에서는 더 컴팩트하게
        return {
          ...feature,
          dimensions: feature.dimensions ? {
            width: Math.min(feature.dimensions.width, 60),
            height: Math.min(feature.dimensions.height, 60)
          } : undefined,
          styling: {
            ...feature.styling,
            opacity: Math.min((feature.styling.opacity || 1) * 0.8, 1)
          }
        };
      } else {
        // Scrollable 모드에서는 그대로 유지
        return feature;
      }
    });
  }

  /**
   * 교육적 기능 품질 검증 (간소화)
   */
  validateEducationalFeatures(features: EducationalFeature[]): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 기본적인 검증만 수행
    if (features.length > 5) {
      warnings.push(`교육적 기능이 ${features.length}개로 많습니다. 성능을 고려하세요.`);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}