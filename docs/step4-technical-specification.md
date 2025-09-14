# Step4 기술 명세서

## 🏗️ 아키텍처 상세 설계

### 핵심 서비스 클래스

```typescript
// Step4DesignSpecificationService.ts
export class Step4DesignSpecificationService {
  constructor(private openAIService: OpenAIService) {}

  /**
   * Step3 결과를 받아 정밀한 디자인 명세 생성
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param step3Result Step3 통합 디자인 결과
   * @returns 구현 가능한 디자인 명세
   */
  async generateDesignSpecification(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    step3Result: Step3IntegratedResult
  ): Promise<Step4DesignResult>

  // 페이지별 순차 처리 (병렬 불필요)
  private async processPage(pageData: Step3PageData): Promise<Step4PageResult>

  // 레이아웃 정밀화
  private refinePageLayout(pageData: Step3PageData, layoutMode: LayoutMode): LayoutSpecification

  // 컴포넌트 스타일 구체화
  private specifyComponentStyles(components: ComponentLine[], designTokens: DesignTokens): ComponentStyleSpecification[]

  // 이미지 배치 최적화
  private optimizeImagePlacement(images: ImageLine[], sections: Step3Section[]): ImagePlacementSpecification[]

  // 교육적 상호작용 설계
  private designEducationalInteractions(pageData: Step3PageData, layoutMode: LayoutMode): InteractionSpecification[]
}
```

### 타입 시스템

```typescript
// step4.types.ts
export interface Step4DesignResult {
  layoutMode: 'fixed' | 'scrollable';
  pages: Step4PageResult[];
  globalFeatures: GlobalFeature[];
  generatedAt: Date;
}

export interface Step4PageResult {
  pageId: string;
  pageTitle: string;
  pageNumber: number;

  // 레이아웃 명세
  layout: LayoutSpecification;

  // 컴포넌트별 상세 스타일
  componentStyles: ComponentStyleSpecification[];

  // 이미지 배치 명세
  imagePlacements: ImagePlacementSpecification[];

  // 상호작용 및 애니메이션
  interactions: InteractionSpecification[];

  // 교육적 기능
  educationalFeatures: EducationalFeature[];

  generatedAt: Date;
}

export interface LayoutSpecification {
  pageWidth: number; // 1600px 고정
  pageHeight: number | 'auto'; // Fixed: 1000px, Scrollable: auto
  sections: SectionSpecification[];
}

export interface SectionSpecification {
  id: string;
  gridType: '1-12' | '8+4' | '2-11' | '3-10';
  position: { x: number; y: number };
  dimensions: { width: number; height: number | 'auto' };
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor: string;
  gap: number;
}

export interface ComponentStyleSpecification {
  id: string;
  type: 'heading' | 'paragraph' | 'card' | 'image';
  section: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number | 'auto' };

  // 타이포그래피
  font?: {
    family: string;
    weight: number;
    size: string; // "32px"
    lineHeight: number; // 1.6
  };

  // 색상
  colors: {
    text: string;
    background: string;
    border?: string;
  };

  // 시각적 스타일
  visual: {
    borderRadius?: number;
    boxShadow?: string;
    opacity?: number;
  };

  // 상태별 스타일
  states?: {
    hover?: Partial<ComponentStyleSpecification>;
    focus?: Partial<ComponentStyleSpecification>;
    active?: Partial<ComponentStyleSpecification>;
  };
}

export interface ImagePlacementSpecification {
  id: string;
  filename: string;
  section: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };

  // 이미지 스타일링
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  boxShadow?: string;

  // 로딩 최적화
  loading: 'lazy' | 'eager';
  priority: 'high' | 'normal' | 'low';
}

export interface InteractionSpecification {
  id: string;
  target: string; // 컴포넌트 ID
  trigger: 'scroll' | 'hover' | 'click' | 'focus' | 'load';
  effect: 'fadeIn' | 'fadeOut' | 'slideIn' | 'scale' | 'rotate' | 'highlight';

  // 애니메이션 속성
  duration: string; // "0.6s"
  delay?: string; // "0.2s"
  easing?: string; // "ease-in-out"

  // 효과별 파라미터
  parameters?: {
    scale?: number; // 1.05
    rotation?: number; // 90deg
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number; // 20px
  };

  // 조건부 실행
  conditions?: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    scrollPosition?: number; // 페이지 내 위치 %
    userInteraction?: boolean;
  };
}

export interface EducationalFeature {
  type: 'progressBar' | 'scrollIndicator' | 'focusGuide' | 'stepNavigation';
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  dimensions?: { width: number; height: number };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
  behavior: {
    autoUpdate: boolean;
    userControl: boolean;
    persistence: boolean;
  };
}

export interface GlobalFeature {
  type: 'accessibility' | 'performance' | 'seo';
  specifications: Record<string, any>;
}
```

### 라인 기반 출력 포맷 상세

```
BEGIN_S4
VERSION=design.v1
LAYOUT_MODE=fixed|scrollable

# 페이지 정보
PAGE, pageId=page1, title="페이지 제목", width=1600, height=1000|auto

# 섹션별 정밀 레이아웃 (픽셀 단위)
SECTION, id=secA, grid=1-12, x=100, y=80, width=1400, height=120, padding=40_80_40_80, bg=transparent, gap=24
SECTION, id=secB, grid=8+4, x=100, y=224, width=1400, height=auto, padding=32_80_32_80, bg=#F8FAFC, gap=32

# 컴포넌트 상세 스타일 명세
COMP, id=comp1, type=heading, section=secA, x=0, y=0, width=800, height=60, font=Pretendard_700_32px, color=#1E293B, bg=transparent, radius=0, shadow=none
COMP, id=comp2, type=paragraph, section=secB, x=0, y=0, width=720, height=auto, font=NotoSansKR_400_18px, color=#475569, lineHeight=1.6

# 이미지 정확한 배치
IMG, id=img1, filename=1.png, section=secB, x=740, y=0, width=600, height=400, objectFit=cover, radius=16, shadow=0_4px_8px_rgba(0,0,0,0.1), loading=lazy

# 상호작용 및 애니메이션
INTERACTION, target=comp1, trigger=scroll, effect=fadeIn, duration=0.6s, delay=0.2s, easing=ease-out
INTERACTION, target=img1, trigger=hover, effect=scale, value=1.05, duration=0.3s

# 교육적 기능
FEATURE, type=progressBar, position=top, width=1600, height=4, primaryColor=#3B82F6, bg=#E2E8F0, autoUpdate=true
FEATURE, type=scrollIndicator, position=right, width=8, height=auto, primaryColor=#64748B, userControl=false

# 접근성 설정
ACCESSIBILITY, focusVisible=true, keyboardNav=true, screenReader=true, colorContrast=AAA
END_S4
```

---

## 🎯 핵심 알고리즘

### 1. 레이아웃 정밀화 알고리즘

```typescript
class LayoutRefinementEngine {
  refineLayout(step3Sections: Step3Section[], layoutMode: LayoutMode): SectionSpecification[] {
    const safeArea = layoutMode === 'fixed'
      ? { top: 80, right: 100, bottom: 120, left: 100 }
      : { top: 80, right: 100, bottom: 120, left: 100 };

    const contentWidth = 1600 - safeArea.left - safeArea.right; // 1400px
    let currentY = safeArea.top;

    return step3Sections.map(section => {
      const spec = this.calculateSectionDimensions(section, contentWidth, currentY);
      currentY += spec.dimensions.height + (section.gapBelow || 48);
      return spec;
    });
  }

  private calculateSectionDimensions(section: Step3Section, contentWidth: number, y: number): SectionSpecification {
    const gridConfig = this.parseGridConfig(section.grid);
    const height = this.calculateSectionHeight(section, layoutMode);

    return {
      id: section.id,
      gridType: section.grid,
      position: { x: 100, y }, // safeArea.left
      dimensions: { width: contentWidth, height },
      padding: this.calculatePadding(section.grid, layoutMode),
      backgroundColor: section.background || 'transparent',
      gap: gridConfig.gap
    };
  }
}
```

### 2. 스타일 구체화 엔진

```typescript
class StyleSpecificationEngine {
  specifyComponentStyles(
    components: ComponentLine[],
    designTokens: DesignTokens,
    visualIdentity: VisualIdentity
  ): ComponentStyleSpecification[] {
    return components.map(comp => {
      const baseStyle = this.getBaseStyle(comp.type, designTokens);
      const colorScheme = this.applyColorScheme(baseStyle, visualIdentity);
      const responsiveStyle = this.applyResponsiveRules(colorScheme, layoutMode);

      return {
        ...responsiveStyle,
        id: comp.id,
        type: comp.type,
        section: comp.section,
        position: this.calculateComponentPosition(comp, sectionSpec),
        dimensions: this.calculateComponentDimensions(comp, sectionSpec)
      };
    });
  }

  private getBaseStyle(type: ComponentType, tokens: DesignTokens): BaseStyle {
    const styleMap = {
      heading: {
        font: { family: tokens.typography.headingFont, weight: 700 },
        spacing: { margin: tokens.spacing.lg, padding: tokens.spacing.sm }
      },
      paragraph: {
        font: { family: tokens.typography.bodyFont, weight: 400 },
        spacing: { margin: tokens.spacing.md, padding: 0 }
      },
      // ... 기타 타입별 기본 스타일
    };
    return styleMap[type];
  }
}
```

### 3. 교육적 상호작용 설계 엔진

```typescript
class InteractionDesignEngine {
  designEducationalInteractions(
    pageData: Step3PageData,
    layoutMode: LayoutMode
  ): InteractionSpecification[] {
    const interactions: InteractionSpecification[] = [];

    // 1. 진입 애니메이션 (학습 몰입도 향상)
    interactions.push(...this.createEntryAnimations(pageData.components));

    // 2. 스크롤 기반 인터랙션 (진도 시각화)
    if (layoutMode === 'scrollable') {
      interactions.push(...this.createScrollInteractions(pageData));
    }

    // 3. 포커스 가이드 (주의집중)
    interactions.push(...this.createFocusGuides(pageData.components));

    // 4. 교육적 피드백 (이해도 확인)
    interactions.push(...this.createEducationalFeedbacks(pageData));

    return interactions;
  }

  private createEntryAnimations(components: ComponentLine[]): InteractionSpecification[] {
    return components.map((comp, index) => ({
      id: `entry_${comp.id}`,
      target: comp.id,
      trigger: 'load',
      effect: 'fadeIn',
      duration: '0.6s',
      delay: `${index * 0.1}s`, // 순차적 등장
      easing: 'ease-out'
    }));
  }

  private createScrollInteractions(pageData: Step3PageData): InteractionSpecification[] {
    // 스크롤 위치에 따른 컴포넌트별 등장 효과
    return pageData.components
      .filter(comp => comp.type !== 'image') // 이미지는 별도 처리
      .map((comp, index) => ({
        id: `scroll_${comp.id}`,
        target: comp.id,
        trigger: 'scroll',
        effect: 'slideIn',
        parameters: { direction: 'up', distance: 30 },
        duration: '0.8s',
        conditions: { scrollPosition: (index + 1) * 20 } // 20%씩 차이
      }));
  }
}
```

---

## 🔍 품질 보증 시스템

### 검증 규칙

```typescript
class Step4ValidationEngine {
  validate(step4Result: Step4DesignResult): ValidationResult {
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

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateQualityScore(step4Result, errors, warnings)
    };
  }

  private validateLayoutConstraints(result: Step4DesignResult, errors: string[], warnings: string[]): void {
    result.pages.forEach(page => {
      if (result.layoutMode === 'fixed') {
        // Fixed 모드: 1000px 높이 제한 검증
        const totalHeight = this.calculateTotalPageHeight(page);
        if (totalHeight > 1000) {
          errors.push(`페이지 ${page.pageNumber}: 높이 ${totalHeight}px가 1000px 제한 초과`);
        }
      }

      // 컴포넌트 겹침 검증
      const overlaps = this.detectComponentOverlaps(page.componentStyles);
      if (overlaps.length > 0) {
        warnings.push(`페이지 ${page.pageNumber}: ${overlaps.length}개 컴포넌트 겹침 감지`);
      }
    });
  }

  private validateCSSProperties(result: Step4DesignResult, errors: string[], warnings: string[]): void {
    result.pages.forEach(page => {
      page.componentStyles.forEach(comp => {
        // 색상 값 검증
        if (!this.isValidColor(comp.colors.text)) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 텍스트 색상 ${comp.colors.text}`);
        }

        // 크기 값 검증
        if (comp.dimensions.width <= 0) {
          errors.push(`컴포넌트 ${comp.id}: 유효하지 않은 너비 ${comp.dimensions.width}`);
        }

        // 폰트 크기 검증
        if (comp.font && !this.isValidFontSize(comp.font.size)) {
          warnings.push(`컴포넌트 ${comp.id}: 권장하지 않는 폰트 크기 ${comp.font.size}`);
        }
      });
    });
  }
}
```

---

## 📈 성능 최적화 전략

### 1. 메모리 관리
- 페이지별 독립 처리로 메모리 사용량 분산
- 불필요한 중간 데이터 구조 최소화
- 가비지 컬렉션 친화적 객체 생성 패턴

### 2. API 호출 최적화
- 페이지별 순차 처리 (병렬 처리 대비 안정성 우선)
- 재시도 로직 (최대 3회, 지수 백오프)
- 타임아웃 설정 (페이지당 30초)

### 3. UI 반응성
- 스트리밍 방식 결과 표시
- 부분 완료 상태 시각화
- 백그라운드 처리 중 다른 페이지 탐색 허용

---

*이 기술 명세서는 Step4 구현을 위한 상세한 기술적 가이드라인을 제공합니다. 실제 구현 시 이 명세를 기반으로 코드를 작성하되, 필요에 따라 구현 중 발견되는 요구사항을 반영하여 업데이트해야 합니다.*