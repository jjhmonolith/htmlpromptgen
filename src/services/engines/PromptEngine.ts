import { ProjectData, VisualIdentity, ComponentLine, ImageLine } from '../../types/workflow.types';

/**
 * Step4 AI 프롬프트 생성 엔진
 *
 * Step3 결과를 바탕으로 구현 가능한 정밀한 디자인 명세를 위한
 * 최적화된 AI 프롬프트를 생성합니다.
 */
export class PromptEngine {
  /**
   * 페이지별 Step4 프롬프트 생성
   * @param step3PageData Step3 페이지 데이터
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @returns 최적화된 AI 프롬프트
   */
  generatePagePrompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): string {
    const contextSection = this.buildContextSection(step3PageData, projectData, visualIdentity);
    const layoutSection = this.buildLayoutConstraints(projectData.layoutMode);
    const componentSection = this.buildComponentContext(step3PageData.content);
    const imageSection = this.buildImageContext(step3PageData.content);
    const outputFormat = this.buildOutputFormat();
    const qualityGuidelines = this.buildQualityGuidelines(projectData.layoutMode);

    return `교육용 HTML 교안을 위한 정밀한 디자인 명세를 생성해주세요.

${contextSection}

${layoutSection}

${componentSection}

${imageSection}

${outputFormat}

${qualityGuidelines}

중요: 모든 수치는 픽셀 단위로 정확하게 명시하고, 실제 구현 가능한 CSS 속성만 사용해주세요.`;
  }

  /**
   * 컨텍스트 섹션 생성
   */
  private buildContextSection(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): string {
    const pageInfo = {
      pageTitle: step3PageData.pageTitle,
      pageNumber: step3PageData.pageNumber,
      sections: step3PageData.structure?.sections?.length || 0,
      components: step3PageData.content?.components?.length || 0,
      images: step3PageData.content?.images?.length || 0
    };

    const visualContext = {
      moodAndTone: visualIdentity.moodAndTone.join(', '),
      primaryColor: visualIdentity.colorPalette.primary,
      secondaryColor: visualIdentity.colorPalette.secondary,
      accentColor: visualIdentity.colorPalette.accent,
      baseSize: visualIdentity.typography.baseSize
    };

    return `## 페이지 컨텍스트
페이지: ${pageInfo.pageTitle} (${pageInfo.pageNumber}/${projectData.pages.length})
프로젝트: ${projectData.projectTitle}
대상: ${projectData.targetAudience}
레이아웃 모드: ${projectData.layoutMode}

## 비주얼 아이덴티티
무드: ${visualContext.moodAndTone}
주색상: ${visualContext.primaryColor}
보조색상: ${visualContext.secondaryColor}
강조색상: ${visualContext.accentColor}
기본 폰트 크기: ${visualContext.baseSize}

## 콘텐츠 구성
섹션 수: ${pageInfo.sections}개
컴포넌트 수: ${pageInfo.components}개
이미지 수: ${pageInfo.images}개`;
  }

  /**
   * 레이아웃 제약사항 섹션
   */
  private buildLayoutConstraints(layoutMode: 'fixed' | 'scrollable'): string {
    const constraints = {
      fixed: {
        pageWidth: 1600,
        pageHeight: 1000,
        maxHeight: '1000px (절대 초과 금지)',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
        contentWidth: 1400, // 1600 - 100 - 100
        considerations: [
          '높이 제한을 절대 준수해야 함',
          '스크롤 없이 모든 내용이 보여야 함',
          '컴포넌트 간격을 최소화하여 공간 효율성 극대화',
          '폰트 크기와 여백을 보수적으로 설정'
        ]
      },
      scrollable: {
        pageWidth: 1600,
        pageHeight: 'auto',
        maxHeight: '제한 없음',
        safeArea: { top: 80, right: 100, bottom: 120, left: 100 },
        contentWidth: 1400,
        considerations: [
          '세로 스크롤을 전제로 여유 있는 레이아웃',
          '컴포넌트 간격을 넉넉하게 설정',
          '가독성을 위한 충분한 여백',
          '섹션별 명확한 시각적 구분'
        ]
      }
    };

    const config = constraints[layoutMode];

    return `## 레이아웃 제약사항 (${layoutMode.toUpperCase()} 모드)
페이지 크기: ${config.pageWidth} × ${config.pageHeight}
${layoutMode === 'fixed' ? `최대 높이: ${config.maxHeight}` : ''}
안전 영역: 상${config.safeArea.top}px, 우${config.safeArea.right}px, 하${config.safeArea.bottom}px, 좌${config.safeArea.left}px
콘텐츠 영역 너비: ${config.contentWidth}px

### ${layoutMode === 'fixed' ? 'Fixed' : 'Scrollable'} 모드 고려사항:
${config.considerations.map(item => `- ${item}`).join('\n')}`;
  }

  /**
   * 컴포넌트 컨텍스트 섹션
   */
  private buildComponentContext(content: any): string {
    if (!content?.components || content.components.length === 0) {
      return `## 컴포넌트 정보
컴포넌트가 없습니다.`;
    }

    const componentsByType = this.groupComponentsByType(content.components);
    const componentDetails = content.components.map((comp: ComponentLine, index: number) => {
      return `${index + 1}. ${comp.id} (${comp.type}${comp.variant ? ` - ${comp.variant}` : ''})
   섹션: ${comp.section} | 역할: ${comp.role}${comp.gridSpan ? ` | 그리드: ${comp.gridSpan}` : ''}
   텍스트: ${comp.type !== 'image' ? (comp.text ? `"${comp.text.substring(0, 100)}${comp.text.length > 100 ? '...' : ''}"` : '없음') : 'N/A'}`;
    }).join('\n');

    return `## 컴포넌트 정보 (총 ${content.components.length}개)
### 타입별 분포:
${Object.entries(componentsByType).map(([type, count]) => `- ${type}: ${count}개`).join('\n')}

### 상세 목록:
${componentDetails}`;
  }

  /**
   * 이미지 컨텍스트 섹션
   */
  private buildImageContext(content: any): string {
    if (!content?.images || content.images.length === 0) {
      return `## 이미지 정보
이미지가 없습니다.`;
    }

    const imageDetails = content.images.map((img: ImageLine, index: number) => {
      return `${index + 1}. ${img.filename} (${img.purpose})
   크기: ${img.width} × ${img.height}px | 위치: ${img.place} | 스타일: ${img.style}
   섹션: ${img.section}
   설명: ${img.description}
   Alt: ${img.alt}`;
    }).join('\n');

    return `## 이미지 정보 (총 ${content.images.length}개)
${imageDetails}`;
  }

  /**
   * 출력 포맷 정의
   */
  private buildOutputFormat(): string {
    return `## 출력 형식
다음 정확한 형식으로 응답해주세요:

BEGIN_S4
VERSION=design.v1
LAYOUT_MODE=fixed|scrollable

# 레이아웃 명세
LAYOUT_PAGE_WIDTH=1600
LAYOUT_PAGE_HEIGHT=1000|auto
LAYOUT_BG_COLOR=#FFFFFF
LAYOUT_SAFE_TOP=80
LAYOUT_SAFE_RIGHT=100
LAYOUT_SAFE_BOTTOM=120
LAYOUT_SAFE_LEFT=100

# 섹션 명세 (섹션 개수만큼 반복)
SECTION_1_ID=section1
SECTION_1_GRID=1-12|8+4|2-11|3-10
SECTION_1_X=100
SECTION_1_Y=80
SECTION_1_WIDTH=1400
SECTION_1_HEIGHT=200|auto
SECTION_1_PADDING_TOP=32
SECTION_1_PADDING_RIGHT=40
SECTION_1_PADDING_BOTTOM=32
SECTION_1_PADDING_LEFT=40
SECTION_1_BG_COLOR=transparent|#FAFBFC
SECTION_1_GAP=24
SECTION_1_MARGIN_BOTTOM=32

# 컴포넌트 스타일 (컴포넌트 개수만큼 반복)
COMP_1_ID=h1_intro
COMP_1_TYPE=heading|paragraph|card|image
COMP_1_SECTION=section1
COMP_1_X=100
COMP_1_Y=80
COMP_1_WIDTH=720
COMP_1_HEIGHT=60|auto
COMP_1_FONT_FAMILY=SF Pro Display|SF Pro Text
COMP_1_FONT_SIZE=28px
COMP_1_FONT_WEIGHT=600
COMP_1_LINE_HEIGHT=1.2
COMP_1_COLOR_TEXT=#1E293B
COMP_1_COLOR_BG=transparent
COMP_1_COLOR_BORDER=#E2E8F0
COMP_1_BORDER_RADIUS=8
COMP_1_BOX_SHADOW=0 2px 8px rgba(0, 0, 0, 0.1)|none
COMP_1_Z_INDEX=10
COMP_1_DISPLAY=block

# 이미지 배치 (이미지 개수만큼 반복)
IMG_1_ID=diagram1
IMG_1_SRC=1.png
IMG_1_X=100
IMG_1_Y=200
IMG_1_WIDTH=520
IMG_1_HEIGHT=320
IMG_1_ALT=다이어그램 설명
IMG_1_BORDER_RADIUS=8
IMG_1_BOX_SHADOW=0 4px 12px rgba(0, 0, 0, 0.15)

# 상호작용 (선택사항)
INTERACTION_1_TARGET=comp_id
INTERACTION_1_TRIGGER=hover|click
INTERACTION_1_EFFECT=opacity:0.8|transform:scale(1.05)
INTERACTION_1_DURATION=200ms

# 교육적 기능 (선택사항)
EDU_1_TYPE=tooltip|highlight|animation
EDU_1_TARGET=comp_id
EDU_1_CONTENT=설명 텍스트
EDU_1_TRIGGER=hover
EDU_1_PURPOSE=학습 목적 설명

END_S4`;
  }

  /**
   * 품질 가이드라인
   */
  private buildQualityGuidelines(layoutMode: 'fixed' | 'scrollable'): string {
    const commonGuidelines = [
      '모든 위치와 크기는 픽셀 단위로 정확하게 명시',
      '색상은 HEX 형식 6자리로 통일',
      '폰트 크기는 12px 이상 72px 이하',
      '컴포넌트 간 최소 8px 이상 간격 유지',
      'z-index는 10 단위로 설정 (10, 20, 30...)',
      '접근성을 고려한 색상 대비 유지',
      '이미지 alt 텍스트 반드시 포함'
    ];

    const modeSpecificGuidelines = {
      fixed: [
        '🚨 CRITICAL: 전체 페이지 높이가 1000px를 절대 초과 금지 (교육적 효과를 위한 필수 제약)',
        '📊 공간 효율성: 컴포넌트 수를 5-7개로 엄격히 제한',
        '🎯 압축 레이아웃: 폰트 크기(14-24px), 여백(16-32px)을 보수적으로 설정',
        '⚡ 즉시성: 스크롤 없이 모든 핵심 내용이 한눈에 보여야 함',
        '🔢 정확한 계산: Y좌표 누적 계산으로 높이 제한 준수 검증 필수'
      ],
      scrollable: [
        '📜 자연스러운 흐름: 세로 스크롤 기반 스토리텔링 구조',
        '🌬️ 여유 있는 호흡: 섹션 간격 48-120px로 설정하여 시각적 휴식 제공',
        '📖 가독성 우선: 충분한 여백으로 학습 집중도 향상',
        '🎨 계층적 구조: 각 섹션의 독립적 완결성과 연결성 동시 고려',
        '⏯️ 단계별 학습: 점진적 정보 공개로 학습 효과 극대화'
      ]
    };

    return `## 품질 가이드라인

### 공통 요구사항:
${commonGuidelines.map(item => `- ${item}`).join('\n')}

### ${layoutMode.toUpperCase()} 모드 특수 요구사항:
${modeSpecificGuidelines[layoutMode].map(item => `- ${item}`).join('\n')}

### 💎 교육 컨텐츠 특화 설계 원칙:
- 🧠 인지 부하 관리: 한 화면당 핵심 개념 3-5개로 제한
- 👁️ 시선 흐름 최적화: Z패턴 또는 F패턴 기반 레이아웃 구성
- 🎯 학습 목표 중심: 각 섹션마다 명확한 학습 의도 반영
- 🔄 반복 학습 지원: 중요 개념의 시각적 강조와 재등장 구조
- 📱 다양한 학습자 고려: 접근성과 인클루시브 디자인 필수

### 🔬 99%+ 파싱 성공률 보장:
- ✅ 모든 키=값 형식을 정확히 준수
- 📋 누락되는 필드가 없도록 완전한 명세 작성
- 🎨 유효한 CSS 속성값만 사용
- 🏷️ 일관된 네이밍 컨벤션 유지
- 🔍 파싱 엔진 친화적 구조화된 출력`;
  }

  /**
   * 컴포넌트를 타입별로 그룹화
   */
  private groupComponentsByType(components: ComponentLine[]): Record<string, number> {
    return components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}