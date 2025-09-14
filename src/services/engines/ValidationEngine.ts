import {
  Step4DesignResult,
  Step4PageResult,
  ValidationResult,
  ComponentStyleSpecification
} from '../../types/step4.types';

/**
 * Step4 검증 엔진
 *
 * 생성된 디자인 명세의 유효성, 구현 가능성, 품질을 검증합니다.
 * 99%+ 파싱 성공률을 보장하기 위한 다양한 검증 규칙을 적용합니다.
 */
export class ValidationEngine {
  /**
   * Step4 전체 결과 검증
   * @param step4Result 검증할 Step4 결과
   * @returns 검증 결과
   */
  validate(step4Result: Step4DesignResult): ValidationResult {
    console.log('✅ ValidationEngine: Step4 결과 검증 시작');

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 필수 요소 검증
    this.validateRequiredElements(step4Result, errors);

    // 2. 레이아웃 제약 검증
    this.validateLayoutConstraints(step4Result, errors, warnings);

    // 3. CSS 속성값 유효성 검증
    this.validateCSSProperties(step4Result, errors, warnings);

    // 4. 구현 가능성 검증
    this.validateImplementability(step4Result, warnings);

    // 5. 접근성 검증
    this.validateAccessibility(step4Result, warnings);

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateQualityScore(step4Result, errors, warnings),
      checks: {
        layoutConstraints: !errors.some(e => e.includes('레이아웃') || e.includes('높이')),
        cssProperties: !errors.some(e => e.includes('CSS') || e.includes('색상') || e.includes('폰트')),
        implementability: !errors.some(e => e.includes('구현') || e.includes('겹침')),
        accessibility: !warnings.some(w => w.includes('접근성') || w.includes('색상 대비'))
      }
    };

    console.log('✅ ValidationEngine: 검증 완료', {
      isValid: result.isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      score: result.score
    });

    return result;
  }

  /**
   * 개별 페이지 검증
   * @param pageResult 검증할 페이지 결과
   * @param layoutMode 레이아웃 모드
   * @returns 페이지별 검증 결과
   */
  validatePage(pageResult: Step4PageResult, layoutMode: 'fixed' | 'scrollable'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 페이지별 기본 검증
    if (!pageResult.layout) {
      errors.push(`페이지 ${pageResult.pageNumber}: 레이아웃 정보 누락`);
    }

    if (pageResult.componentStyles.length === 0) {
      warnings.push(`페이지 ${pageResult.pageNumber}: 컴포넌트 스타일이 없음`);
    }

    // Fixed 모드 높이 제한 검증
    if (layoutMode === 'fixed' && pageResult.layout) {
      const totalHeight = this.calculatePageHeight(pageResult);
      if (totalHeight > 1000) {
        errors.push(`페이지 ${pageResult.pageNumber}: 높이 ${totalHeight}px가 1000px 제한 초과`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20),
      checks: {
        layoutConstraints: errors.length === 0,
        cssProperties: true,
        implementability: true,
        accessibility: warnings.length === 0
      }
    };
  }

  // =============================================================================
  // Private Validation Methods
  // =============================================================================

  /**
   * 필수 요소 검증
   */
  private validateRequiredElements(result: Step4DesignResult, errors: string[]): void {
    if (!result.pages || result.pages.length === 0) {
      errors.push('페이지 데이터가 없습니다');
      return;
    }

    result.pages.forEach((page, index) => {
      if (!page.pageId) {
        errors.push(`페이지 ${index + 1}: pageId 누락`);
      }

      if (!page.layout) {
        errors.push(`페이지 ${index + 1}: 레이아웃 명세 누락`);
      }

      if (!Array.isArray(page.componentStyles)) {
        errors.push(`페이지 ${index + 1}: componentStyles가 배열이 아님`);
      }

      if (!Array.isArray(page.imagePlacements)) {
        errors.push(`페이지 ${index + 1}: imagePlacements가 배열이 아님`);
      }
    });
  }

  /**
   * 레이아웃 제약 검증
   */
  private validateLayoutConstraints(
    result: Step4DesignResult,
    errors: string[],
    warnings: string[]
  ): void {
    result.pages.forEach((page) => {
      if (!page.layout) return;

      // Fixed 모드 높이 제한 검증
      if (result.layoutMode === 'fixed') {
        const totalHeight = this.calculatePageHeight(page);
        if (totalHeight > 1000) {
          errors.push(`페이지 ${page.pageNumber}: 높이 ${totalHeight}px가 1000px 제한 초과`);
        } else if (totalHeight > 950) {
          warnings.push(`페이지 ${page.pageNumber}: 높이 ${totalHeight}px가 1000px에 근접`);
        }
      }

      // 컴포넌트 겹침 검증
      const overlaps = this.detectComponentOverlaps(page.componentStyles);
      if (overlaps.length > 0) {
        warnings.push(`페이지 ${page.pageNumber}: ${overlaps.length}개 컴포넌트 겹침 감지`);
      }

      // 페이지 너비 검증
      if (page.layout.pageWidth !== 1600) {
        errors.push(`페이지 ${page.pageNumber}: 페이지 너비가 1600px이 아님 (${page.layout.pageWidth}px)`);
      }
    });
  }

  /**
   * CSS 속성값 유효성 검증
   */
  private validateCSSProperties(
    result: Step4DesignResult,
    errors: string[],
    warnings: string[]
  ): void {
    result.pages.forEach((page) => {
      page.componentStyles.forEach((comp) => {
        // 색상 값 검증
        if (comp.colors.text && !this.isValidColor(comp.colors.text)) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 텍스트 색상 ${comp.colors.text}`);
        }

        if (comp.colors.background && !this.isValidColor(comp.colors.background)) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 배경색 ${comp.colors.background}`);
        }

        // 크기 값 검증
        if (comp.dimensions.width <= 0) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 너비 ${comp.dimensions.width}`);
        }

        if (comp.dimensions.height !== 'auto' && comp.dimensions.height <= 0) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 높이 ${comp.dimensions.height}`);
        }

        // 폰트 크기 검증
        if (comp.font && !this.isValidFontSize(comp.font.size)) {
          warnings.push(`컴포넌트 ${comp.id}: 권장하지 않는 폰트 크기 ${comp.font.size}`);
        }

        // 위치 검증 (음수 불가)
        if (comp.position.x < 0 || comp.position.y < 0) {
          errors.push(`컴포넌트 ${comp.id}: 음수 위치 값 (x:${comp.position.x}, y:${comp.position.y})`);
        }
      });
    });
  }

  /**
   * 구현 가능성 검증
   */
  private validateImplementability(result: Step4DesignResult, warnings: string[]): void {
    result.pages.forEach((page) => {
      // 컴포넌트 수 검증
      const componentCount = page.componentStyles.length;
      if (result.layoutMode === 'fixed' && componentCount > 7) {
        warnings.push(`페이지 ${page.pageNumber}: Fixed 모드에서 컴포넌트 수 ${componentCount}개는 과다할 수 있음`);
      }

      // 이미지 수 검증
      const imageCount = page.imagePlacements.length;
      if (imageCount > 3) {
        warnings.push(`페이지 ${page.pageNumber}: 이미지 수 ${imageCount}개는 성능에 영향을 줄 수 있음`);
      }

      // z-index 중복 검증
      const zIndexes = page.componentStyles.map(comp => comp.zIndex);
      const duplicates = zIndexes.filter((item, index) => zIndexes.indexOf(item) !== index);
      if (duplicates.length > 0) {
        warnings.push(`페이지 ${page.pageNumber}: 중복된 z-index 값 발견`);
      }
    });
  }

  /**
   * 접근성 검증
   */
  private validateAccessibility(result: Step4DesignResult, warnings: string[]): void {
    result.pages.forEach((page) => {
      page.componentStyles.forEach((comp) => {
        // 색상 대비 검증 (간단한 버전)
        if (comp.colors.text && comp.colors.background) {
          if (!this.hasGoodColorContrast(comp.colors.text, comp.colors.background)) {
            warnings.push(`컴포넌트 ${comp.id}: 색상 대비가 접근성 기준을 충족하지 않을 수 있음`);
          }
        }

        // 폰트 크기 최소값 검증
        if (comp.font) {
          const fontSize = parseInt(comp.font.size);
          if (fontSize < 14) {
            warnings.push(`컴포넌트 ${comp.id}: 폰트 크기 ${fontSize}px가 접근성 최소값보다 작음`);
          }
        }
      });

      // 이미지 alt 텍스트 검증
      page.imagePlacements.forEach((img) => {
        if (!img.alt || img.alt.trim().length === 0) {
          warnings.push(`이미지 ${img.id}: alt 텍스트 누락`);
        }
      });
    });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * 페이지 총 높이 계산
   */
  private calculatePageHeight(page: Step4PageResult): number {
    if (!page.layout || !page.layout.sections) return 0;

    let totalHeight = page.layout.safeArea.top;

    page.layout.sections.forEach((section) => {
      const sectionHeight = section.dimensions.height === 'auto' ? 200 : section.dimensions.height;
      totalHeight += sectionHeight + section.marginBottom;
    });

    return totalHeight;
  }

  /**
   * 컴포넌트 겹침 감지
   */
  private detectComponentOverlaps(components: ComponentStyleSpecification[]): string[] {
    const overlaps: string[] = [];

    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i];
        const comp2 = components[j];

        // 같은 섹션 내에서만 겹침 검사
        if (comp1.section === comp2.section) {
          if (this.isOverlapping(comp1, comp2)) {
            overlaps.push(`${comp1.id}-${comp2.id}`);
          }
        }
      }
    }

    return overlaps;
  }

  /**
   * 두 컴포넌트의 겹침 여부 확인
   */
  private isOverlapping(comp1: ComponentStyleSpecification, comp2: ComponentStyleSpecification): boolean {
    const x1 = comp1.position.x;
    const y1 = comp1.position.y;
    const w1 = comp1.dimensions.width;
    const h1 = comp1.dimensions.height === 'auto' ? 50 : comp1.dimensions.height;

    const x2 = comp2.position.x;
    const y2 = comp2.position.y;
    const w2 = comp2.dimensions.width;
    const h2 = comp2.dimensions.height === 'auto' ? 50 : comp2.dimensions.height;

    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }

  /**
   * 색상 값 유효성 검증
   */
  private isValidColor(color: string): boolean {
    if (!color) return false;

    // HEX 색상 검증
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return /^[0-9A-Fa-f]{6}$/.test(hex) || /^[0-9A-Fa-f]{3}$/.test(hex);
    }

    // RGB, RGBA 검증
    if (color.startsWith('rgb')) {
      return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color);
    }

    // 기본 색상명 검증
    const colorNames = ['transparent', 'white', 'black', 'red', 'green', 'blue'];
    return colorNames.includes(color.toLowerCase());
  }

  /**
   * 폰트 크기 유효성 검증
   */
  private isValidFontSize(fontSize: string): boolean {
    if (!fontSize.endsWith('px')) return false;

    const size = parseInt(fontSize);
    return size >= 12 && size <= 72; // 권장 범위
  }

  /**
   * 색상 대비 검증 (간단한 버전)
   */
  private hasGoodColorContrast(textColor: string, backgroundColor: string): boolean {
    // 실제로는 더 정교한 WCAG 대비 계산이 필요
    // 여기서는 기본적인 체크만 수행

    if (backgroundColor === 'transparent') return true;

    // 기본적인 조합들 검증
    const goodCombinations = [
      { text: '#000000', bg: '#ffffff' },
      { text: '#ffffff', bg: '#000000' },
      { text: '#1e293b', bg: '#ffffff' },
      { text: '#ffffff', bg: '#1e293b' }
    ];

    return goodCombinations.some(combo =>
      combo.text.toLowerCase() === textColor.toLowerCase() &&
      combo.bg.toLowerCase() === backgroundColor.toLowerCase()
    );
  }

  /**
   * 품질 점수 계산
   */
  private calculateQualityScore(
    result: Step4DesignResult,
    errors: string[],
    warnings: string[]
  ): number {
    let score = 100;

    // 오류 페널티
    score -= errors.length * 15;

    // 경고 페널티
    score -= warnings.length * 5;

    // 완성도 보너스
    const completedPages = result.pages.filter(p => p.isComplete).length;
    const completionRate = completedPages / result.pages.length;
    score *= completionRate;

    return Math.max(0, Math.round(score));
  }
}