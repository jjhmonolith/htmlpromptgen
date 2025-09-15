import {
  Step4PageResult,
  SectionSpecification,
  ComponentStyleSpecification
} from '../../types/step4.types';

/**
 * 자동 레이아웃 조정 엔진
 *
 * Fixed 모드에서 1000px 높이 초과 문제를 자동으로 해결합니다.
 * 사용자의 의도를 최대한 보존하면서 높이 제약을 준수합니다.
 */
export class AutoLayoutAdjustmentEngine {
  /**
   * 높이 초과 페이지를 자동으로 조정
   * @param page 조정할 페이지
   * @param targetHeight 목표 높이 (기본: 980px, 20px 여유)
   * @returns 조정된 페이지
   */
  adjustPageHeight(page: Step4PageResult, targetHeight: number = 980): Step4PageResult {
    if (!page.layout || !page.layout.sections) return page;

    const currentHeight = this.calculatePageHeight(page);
    if (currentHeight <= targetHeight) return page;

    console.log(`🔧 페이지 ${page.pageNumber} 자동 높이 조정: ${currentHeight}px → ${targetHeight}px`);

    const adjustedPage = JSON.parse(JSON.stringify(page)); // Deep copy
    const overflowAmount = currentHeight - targetHeight;

    // 조정 전략 적용
    this.applySectionCompression(adjustedPage, overflowAmount);
    this.applyMarginReduction(adjustedPage, overflowAmount);
    this.applyComponentOptimization(adjustedPage, overflowAmount);

    // 최종 검증
    const finalHeight = this.calculatePageHeight(adjustedPage);
    console.log(`✅ 조정 완료: ${finalHeight}px (${finalHeight <= 1000 ? '성공' : '실패'})`);

    return adjustedPage;
  }

  /**
   * 섹션 압축 전략
   * 각 섹션의 높이를 비례적으로 줄입니다
   */
  private applySectionCompression(page: Step4PageResult, overflowAmount: number): void {
    if (!page.layout?.sections) return;

    const totalSectionHeight = page.layout.sections.reduce((sum, section) => {
      return sum + (section.dimensions.height === 'auto' ? 200 : section.dimensions.height);
    }, 0);

    if (totalSectionHeight === 0) return;

    const compressionRatio = Math.min(0.3, overflowAmount / totalSectionHeight); // 최대 30% 압축

    page.layout.sections.forEach((section) => {
      if (section.dimensions.height !== 'auto') {
        const originalHeight = section.dimensions.height;
        const reduction = Math.floor(originalHeight * compressionRatio);
        section.dimensions.height = Math.max(80, originalHeight - reduction); // 최소 80px 보장

        console.log(`  📏 섹션 ${section.id}: ${originalHeight}px → ${section.dimensions.height}px`);
      }
    });
  }

  /**
   * 여백 최소화 전략
   * 섹션 간 여백을 줄입니다
   */
  private applyMarginReduction(page: Step4PageResult, overflowAmount: number): void {
    if (!page.layout?.sections) return;

    const currentHeight = this.calculatePageHeight(page);
    if (currentHeight <= 1000) return; // 이미 해결됨

    page.layout.sections.forEach((section, index) => {
      if (section.marginBottom > 16) { // 최소 16px 여백 보장
        const originalMargin = section.marginBottom;
        section.marginBottom = Math.max(16, Math.floor(section.marginBottom * 0.6)); // 40% 감소

        console.log(`  🔽 섹션 ${section.id} 여백: ${originalMargin}px → ${section.marginBottom}px`);
      }
    });
  }

  /**
   * 컴포넌트 최적화 전략
   * 폰트 크기와 여백을 조정합니다
   */
  private applyComponentOptimization(page: Step4PageResult, overflowAmount: number): void {
    const currentHeight = this.calculatePageHeight(page);
    if (currentHeight <= 1000) return; // 이미 해결됨

    // 폰트 크기 10% 감소 (Fixed 모드 최적화)
    page.componentStyles.forEach((comp) => {
      if (comp.font && comp.font.size) {
        const currentSize = parseInt(comp.font.size.replace('px', ''));
        const newSize = Math.max(12, Math.floor(currentSize * 0.9)); // 최소 12px
        comp.font.size = `${newSize}px`;

        console.log(`  📝 컴포넌트 ${comp.id} 폰트: ${currentSize}px → ${newSize}px`);
      }
    });
  }

  /**
   * 페이지 높이 계산 (ValidationEngine과 동일)
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
   * 조정 가능 여부 확인
   * @param page 확인할 페이지
   * @returns 조정 가능 여부와 예상 결과
   */
  canAdjustPage(page: Step4PageResult): {
    canAdjust: boolean;
    currentHeight: number;
    estimatedHeight: number;
    strategy: string[];
  } {
    const currentHeight = this.calculatePageHeight(page);

    if (currentHeight <= 1000) {
      return {
        canAdjust: false,
        currentHeight,
        estimatedHeight: currentHeight,
        strategy: ['조정 불필요']
      };
    }

    const overflowAmount = currentHeight - 980; // 20px 여유 확보
    const strategy: string[] = [];
    let estimatedReduction = 0;

    // 섹션 압축 예상 효과 (최대 30%)
    if (page.layout?.sections) {
      const sectionReduction = page.layout.sections.reduce((sum, section) => {
        const height = section.dimensions.height === 'auto' ? 200 : section.dimensions.height;
        return sum + Math.floor(height * 0.3);
      }, 0);

      estimatedReduction += Math.min(sectionReduction, overflowAmount * 0.5);
      strategy.push(`섹션 압축 (~${Math.floor(sectionReduction)}px)`);
    }

    // 여백 감소 예상 효과
    const marginReduction = (page.layout?.sections?.length || 0) * 20; // 섹션당 평균 20px 감소
    estimatedReduction += marginReduction;
    strategy.push(`여백 감소 (~${marginReduction}px)`);

    // 폰트 크기 감소 예상 효과
    const fontReduction = Math.floor(overflowAmount * 0.1); // 작은 효과
    estimatedReduction += fontReduction;
    strategy.push(`폰트 최적화 (~${fontReduction}px)`);

    const estimatedHeight = Math.max(600, currentHeight - estimatedReduction);

    return {
      canAdjust: estimatedHeight <= 1000,
      currentHeight,
      estimatedHeight,
      strategy
    };
  }
}