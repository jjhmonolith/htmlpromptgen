import {
  LayoutSpecification,
  SectionSpecification,
  ComponentStyleSpecification,
  ImagePlacementSpecification,
  InteractionSpecification,
  EducationalFeature,
  FontSpecification
} from '../../types/step4.types';

/**
 * Step4 라인 기반 파싱 엔진
 *
 * AI가 생성한 BEGIN_S4...END_S4 형식의 응답을
 * 구조화된 데이터로 변환합니다. 99%+ 파싱 성공률을 목표로 합니다.
 */
export class ParsingEngine {
  /**
   * Step4 AI 응답 파싱
   * @param content AI 응답 텍스트
   * @returns 파싱된 페이지 결과
   */
  parseStep4Response(content: string): {
    layout: LayoutSpecification;
    componentStyles: ComponentStyleSpecification[];
    imagePlacements: ImagePlacementSpecification[];
    interactions: InteractionSpecification[];
    educationalFeatures: EducationalFeature[];
  } {
    console.log('🔍 Step4 응답 파싱 시작');

    // BEGIN_S4...END_S4 추출
    const s4Block = this.extractS4Block(content);
    if (!s4Block) {
      throw new Error('BEGIN_S4...END_S4 블록을 찾을 수 없습니다');
    }

    // 라인별 Key-Value 파싱
    const keyValuePairs = this.parseKeyValueLines(s4Block);
    console.log(`📊 파싱된 Key-Value 쌍: ${Object.keys(keyValuePairs).length}개`);

    // 구조화된 데이터로 변환
    const layout = this.parseLayout(keyValuePairs);
    const componentStyles = this.parseComponentStyles(keyValuePairs);
    const imagePlacements = this.parseImagePlacements(keyValuePairs);
    const interactions = this.parseInteractions(keyValuePairs);
    const educationalFeatures = this.parseEducationalFeatures(keyValuePairs);

    console.log('✅ Step4 파싱 완료', {
      layoutSections: layout.sections.length,
      componentStyles: componentStyles.length,
      imagePlacements: imagePlacements.length,
      interactions: interactions.length,
      educationalFeatures: educationalFeatures.length
    });

    return {
      layout,
      componentStyles,
      imagePlacements,
      interactions,
      educationalFeatures
    };
  }

  /**
   * BEGIN_S4...END_S4 블록 추출 (markdown 코드 블록 대응)
   */
  private extractS4Block(content: string): string | null {
    // markdown 코드 블록 제거 (```plaintext, ```, etc.)
    let cleanContent = content
      .replace(/```[a-zA-Z]*\n?/g, '') // 시작 코드 블록 제거
      .replace(/```\n?/g, ''); // 끝 코드 블록 제거

    const beginMatch = cleanContent.match(/BEGIN_S4/);

    if (!beginMatch) {
      console.error('❌ BEGIN_S4 마커를 찾을 수 없습니다');
      console.log('🔍 원본 내용 (처음 500자):', content.substring(0, 500));
      console.log('🔍 정제된 내용 (처음 500자):', cleanContent.substring(0, 500));
      return null;
    }

    const endMatch = cleanContent.match(/END_S4/);
    const start = beginMatch.index! + 'BEGIN_S4'.length;

    let extractedBlock: string;

    if (!endMatch) {
      // END_S4가 없으면 BEGIN_S4 이후 모든 내용 사용 (응답이 잘렸을 가능성)
      console.warn('⚠️ END_S4 마커를 찾을 수 없습니다. BEGIN_S4 이후 모든 내용을 사용합니다.');
      extractedBlock = cleanContent.slice(start).trim();
    } else {
      // END_S4가 있으면 정상 처리
      const end = endMatch.index!;
      extractedBlock = cleanContent.slice(start, end).trim();
    }

    console.log('✅ Step4 블록 추출 성공, 블록 크기:', extractedBlock.length, '문자');
    console.log('🔍 추출된 블록 (처음 200자):', extractedBlock.substring(0, 200));
    return extractedBlock;
  }

  /**
   * 라인별 Key=Value 파싱
   */
  private parseKeyValueLines(content: string): Record<string, string> {
    const lines = content.split('\n').map(line => line.trim());
    const keyValuePairs: Record<string, string> = {};

    for (const line of lines) {
      // 주석 라인 건너뛰기
      if (line.startsWith('#') || line === '') continue;

      // Key=Value 형식 파싱
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) continue;

      const key = line.slice(0, equalIndex).trim();
      const value = line.slice(equalIndex + 1).trim();

      keyValuePairs[key] = value;
    }

    return keyValuePairs;
  }

  /**
   * 레이아웃 명세 파싱
   */
  private parseLayout(kv: Record<string, string>): LayoutSpecification {
    const sections = this.parseSections(kv);

    return {
      pageWidth: this.parseNumber(kv['LAYOUT_PAGE_WIDTH'], 1600),
      pageHeight: kv['LAYOUT_PAGE_HEIGHT'] === 'auto' ? 'auto' : this.parseNumber(kv['LAYOUT_PAGE_HEIGHT'], 1000),
      sections,
      backgroundColor: kv['LAYOUT_BG_COLOR'] || '#FFFFFF',
      safeArea: {
        top: this.parseNumber(kv['LAYOUT_SAFE_TOP'], 80),
        right: this.parseNumber(kv['LAYOUT_SAFE_RIGHT'], 100),
        bottom: this.parseNumber(kv['LAYOUT_SAFE_BOTTOM'], 120),
        left: this.parseNumber(kv['LAYOUT_SAFE_LEFT'], 100)
      }
    };
  }

  /**
   * 섹션들 파싱
   */
  private parseSections(kv: Record<string, string>): SectionSpecification[] {
    const sections: SectionSpecification[] = [];
    const sectionIds = this.findSectionIds(kv);

    for (const sectionNum of sectionIds) {
      const section: SectionSpecification = {
        id: kv[`SECTION_${sectionNum}_ID`] || `section${sectionNum}`,
        gridType: kv[`SECTION_${sectionNum}_GRID`] as any || '1-12',
        position: {
          x: this.parseNumber(kv[`SECTION_${sectionNum}_X`], 100),
          y: this.parseNumber(kv[`SECTION_${sectionNum}_Y`], 80)
        },
        dimensions: {
          width: this.parseNumber(kv[`SECTION_${sectionNum}_WIDTH`], 1400),
          height: kv[`SECTION_${sectionNum}_HEIGHT`] === 'auto' ? 'auto' : this.parseNumber(kv[`SECTION_${sectionNum}_HEIGHT`], 200)
        },
        padding: {
          top: this.parseNumber(kv[`SECTION_${sectionNum}_PADDING_TOP`], 32),
          right: this.parseNumber(kv[`SECTION_${sectionNum}_PADDING_RIGHT`], 40),
          bottom: this.parseNumber(kv[`SECTION_${sectionNum}_PADDING_BOTTOM`], 32),
          left: this.parseNumber(kv[`SECTION_${sectionNum}_PADDING_LEFT`], 40)
        },
        backgroundColor: kv[`SECTION_${sectionNum}_BG_COLOR`] || 'transparent',
        gap: this.parseNumber(kv[`SECTION_${sectionNum}_GAP`], 24),
        marginBottom: this.parseNumber(kv[`SECTION_${sectionNum}_MARGIN_BOTTOM`], 32)
      };

      sections.push(section);
    }

    return sections;
  }

  /**
   * 컴포넌트 스타일들 파싱
   */
  private parseComponentStyles(kv: Record<string, string>): ComponentStyleSpecification[] {
    const components: ComponentStyleSpecification[] = [];
    const componentIds = this.findComponentIds(kv);

    for (const compNum of componentIds) {
      const component: ComponentStyleSpecification = {
        id: kv[`COMP_${compNum}_ID`] || `comp${compNum}`,
        type: kv[`COMP_${compNum}_TYPE`] as any || 'paragraph',
        section: kv[`COMP_${compNum}_SECTION`] || 'section1',
        position: {
          x: this.parseNumber(kv[`COMP_${compNum}_X`], 100),
          y: this.parseNumber(kv[`COMP_${compNum}_Y`], 80)
        },
        dimensions: {
          width: this.parseNumber(kv[`COMP_${compNum}_WIDTH`], 720),
          height: kv[`COMP_${compNum}_HEIGHT`] === 'auto' ? 'auto' : this.parseNumber(kv[`COMP_${compNum}_HEIGHT`], 60)
        },
        font: this.parseComponentFont(kv, compNum),
        colors: {
          text: kv[`COMP_${compNum}_COLOR_TEXT`] || '#1E293B',
          background: kv[`COMP_${compNum}_COLOR_BG`] || 'transparent',
          border: kv[`COMP_${compNum}_COLOR_BORDER`] || '#E2E8F0'
        },
        visual: {
          borderRadius: this.parseNumber(kv[`COMP_${compNum}_BORDER_RADIUS`], 8),
          boxShadow: kv[`COMP_${compNum}_BOX_SHADOW`] || 'none',
          opacity: 1
        },
        zIndex: this.parseNumber(kv[`COMP_${compNum}_Z_INDEX`], 10),
        display: kv[`COMP_${compNum}_DISPLAY`] as any || 'block'
      };

      components.push(component);
    }

    return components;
  }

  /**
   * 이미지 배치들 파싱
   */
  private parseImagePlacements(kv: Record<string, string>): ImagePlacementSpecification[] {
    const images: ImagePlacementSpecification[] = [];
    const imageIds = this.findImageIds(kv);

    for (const imgNum of imageIds) {
      const image: ImagePlacementSpecification = {
        id: kv[`IMG_${imgNum}_ID`] || `img${imgNum}`,
        filename: kv[`IMG_${imgNum}_SRC`] || `${imgNum}.png`,
        section: kv[`IMG_${imgNum}_SECTION`] || 'section1',
        objectFit: kv[`IMG_${imgNum}_OBJECT_FIT`] as any || 'cover',
        loading: kv[`IMG_${imgNum}_LOADING`] as any || 'lazy',
        priority: kv[`IMG_${imgNum}_PRIORITY`] as any || 'normal',
        zIndex: this.parseNumber(kv[`IMG_${imgNum}_Z_INDEX`], 10),
        position: {
          x: this.parseNumber(kv[`IMG_${imgNum}_X`], 100),
          y: this.parseNumber(kv[`IMG_${imgNum}_Y`], 200)
        },
        dimensions: {
          width: this.parseNumber(kv[`IMG_${imgNum}_WIDTH`], 520),
          height: this.parseNumber(kv[`IMG_${imgNum}_HEIGHT`], 320)
        },
        alt: kv[`IMG_${imgNum}_ALT`] || '이미지 설명',
        borderRadius: this.parseNumber(kv[`IMG_${imgNum}_BORDER_RADIUS`], 8),
        boxShadow: kv[`IMG_${imgNum}_BOX_SHADOW`] || '0 4px 12px rgba(0, 0, 0, 0.15)'
      };

      images.push(image);
    }

    return images;
  }

  /**
   * 상호작용들 파싱
   */
  private parseInteractions(kv: Record<string, string>): InteractionSpecification[] {
    const interactions: InteractionSpecification[] = [];
    const interactionIds = this.findInteractionIds(kv);

    for (const intNum of interactionIds) {
      const interaction: InteractionSpecification = {
        id: `interaction${intNum}`,
        target: kv[`INTERACTION_${intNum}_TARGET`] || '',
        trigger: kv[`INTERACTION_${intNum}_TRIGGER`] as any || 'hover',
        effect: kv[`INTERACTION_${intNum}_EFFECT`] as any || 'fadeIn',
        duration: kv[`INTERACTION_${intNum}_DURATION`] || '200ms',
        parameters: {
          opacity: 0.8
        }
      };

      if (interaction.target) {
        interactions.push(interaction);
      }
    }

    return interactions;
  }

  /**
   * 교육적 기능들 파싱
   */
  private parseEducationalFeatures(kv: Record<string, string>): EducationalFeature[] {
    const features: EducationalFeature[] = [];
    const eduIds = this.findEducationalIds(kv);

    for (const eduNum of eduIds) {
      const feature: EducationalFeature = {
        id: `edu${eduNum}`,
        type: kv[`EDU_${eduNum}_TYPE`] as any || 'progressBar',
        position: kv[`EDU_${eduNum}_POSITION`] as any || 'top',
        styling: {
          primaryColor: kv[`EDU_${eduNum}_PRIMARY_COLOR`] || '#004D99',
          secondaryColor: kv[`EDU_${eduNum}_SECONDARY_COLOR`] || '#E9F4FF',
          backgroundColor: kv[`EDU_${eduNum}_BG_COLOR`] || '#FFFFFF',
          opacity: 1
        },
        behavior: {
          autoUpdate: true,
          userControl: false,
          persistence: false
        }
      };

      features.push(feature);
    }

    return features;
  }

  /**
   * 컴포넌트 폰트 정보 파싱
   */
  private parseComponentFont(kv: Record<string, string>, compNum: string): FontSpecification | undefined {
    const family = kv[`COMP_${compNum}_FONT_FAMILY`];
    const size = kv[`COMP_${compNum}_FONT_SIZE`];

    if (!family && !size) return undefined;

    return {
      family: family || 'SF Pro Text',
      size: size || '16px',
      weight: this.parseNumber(kv[`COMP_${compNum}_FONT_WEIGHT`], 400),
      lineHeight: this.parseNumber(kv[`COMP_${compNum}_LINE_HEIGHT`], 1.5)
    };
  }

  /**
   * 섹션 ID들 찾기
   */
  private findSectionIds(kv: Record<string, string>): string[] {
    const ids = new Set<string>();
    for (const key of Object.keys(kv)) {
      const match = key.match(/^SECTION_(\d+)_/);
      if (match) {
        ids.add(match[1]);
      }
    }
    return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 컴포넌트 ID들 찾기
   */
  private findComponentIds(kv: Record<string, string>): string[] {
    const ids = new Set<string>();
    for (const key of Object.keys(kv)) {
      const match = key.match(/^COMP_(\d+)_/);
      if (match) {
        ids.add(match[1]);
      }
    }
    return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 이미지 ID들 찾기
   */
  private findImageIds(kv: Record<string, string>): string[] {
    const ids = new Set<string>();
    for (const key of Object.keys(kv)) {
      const match = key.match(/^IMG_(\d+)_/);
      if (match) {
        ids.add(match[1]);
      }
    }
    return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 상호작용 ID들 찾기
   */
  private findInteractionIds(kv: Record<string, string>): string[] {
    const ids = new Set<string>();
    for (const key of Object.keys(kv)) {
      const match = key.match(/^INTERACTION_(\d+)_/);
      if (match) {
        ids.add(match[1]);
      }
    }
    return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 교육적 기능 ID들 찾기
   */
  private findEducationalIds(kv: Record<string, string>): string[] {
    const ids = new Set<string>();
    for (const key of Object.keys(kv)) {
      const match = key.match(/^EDU_(\d+)_/);
      if (match) {
        ids.add(match[1]);
      }
    }
    return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 안전한 숫자 파싱
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}