import {
  ComponentStyleSpecification,
  FontSpecification,
  ColorSpecification,
  VisualStyleSpecification
} from '../../types/step4.types';
import { ComponentLine, VisualIdentity, DesignTokens } from '../../types/workflow.types';

/**
 * 스타일 구체화 엔진
 *
 * Step2의 비주얼 아이덴티티와 디자인 토큰을 활용하여
 * Step3의 컴포넌트들을 실제 CSS 속성으로 구체화합니다.
 */
export class StyleSpecificationEngine {
  /**
   * 컴포넌트들의 스타일을 구체화
   * @param components Step3에서 생성된 컴포넌트들
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param designTokens 디자인 토큰
   * @param layoutMode 레이아웃 모드
   * @returns 구체화된 컴포넌트 스타일 명세들
   */
  specifyComponentStyles(
    components: ComponentLine[],
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens,
    layoutMode: 'fixed' | 'scrollable'
  ): ComponentStyleSpecification[] {
    console.log('🎨 StyleSpecificationEngine: 스타일 구체화 시작', {
      componentsCount: components.length,
      layoutMode
    });

    const specifications = components.map((comp, index) => {
      return this.processComponent(comp, visualIdentity, designTokens, layoutMode, index);
    });

    console.log('✅ StyleSpecificationEngine: 스타일 구체화 완료', {
      specificationsCreated: specifications.length
    });

    return specifications;
  }

  /**
   * 개별 컴포넌트 스타일 처리
   */
  private processComponent(
    component: ComponentLine,
    visualIdentity: VisualIdentity,
    designTokens: DesignTokens,
    layoutMode: 'fixed' | 'scrollable',
    index: number
  ): ComponentStyleSpecification {
    const baseStyle = this.getBaseStyle(component.type, designTokens, layoutMode);
    const colorScheme = this.applyColorScheme(baseStyle, visualIdentity);
    const typography = this.applyTypography(component, visualIdentity, layoutMode);
    const visualStyle = this.applyVisualStyle(component, visualIdentity, layoutMode);
    const position = this.calculateComponentPosition(component, index, layoutMode);
    const dimensions = this.calculateComponentDimensions(component, layoutMode);

    return {
      id: component.id,
      type: component.type === 'caption' ? 'paragraph' : component.type as 'heading' | 'paragraph' | 'card' | 'image',
      section: component.section,
      position,
      dimensions,
      font: component.type !== 'image' ? typography : undefined,
      colors: colorScheme,
      visual: visualStyle,
      states: this.generateStateStyles(component, visualIdentity),
      zIndex: this.calculateZIndex(component.type),
      display: this.getDisplayType(component.type)
    };
  }

  /**
   * 컴포넌트 타입별 기본 스타일 반환
   */
  private getBaseStyle(
    type: string,
    designTokens: DesignTokens,
    layoutMode: 'fixed' | 'scrollable'
  ): any {
    const baseStyles = {
      heading: {
        margin: layoutMode === 'fixed' ? designTokens.spacing.md : designTokens.spacing.lg,
        padding: designTokens.spacing.sm
      },
      paragraph: {
        margin: layoutMode === 'fixed' ? designTokens.spacing.sm : designTokens.spacing.md,
        padding: 0
      },
      card: {
        margin: designTokens.spacing.md,
        padding: layoutMode === 'fixed' ? designTokens.spacing.md : designTokens.spacing.lg,
        radius: designTokens.radius.md,
        elevation: designTokens.elevation.low
      },
      image: {
        margin: designTokens.spacing.sm,
        padding: 0,
        radius: designTokens.radius.sm
      }
    };

    return baseStyles[type as keyof typeof baseStyles] || baseStyles.paragraph;
  }

  /**
   * 색상 스키마 적용
   */
  private applyColorScheme(_baseStyle: any, visualIdentity: VisualIdentity): ColorSpecification {
    return {
      text: visualIdentity.colorPalette.text,
      background: 'transparent', // 기본적으로 투명, 필요시 개별 설정
      border: visualIdentity.colorPalette.secondary
    };
  }

  /**
   * 타이포그래피 적용
   */
  private applyTypography(
    component: ComponentLine,
    visualIdentity: VisualIdentity,
    layoutMode: 'fixed' | 'scrollable'
  ): FontSpecification | undefined {
    if (component.type === 'image') return undefined;

    const baseSize = parseInt(visualIdentity.typography.baseSize.replace('pt', ''));
    const scaleFactor = layoutMode === 'fixed' ? 0.9 : 1.1;

    const fontConfigs = {
      heading: {
        family: visualIdentity.typography.headingFont,
        weight: component.variant?.includes('H1') ? 700 : 600,
        size: `${Math.round((component.variant?.includes('H1') ? baseSize * 1.8 : baseSize * 1.4) * scaleFactor)}px`,
        lineHeight: 1.2
      },
      paragraph: {
        family: visualIdentity.typography.bodyFont,
        weight: 400,
        size: `${Math.round(baseSize * scaleFactor)}px`,
        lineHeight: 1.6
      },
      card: {
        family: visualIdentity.typography.bodyFont,
        weight: 500,
        size: `${Math.round(baseSize * 0.95 * scaleFactor)}px`,
        lineHeight: 1.5
      }
    };

    return fontConfigs[component.type as keyof typeof fontConfigs] || fontConfigs.paragraph;
  }

  /**
   * 시각적 스타일 적용
   */
  private applyVisualStyle(
    component: ComponentLine,
    visualIdentity: VisualIdentity,
    layoutMode: 'fixed' | 'scrollable'
  ): VisualStyleSpecification {
    const borderRadius = layoutMode === 'fixed' ? 8 : 16;

    const visualConfigs = {
      heading: {
        borderRadius: 0,
        opacity: 1
      },
      paragraph: {
        borderRadius: 0,
        opacity: 1
      },
      card: {
        borderRadius: borderRadius,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        opacity: 1,
        border: {
          width: 1,
          style: 'solid' as const,
          color: visualIdentity.colorPalette.secondary
        }
      },
      image: {
        borderRadius: borderRadius,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        opacity: 1
      }
    };

    return visualConfigs[component.type as keyof typeof visualConfigs] || visualConfigs.paragraph;
  }

  /**
   * 컴포넌트 위치 계산 (섹션 내 상대 위치)
   */
  private calculateComponentPosition(
    component: ComponentLine,
    index: number,
    layoutMode: 'fixed' | 'scrollable'
  ): { x: number; y: number } {
    // 기본적으로는 섹션 내에서의 상대 위치
    // 실제 구현에서는 섹션 정보와 그리드 스팬을 고려해야 함

    const baseSpacing = layoutMode === 'fixed' ? 16 : 24;

    return {
      x: component.gridSpan === 'right' ? 740 : 0, // 8+4 그리드의 우측인 경우
      y: index * baseSpacing * 3 // 임시 계산
    };
  }

  /**
   * 컴포넌트 크기 계산
   */
  private calculateComponentDimensions(
    component: ComponentLine,
    layoutMode: 'fixed' | 'scrollable'
  ): { width: number; height: number | 'auto' } {
    // 기본 크기 설정 (실제로는 더 정교한 계산 필요)
    const baseWidth = component.gridSpan === 'right' ? 600 : 720; // 8+4 그리드 기준

    const dimensionConfigs = {
      heading: {
        width: baseWidth,
        height: 'auto' as const
      },
      paragraph: {
        width: baseWidth,
        height: 'auto' as const
      },
      card: {
        width: baseWidth,
        height: layoutMode === 'fixed' ? 120 : 150
      },
      image: {
        width: component.width || 520,
        height: component.height || 320
      }
    };

    return dimensionConfigs[component.type as keyof typeof dimensionConfigs] || dimensionConfigs.paragraph;
  }

  /**
   * 상태별 스타일 생성 (hover, focus 등)
   */
  private generateStateStyles(
    component: ComponentLine,
    visualIdentity: VisualIdentity
  ): { hover?: any; focus?: any; active?: any } | undefined {
    if (component.type === 'image') {
      return {
        hover: {
          visual: {
            opacity: 0.9,
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
          }
        }
      };
    }

    if (component.type === 'card') {
      return {
        hover: {
          visual: {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          },
          colors: {
            background: visualIdentity.colorPalette.secondary
          }
        }
      };
    }

    return undefined;
  }

  /**
   * z-index 계산
   */
  private calculateZIndex(type: string): number {
    const zIndexMap = {
      image: 10,
      card: 20,
      paragraph: 30,
      heading: 40
    };

    return zIndexMap[type as keyof typeof zIndexMap] || 1;
  }

  /**
   * display 타입 결정
   */
  private getDisplayType(type: string): 'block' | 'inline' | 'inline-block' | 'flex' | 'none' {
    const displayMap = {
      heading: 'block' as const,
      paragraph: 'block' as const,
      card: 'block' as const,
      image: 'block' as const
    };

    return displayMap[type as keyof typeof displayMap] || 'block';
  }
}