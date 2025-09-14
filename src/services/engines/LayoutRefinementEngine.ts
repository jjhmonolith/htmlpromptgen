import {
  LayoutSpecification,
  SectionSpecification,
  Position,
  Dimensions,
  Padding
} from '../../types/step4.types';
import { Step3Section } from '../../types/workflow.types';

/**
 * 레이아웃 정밀화 엔진
 *
 * Step3의 추상적인 섹션 정의를 실제 픽셀 단위의 정밀한 레이아웃 명세로 변환합니다.
 * Fixed/Scrollable 모드에 따른 제약사항을 적용하여 구현 가능한 레이아웃을 생성합니다.
 */
export class LayoutRefinementEngine {
  /**
   * Step3 섹션들을 정밀한 레이아웃 명세로 변환
   * @param step3Sections Step3에서 생성된 섹션들
   * @param layoutMode 레이아웃 모드
   * @returns 픽셀 단위 정밀 레이아웃 명세
   */
  refineLayout(
    step3Sections: Step3Section[],
    layoutMode: 'fixed' | 'scrollable'
  ): LayoutSpecification {
    console.log('🏗️ LayoutRefinementEngine: 레이아웃 정밀화 시작', {
      sectionsCount: step3Sections.length,
      layoutMode
    });

    const safeArea = this.getSafeArea();
    const contentWidth = 1600 - safeArea.left - safeArea.right; // 1400px

    const sections = this.processSections(step3Sections, contentWidth, safeArea, layoutMode);

    const specification: LayoutSpecification = {
      pageWidth: 1600,
      pageHeight: layoutMode === 'fixed' ? 1000 : 'auto',
      sections,
      backgroundColor: '#FFFFFF',
      safeArea
    };

    console.log('✅ LayoutRefinementEngine: 레이아웃 정밀화 완료', {
      totalHeight: this.calculateTotalHeight(sections),
      sectionsProcessed: sections.length
    });

    return specification;
  }

  /**
   * 섹션들을 순차적으로 처리하여 정밀한 위치와 크기 계산
   */
  private processSections(
    step3Sections: Step3Section[],
    contentWidth: number,
    safeArea: { top: number; right: number; bottom: number; left: number },
    layoutMode: 'fixed' | 'scrollable'
  ): SectionSpecification[] {
    const sections: SectionSpecification[] = [];
    let currentY = safeArea.top;

    for (const section of step3Sections) {
      const spec = this.processSingleSection(
        section,
        contentWidth,
        currentY,
        safeArea.left,
        layoutMode
      );

      sections.push(spec);

      // 다음 섹션의 Y 위치 계산
      currentY += (spec.dimensions.height === 'auto' ? 200 : spec.dimensions.height) + spec.marginBottom;
    }

    return sections;
  }

  /**
   * 개별 섹션 처리
   */
  private processSingleSection(
    section: Step3Section,
    contentWidth: number,
    yPosition: number,
    xOffset: number,
    layoutMode: 'fixed' | 'scrollable'
  ): SectionSpecification {
    const gridConfig = this.parseGridConfig(section.grid);
    const dimensions = this.calculateSectionDimensions(section, contentWidth, layoutMode);
    const padding = this.calculateSectionPadding(section.grid, layoutMode);

    return {
      id: section.id,
      gridType: section.grid,
      position: { x: xOffset, y: yPosition },
      dimensions,
      padding,
      backgroundColor: this.getSectionBackgroundColor(section),
      gap: gridConfig.gap,
      marginBottom: section.gapBelow || this.getDefaultGap(layoutMode)
    };
  }

  /**
   * 그리드 설정 파싱
   */
  private parseGridConfig(grid: string): { columns: number; gap: number } {
    const gridConfigs = {
      '1-12': { columns: 12, gap: 24 },
      '8+4': { columns: 2, gap: 32 }, // 8칼럼 + 4칼럼 분할
      '2-11': { columns: 10, gap: 24 }, // 양쪽 여백 포함
      '3-10': { columns: 8, gap: 24 }   // 중앙 집중
    };

    return gridConfigs[grid as keyof typeof gridConfigs] || gridConfigs['1-12'];
  }

  /**
   * 섹션 크기 계산
   */
  private calculateSectionDimensions(
    section: Step3Section,
    contentWidth: number,
    layoutMode: 'fixed' | 'scrollable'
  ): Dimensions {
    const baseHeight = this.getBaseHeight(section.role, layoutMode);

    // height가 'auto'가 아닌 경우 파싱 시도
    let height: number | 'auto' = 'auto';
    if (section.height !== 'auto') {
      const parsed = parseInt(section.height);
      if (!isNaN(parsed) && parsed > 0) {
        height = parsed;
      } else {
        height = baseHeight;
      }
    }

    return {
      width: contentWidth, // 항상 컨텐츠 전체 너비 사용
      height
    };
  }

  /**
   * 섹션 여백 계산
   */
  private calculateSectionPadding(
    grid: string,
    layoutMode: 'fixed' | 'scrollable'
  ): Padding {
    const paddingConfigs = {
      fixed: {
        '1-12': { top: 32, right: 40, bottom: 32, left: 40 },
        '8+4': { top: 40, right: 32, bottom: 40, left: 32 },
        '2-11': { top: 32, right: 40, bottom: 32, left: 40 },
        '3-10': { top: 40, right: 60, bottom: 40, left: 60 }
      },
      scrollable: {
        '1-12': { top: 48, right: 80, bottom: 48, left: 80 },
        '8+4': { top: 56, right: 40, bottom: 56, left: 40 },
        '2-11': { top: 40, right: 60, bottom: 40, left: 60 },
        '3-10': { top: 56, right: 80, bottom: 56, left: 80 }
      }
    };

    const config = paddingConfigs[layoutMode];
    return config[grid as keyof typeof config] || config['1-12'];
  }

  /**
   * 섹션별 기본 높이 계산
   */
  private getBaseHeight(role: string, layoutMode: 'fixed' | 'scrollable'): number {
    const heightConfigs = {
      fixed: {
        title: 100,
        content: 200
      },
      scrollable: {
        title: 120,
        content: 280
      }
    };

    const config = heightConfigs[layoutMode];
    return config[role as keyof typeof config] || config.content;
  }

  /**
   * 섹션 배경색 결정
   */
  private getSectionBackgroundColor(section: Step3Section): string {
    // 짝수/홀수 섹션에 따라 약간의 배경색 차이
    const sectionIndex = parseInt(section.id.replace(/\D/g, '')) || 0;
    return sectionIndex % 2 === 0 ? 'transparent' : '#FAFBFC';
  }

  /**
   * 안전 영역 반환
   */
  private getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    return { top: 80, right: 100, bottom: 120, left: 100 };
  }

  /**
   * 레이아웃 모드별 기본 간격
   */
  private getDefaultGap(layoutMode: 'fixed' | 'scrollable'): number {
    return layoutMode === 'fixed' ? 32 : 48;
  }

  /**
   * 전체 페이지 높이 계산 (Fixed 모드 검증용)
   */
  private calculateTotalHeight(sections: SectionSpecification[]): number {
    let totalHeight = 0;

    for (const section of sections) {
      const sectionHeight = section.dimensions.height === 'auto' ? 200 : section.dimensions.height;
      totalHeight += sectionHeight + section.marginBottom;
    }

    // 상단 안전 영역 추가
    totalHeight += 80;

    return totalHeight;
  }

  /**
   * Fixed 모드 높이 제한 검증
   */
  validateFixedModeHeight(sections: SectionSpecification[]): { isValid: boolean; totalHeight: number } {
    const totalHeight = this.calculateTotalHeight(sections);
    return {
      isValid: totalHeight <= 1000,
      totalHeight
    };
  }
}