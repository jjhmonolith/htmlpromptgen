import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ProjectData, VisualIdentity, DesignTokens, Step3IntegratedResult, ComponentLine, FinalPrompt } from '../../../types/workflow.types';
import { Step4DesignResult } from '../../../types/step4.types';

interface Step5FinalPromptProps {
  initialData?: FinalPrompt | null;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;
  step3Result: Step3IntegratedResult;
  step4Result: Step4DesignResult;
  onComplete: (data: FinalPrompt) => void;
  onDataChange?: (data: Partial<FinalPrompt>) => void;
  onBack?: () => void;
}

export const Step5FinalPrompt: React.FC<Step5FinalPromptProps> = ({
  initialData,
  projectData,
  visualIdentity,
  designTokens,
  step3Result,
  step4Result,
  onComplete,
  onDataChange,
  onBack
}) => {
  const [finalPrompt, setFinalPrompt] = useState<FinalPrompt>({ htmlPrompt: '' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'images'>('main');
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('preview');

  const hasLoadedInitialData = useRef(false);

  // 초기 데이터 로딩
  useEffect(() => {
    if (initialData && !hasLoadedInitialData.current) {
      setFinalPrompt(initialData);
      hasLoadedInitialData.current = true;
      setIsDataLoaded(true);
    } else if (!initialData && !hasLoadedInitialData.current) {
      // 초기 데이터가 없으면 바로 생성
      generateFinalPrompt();
      hasLoadedInitialData.current = true;
    }
  }, [initialData]);

  // 실시간 데이터 변경 알림
  useEffect(() => {
    if (!isDataLoaded) return;

    const timeoutId = setTimeout(() => {
      if (onDataChange) {
        onDataChange(finalPrompt);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [finalPrompt, isDataLoaded, onDataChange]);

  // 프롬프트 생성 엔진
  const generateFinalPrompt = () => {
    setIsGenerating(true);

    try {
      const htmlPrompt = compileHTMLPrompt();
      const newFinalPrompt: FinalPrompt = {
        htmlPrompt
      };

      setFinalPrompt(newFinalPrompt);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('프롬프트 생성 중 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // HTML 프롬프트 컴파일 함수
  const compileHTMLPrompt = (): string => {
    const sections = [];

    // 1. 프로젝트 개요
    sections.push(`# 교육용 HTML 교안 개발 명세서

## 📋 프로젝트 개요

**제목**: ${projectData.projectTitle}
**대상 학습자**: ${projectData.targetAudience}
**레이아웃 모드**: ${projectData.layoutMode === 'scrollable'
  ? '스크롤형 - 가로폭 1600px 고정, 세로 높이는 콘텐츠에 따라 자동 확장되어 스크롤 생성 가능'
  : '고정형 - 1600px × 1000px 고정 크기, 슬라이드 형식으로 페이지 전환'}
**총 페이지 수**: ${projectData.pages.length}개

${projectData.suggestions && projectData.suggestions.length > 0
  ? `**특별 요구사항**: ${projectData.suggestions.join(' ')}`
  : ''}`);

    // 2. 디자인 시스템
    sections.push(`## 🎨 디자인 시스템

### 색상 팔레트
- **주색상**: ${visualIdentity.colorPalette.primary}
- **보조색상**: ${visualIdentity.colorPalette.secondary}
- **강조색상**: ${visualIdentity.colorPalette.accent}
- **텍스트 색상**: ${visualIdentity.colorPalette.text}
- **배경색상**: ${visualIdentity.colorPalette.background}

### 타이포그래피
- **제목 폰트**: ${visualIdentity.typography.headingFont}
- **본문 폰트**: ${visualIdentity.typography.bodyFont}
- **기본 크기**: ${visualIdentity.typography.baseSize}

### 무드 & 톤
${visualIdentity.moodAndTone.map(mood => `- ${mood}`).join('\n')}

### 컴포넌트 스타일
${visualIdentity.componentStyle}`);

    // 3. 페이지별 상세 명세 (새로운 구조)
    sections.push(generatePageByPageSpecification());

    // 4. CSS 스타일 명세
    sections.push(generateCSSSpecification());

    // 5. JavaScript 상호작용 명세 (Step4가 있는 경우)
    if (step4Result) {
      sections.push(generateJavaScriptSpecification());
    }

    // 6. 이미지 생성 명세서
    sections.push(generateImagePromptSection());

    // 7. 파일 구조
    sections.push(`## 📁 파일 구조 및 배포 가이드

### ⚠️ 필수 파일 구조
각 페이지는 **반드시 개별 HTML 파일**로 분리해야 합니다:

\`\`\`
project-root/
├── 1.html             # 첫 번째 페이지
├── 2.html             # 두 번째 페이지
├── 3.html             # 세 번째 페이지
${projectData.pages.length > 3 ? `├── 4.html             # 네 번째 페이지\n${projectData.pages.slice(4).map((_, i) => `├── ${i + 5}.html             # ${i + 5}번째 페이지`).join('\n')}` : ''}
├── styles.css          # 모든 페이지가 공유하는 CSS 파일
├── script.js           # 모든 페이지가 공유하는 JavaScript 파일
├── images/             # 이미지 에셋 폴더
${getImageFileList()}
└── fonts/              # 커스텀 폰트 파일 (선택사항)
\`\`\`

### 🚫 금지사항
- **절대 금지**: 페이지 간 네비게이션 메뉴 추가
- **절대 금지**: 이전/다음 버튼 또는 페이지 이동 기능
- **절대 금지**: 페이지 번호 표시 또는 진행률 표시
- **절대 금지**: 모든 페이지를 하나의 HTML 파일에 통합

### 배포 전 체크리스트
- [ ] 각 페이지가 개별 HTML 파일로 분리되었는지 확인
- [ ] 네비게이션 요소가 포함되지 않았는지 확인
- [ ] 모든 이미지 파일이 올바른 경로에 배치되었는지 확인
- [ ] 폰트 로딩이 정상적으로 작동하는지 확인
- [ ] 반응형 디자인이 모바일/태블릿에서 정상 작동하는지 확인
- [ ] 접근성 기준 (alt 속성, ARIA 라벨 등) 준수 확인
- [ ] 브라우저 호환성 테스트 완료`);

    // 8. 구현 가이드라인
    sections.push(`## 🚀 구현 가이드라인

### ⚠️ 필수 준수사항
1. **개별 파일 생성**: 각 페이지를 1.html, 2.html, 3.html... 형태로 분리
2. **네비게이션 금지**: 어떤 형태의 페이지 이동 기능도 구현하지 마세요
3. **독립적 동작**: 각 HTML 파일은 완전히 독립적으로 동작해야 합니다

### 개발 우선순위
1. **개별 HTML 파일 생성**: 각 페이지별로 독립된 HTML 파일 작성
2. **공통 CSS/JS 파일**: styles.css와 script.js는 모든 페이지가 공유
3. **콘텐츠 구현**: 각 페이지의 고유 콘텐츠만 포함
4. **이미지 플레이스홀더 설정**: 실제 이미지 크기에 맞는 플레이스홀더 구현
5. **상호작용 구현**: JavaScript를 사용한 교육적 기능 추가 (페이지 내에서만)
6. **최적화 및 테스트**: 각 파일별로 독립적인 테스트 수행

### 🚫 절대 구현하지 말아야 할 기능
- 페이지 간 이동 링크 또는 버튼
- 이전/다음 페이지 네비게이션
- 페이지 번호 표시 또는 진행률 바
- 페이지 목록 또는 메뉴
- 모든 페이지를 하나의 파일에 통합하는 구조

### 📷 이미지 플레이스홀더 구현 지침
**중요**: 실제 이미지 파일을 받기 전까지는 플레이스홀더를 사용하되, 반드시 실제 이미지 크기를 반영해야 합니다.

**플레이스홀더 구현 방법**:
1. **크기 고정**: 각 이미지의 정확한 픽셀 크기(width × height)를 CSS로 고정
2. **배치 유지**: 실제 이미지와 동일한 위치와 정렬 방식 적용
3. **플레이스홀더 서비스 활용**:
   - 예시: \`https://via.placeholder.com/800x600/cccccc/666666?text=Image+Name\`
   - 형식: \`https://via.placeholder.com/[width]x[height]/[배경색]/[텍스트색]?text=[설명]\`

**CSS 스타일 예시**:
\`\`\`css
.content-image {
    /* 실제 이미지 크기로 고정 */
    width: [지정된 width]px;
    height: [지정된 height]px;
    /* 크기 변경 방지 */
    min-width: [지정된 width]px;
    min-height: [지정된 height]px;
    max-width: [지정된 width]px;
    max-height: [지정된 height]px;
    object-fit: cover;
    display: block;
}
\`\`\`

### 성능 최적화 고려사항
- **공통 리소스 활용**: styles.css, script.js, images/ 폴더를 모든 페이지가 공유
- **플레이스홀더 최적화**: 실제 이미지 크기를 정확히 반영하여 레이아웃 시프트 방지
- **폰트 최적화**: 필요한 문자셋만 로드, font-display: swap 사용
- **CSS/JS 최소화**: 불필요한 코드 제거, 파일 크기 최적화

### 접근성 준수사항
- **대체 텍스트**: 모든 이미지(플레이스홀더 포함)에 의미 있는 alt 속성 제공
- **키보드 접근**: Tab 키를 통한 페이지 내 요소 순차적 접근 가능
- **색상 대비**: WCAG 2.1 AA 기준 준수 (4.5:1 이상)
- **ARIA 라벨**: 스크린 리더 사용자를 위한 적절한 라벨 제공`);

    return sections.join('\n\n');
  };

  // 페이지별 상세 명세 생성 (Step4 데이터 통합)
  const generatePageByPageSpecification = (): string => {
    if (!step3Result) return '';

    // 디버깅용 로그
    console.log('🔍 Step4 데이터 구조 분석:', {
      step4Result: step4Result,
      pages: step4Result?.pages,
      firstPage: step4Result?.pages?.[0]
    });

    const pageSpecs = projectData.pages.map((page, index) => {
      const step3Page = step3Result.pages[index];
      const step4Page = step4Result?.pages?.find(p => p.pageNumber === page.pageNumber);
      const pageContent = step3Page?.content;

      // 페이지별 디버깅 로그
      console.log(`📄 Page ${index + 1} 데이터:`, {
        step3Page: step3Page?.structure,
        step4Page: step4Page,
        hasLayout: !!step4Page?.layout,
        hasComponentStyles: !!step4Page?.componentStyles,
        hasImagePlacements: !!step4Page?.imagePlacements,
        hasInteractions: !!step4Page?.interactions
      });

      return `## 📄 Page ${index + 1}: ${page.topic}

### 📝 페이지 정보
- **파일명**: \`${index + 1}.html\`
- **주제**: ${page.topic}
- **설명**: ${page.description}
- **교육 목표**: ${page.learningObjectives?.join(', ') || '명시되지 않음'}

### 📐 레이아웃 명세 ${step4Page ? '(Step4 정밀 설계 반영)' : '(Step3 기본 구조)'}
${generateLayoutSpecification(step3Page, step4Page, index)}

### 🧩 컴포넌트 명세 ${step4Page ? '(정밀 위치/스타일 포함)' : '(기본 구조만)'}
${generateComponentSpecification(pageContent, step4Page)}

### 🖼️ 이미지 배치 명세 ${step4Page ? '(정확한 위치 정보 포함)' : '(기본 정보만)'}
${generateImageSpecification(pageContent, step4Page)}

### ⚡ 상호작용 및 애니메이션 명세
${generateInteractionSpecification(step4Page)}

### 🎓 교육적 기능 명세
${generateEducationalFeatureSpecification(step4Page)}

---`;
    });

    return `## 🏗️ 페이지별 통합 명세 (Step1-4 데이터 완전 반영)

### ⚠️ 구현 지침
- **개별 HTML 파일**: 각 페이지를 1.html, 2.html... 형태로 분리 구현
- **정밀 레이아웃**: Step4의 좌표 및 크기 정보 활용
- **독립적 동작**: 각 파일은 완전 독립적으로 작동
- **네비게이션 금지**: 페이지 간 이동 기능 구현 금지

${pageSpecs.join('\n\n')}`;
  };

  // 레이아웃 명세 생성 (Step4 데이터 우선 활용)
  const generateLayoutSpecification = (step3Page: any, step4Page: any, pageIndex: number): string => {
    if (step4Page?.layout) {
      // Step4 정밀 레이아웃 정보 활용
      const layout = step4Page.layout;
      const sections = layout.sections || [];

      return `**레이아웃 모드**: ${projectData.layoutMode} (${layout.pageWidth || 1600}×${layout.pageHeight === 'auto' ? '자동높이' : layout.pageHeight + 'px'})

**섹션 구조**:
${sections.map((section: any, idx: number) => {
  // Step4 타입에 맞게 필드명 수정
  const position = section.position || {};
  const dimensions = section.dimensions || {};
  return `${idx + 1}. **${section.id}** (${section.gridType || section.role || 'content'})
   - 위치: x=${position.x || 0}px, y=${position.y || 0}px
   - 크기: ${dimensions.width || 'auto'}px × ${dimensions.height || 'auto'}px
   - 그리드: ${section.gridType || 'auto'}
   - 여백: 하단 ${section.marginBottom || 0}px`;
}).join('\n')}

**전체 높이**: ${layout.totalHeight || '자동 계산'}`;
    } else if (step3Page?.structure) {
      // Step3 기본 구조 정보 활용
      const structure = step3Page.structure;
      return `**레이아웃 모드**: ${projectData.layoutMode}
**기본 섹션 구조** (Step3):
${structure.sections.map((section: any, idx: number) => {
  return `${idx + 1}. **${section.id}** - ${section.role} (그리드: ${section.grid})
   - 높이: ${section.height}
   - 여백: 하단 ${section.gapBelow}px
   - 힌트: ${section.hint}`;
}).join('\n')}`;
    } else {
      return '레이아웃 정보가 없습니다.';
    }
  };

  // 컴포넌트 명세 생성 (Step4 정밀 스타일 반영)
  const generateComponentSpecification = (pageContent: any, step4Page: any): string => {
    if (!pageContent?.components) {
      return '컴포넌트 정보가 없습니다.';
    }

    return pageContent.components.map((comp: any, compIndex: number) => {
      const step4Component = step4Page?.componentStyles?.find((c: any) =>
        c.id === comp.slotRef || c.componentId === comp.slotRef || c.type === comp.type
      );

      let spec = `**${compIndex + 1}. ${comp.type.toUpperCase()}** \`${comp.text || '텍스트 없음'}\``;

      if (step4Component) {
        // Step4 타입에 맞게 필드명 수정
        const position = step4Component.position || {};
        const dimensions = step4Component.dimensions || {};
        const colors = step4Component.colors || {};
        const typography = step4Component.typography || {};
        const spacing = step4Component.spacing || {};

        spec += `
   - **위치**: x=${position.x || 0}px, y=${position.y || 0}px
   - **크기**: ${dimensions.width || 'auto'} × ${dimensions.height || 'auto'}
   - **스타일**:
     * 폰트: ${typography.fontSize || typography.fontFamily || '기본'}
     * 색상: 텍스트 ${colors.text || '기본'}, 배경 ${colors.background || '투명'}
     * 여백: top=${spacing.top || 0}px, right=${spacing.right || 0}px, bottom=${spacing.bottom || 0}px, left=${spacing.left || 0}px
   - **역할**: ${comp.role || '기본'}`;
      } else {
        spec += `
   - **기본 정보**: ${getComponentDescription(comp)}
   - **역할**: ${comp.role || '기본'}`;
      }

      return spec;
    }).join('\n\n');
  };

  // 이미지 배치 명세 생성 (Step4 정밀 위치 정보 반영)
  const generateImageSpecification = (pageContent: any, step4Page: any): string => {
    if (!pageContent?.images) {
      return '이미지가 없습니다.';
    }

    return pageContent.images.map((img: any, imgIndex: number) => {
      const step4Image = step4Page?.imagePlacements?.find((i: any) =>
        i.imageId === img.filename || i.filename === img.filename || i.id === img.filename
      );

      let spec = `**${imgIndex + 1}. ${img.filename}**`;

      if (step4Image) {
        // Step4 타입에 맞게 필드명 수정
        const position = step4Image.position || {};
        const dimensions = step4Image.dimensions || {};
        const margins = step4Image.margins || {};

        spec += `
   - **정밀 위치**: x=${position.x || 0}px, y=${position.y || 0}px
   - **정확한 크기**: ${dimensions.width || img.width}×${dimensions.height || img.height}px
   - **z-index**: ${step4Image.zIndex || 1}
   - **배치 방식**: ${step4Image.placement || 'static'}
   - **여백**: top=${margins.top || 0}px, right=${margins.right || 0}px, bottom=${margins.bottom || 0}px, left=${margins.left || 0}px`;
      } else {
        spec += `
   - **기본 크기**: ${img.width}×${img.height}px`;
      }

      spec += `
   - **용도**: ${img.description}
   - **AI 프롬프트**: ${img.aiPrompt}
   - **대체 텍스트**: ${img.alt}`;

      return spec;
    }).join('\n\n');
  };

  // 상호작용 명세 생성
  const generateInteractionSpecification = (step4Page: any): string => {
    if (!step4Page?.interactions || step4Page.interactions.length === 0) {
      return step4Result ? '기본적인 상호작용 기능 (호버, 클릭 등)' : '상호작용 기능이 정의되지 않았습니다.';
    }

    return step4Page.interactions.map((interaction: any, idx: number) => {
      return `**${idx + 1}. ${interaction.type || interaction.name || 'Interaction'}**
- 대상: ${interaction.target || interaction.targetElement || '미정'}
- 트리거: ${interaction.trigger || interaction.event || '기본'}
- 효과: ${interaction.effect || interaction.animation || '기본 효과'}
- 지속시간: ${interaction.duration || 300}ms`;
    }).join('\n\n');
  };

  // 교육적 기능 명세 생성
  const generateEducationalFeatureSpecification = (step4Page: any): string => {
    if (!step4Page?.educationalFeatures || step4Page.educationalFeatures.length === 0) {
      return '기본 교육적 레이아웃 및 시각적 계층 구조';
    }

    return step4Page.educationalFeatures.map((feature: any, idx: number) => {
      return `**${idx + 1}. ${feature.type}**
- 목적: ${feature.purpose}
- 구현: ${feature.implementation}
- 효과: ${feature.expectedOutcome}`;
    }).join('\n\n');
  };

  // 단일 페이지 구조 생성
  const generateSinglePageStructure = (pageIndex: number): string => {
    if (!step3Result) return '';

    const page = step3Result.pages[pageIndex];
    if (!page || !page.content) return '';

    return page.content.components.map(comp => generateComponentHTML(comp, page)).join('\n                    ');
  };

  // 컴포넌트 설명 생성
  const getComponentDescription = (component: ComponentLine): string => {
    switch (component.type) {
      case 'heading':
        return `제목 요소 (h${component.variant || '2'})`;
      case 'paragraph':
        return '본문 텍스트';
      case 'image':
        return `이미지 표시 (${component.width || 400}×${component.height || 300}px)`;
      case 'card':
        return `카드 컴포넌트 (${component.variant || 'default'} 스타일)`;
      case 'caption':
        return '이미지 캡션';
      default:
        return '일반 컨텐츠 요소';
    }
  };

  // 컴포넌트별 HTML 생성
  const generateComponentHTML = (component: ComponentLine, page?: any): string => {
    switch (component.type) {
      case 'heading':
        return `<h${component.variant || '2'} class="section-heading ${component.role}">${component.text}</h${component.variant || '2'}>`;
      case 'paragraph':
        return `<p class="content-text ${component.role}">${component.text}</p>`;
      case 'image':
        // Step3에서 생성된 이미지 정보 활용
        let width = component.width || 400;
        let height = component.height || 300;
        let imageName = component.text || 'Image';

        // Step3 이미지 정보에서 실제 크기 찾기
        if (page?.content?.images && component.slotRef) {
          const matchingImage = page.content.images.find((img: any) =>
            img.filename.includes(component.slotRef) || component.text?.includes(img.purpose)
          );
          if (matchingImage) {
            width = matchingImage.width;
            height = matchingImage.height;
            imageName = matchingImage.alt || matchingImage.caption || imageName;
          }
        }

        // 플레이스홀더 URL 생성 (실제 이미지 크기 반영)
        const placeholderSrc = `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(imageName)}`;

        return `<img src="${placeholderSrc}" alt="${imageName}" class="content-image" style="width: ${width}px; height: ${height}px; min-width: ${width}px; min-height: ${height}px; max-width: ${width}px; max-height: ${height}px; object-fit: cover; display: block;" />
<!-- 실제 이미지로 교체할 때: src="${component.src || `images/${imageName.toLowerCase().replace(/\\s+/g, '_')}.png`}" -->`;
      case 'card':
        return `<div class="content-card ${component.variant || ''}">
    <div class="card-content">${component.text}</div>
</div>`;
      case 'caption':
        return `<figcaption class="image-caption">${component.text}</figcaption>`;
      default:
        return `<div class="content-element">${component.text || ''}</div>`;
    }
  };

  // CSS 스타일 명세 생성
  const generateCSSSpecification = (): string => {
    return `## 🎨 CSS 스타일 명세

### 전역 스타일 정의
\`\`\`css
:root {
    /* 색상 변수 */
    --color-primary: ${visualIdentity.colorPalette.primary};
    --color-secondary: ${visualIdentity.colorPalette.secondary};
    --color-accent: ${visualIdentity.colorPalette.accent};
    --color-text: ${visualIdentity.colorPalette.text};
    --color-background: ${visualIdentity.colorPalette.background};

    /* 폰트 변수 */
    --font-heading: ${visualIdentity.typography.headingFont};
    --font-body: ${visualIdentity.typography.bodyFont};
    --font-size-base: ${visualIdentity.typography.baseSize};

    /* 간격 변수 */
    --spacing-xs: ${designTokens.spacing.xs}px;
    --spacing-sm: ${designTokens.spacing.sm}px;
    --spacing-md: ${designTokens.spacing.md}px;
    --spacing-lg: ${designTokens.spacing.lg}px;
    --spacing-xl: ${designTokens.spacing.xl}px;

    /* 반응형 중단점 */
    --breakpoint-mobile: 480px;
    --breakpoint-tablet: 768px;
    --breakpoint-desktop: 1024px;
}

/* 기본 리셋 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-background);
}

.app-container {
    ${projectData.layoutMode === 'fixed'
      ? 'width: 1600px; height: 1000px; overflow: hidden; margin: 0 auto;'
      : 'width: 1600px; margin: 0 auto; padding: var(--spacing-md);'
    }
}

/* 페이지 섹션 스타일 */
.page-section {
    ${projectData.layoutMode === 'fixed'
      ? `width: 1600px;
    height: 1000px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;`
      : `width: 100%;
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-lg);
    min-height: auto;`
    }
}

.page-container {
    ${projectData.layoutMode === 'scrollable'
      ? 'max-width: 1400px; width: 100%; padding: var(--spacing-lg);'
      : 'max-width: 1400px; width: 90%; height: 90%; padding: var(--spacing-lg); overflow: auto;'
    }
}
\`\`\`

### 컴포넌트별 스타일
\`\`\`css
/* 제목 스타일 */
.section-heading {
    font-family: var(--font-heading);
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
    line-height: 1.2;
}

.section-heading.title {
    font-size: 2.5em;
    text-align: center;
    margin-bottom: var(--spacing-lg);
}

.section-heading.content {
    font-size: 1.8em;
    margin-top: var(--spacing-lg);
}

/* 텍스트 스타일 */
.content-text {
    margin-bottom: var(--spacing-md);
    text-align: justify;
}

.content-text.title {
    font-size: 1.2em;
    text-align: center;
    font-weight: 500;
}

/* 이미지 스타일 */
.content-image {
    max-width: 100%;
    height: auto;
    border-radius: var(--spacing-xs);
    margin: var(--spacing-md) auto;
    display: block;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-caption {
    text-align: center;
    font-size: 0.9em;
    color: var(--color-secondary);
    font-style: italic;
    margin-top: var(--spacing-xs);
}

/* 카드 스타일 */
.content-card {
    background: white;
    border-radius: var(--spacing-sm);
    padding: var(--spacing-md);
    margin: var(--spacing-md) 0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    border-left: 4px solid var(--color-accent);
}

/* 반응형 스타일 */
@media (max-width: 1600px) {
    .app-container {
        ${projectData.layoutMode === 'scrollable'
          ? 'width: 100%; padding: var(--spacing-sm);'
          : 'transform: scale(0.8); transform-origin: top center;'
        }
    }

    .page-section {
        ${projectData.layoutMode === 'scrollable'
          ? 'padding: var(--spacing-sm);'
          : ''
        }
    }

    .section-heading.title {
        font-size: 2em;
    }

    .section-heading.content {
        font-size: 1.5em;
    }

    .page-container {
        ${projectData.layoutMode === 'scrollable'
          ? 'padding: var(--spacing-sm);'
          : ''
        }
    }
}

@media (max-width: 768px) {
    .app-container {
        ${projectData.layoutMode === 'fixed'
          ? 'transform: scale(0.5); transform-origin: top center;'
          : 'width: 100%; padding: var(--spacing-sm);'
        }
    }

    .section-heading.title {
        font-size: 1.8em;
    }

    .section-heading.content {
        font-size: 1.3em;
    }
}
\`\`\``;
  };

  // JavaScript 상호작용 명세 생성
  const generateJavaScriptSpecification = (): string => {
    return `## ⚡ JavaScript 상호작용 명세

### ⚠️ 중요 지침
각 HTML 파일은 독립적으로 작동해야 하며, 페이지 간 네비게이션 기능은 절대 구현하지 마세요.

### 교육적 기능 구현
\`\`\`javascript
// 페이지 로드 시 초기화 (각 페이지별로 독립 실행)
document.addEventListener('DOMContentLoaded', function() {
    initializeEducationalFeatures();
    setupInteractiveElements();
});

// 교육적 기능 초기화
function initializeEducationalFeatures() {
    const elements = document.querySelectorAll('.page-container > *');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// 상호작용 요소 설정
function setupInteractiveElements() {
    const images = document.querySelectorAll('.content-image');
    images.forEach(img => {
        img.addEventListener('click', () => {
            showImageModal(img.src, img.alt);
        });
    });

    const cards = document.querySelectorAll('.content-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
        });
    });
}

function showImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = '<div class="modal-backdrop"><div class="modal-content"><img src="' + src + '" alt="' + alt + '" class="modal-image"><button class="modal-close">×</button></div></div>';

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}
\`\`\``;
  };

  // 이미지 프롬프트 섹션 생성
  const generateImagePromptSection = (): string => {
    if (!step3Result) return '';

    const imagePrompts: string[] = [];

    step3Result.pages.forEach((page, pageIndex) => {
      if (page.content && page.content.images) {
        page.content.images.forEach((image, imageIndex) => {
          imagePrompts.push(`### 이미지 ${pageIndex + 1}-${imageIndex + 1}: ${image.filename}

${image.aiPrompt}

무드: ${visualIdentity.moodAndTone.join(', ')}
색상 팔레트: 주색상 ${visualIdentity.colorPalette.primary}, 보조색상 ${visualIdentity.colorPalette.secondary}
스타일: ${image.style}
용도: ${image.description}
교육 대상: ${projectData.targetAudience}
해상도: ${image.width}×${image.height}px
교육적 목적: 명확하고 이해하기 쉬운 시각적 표현`);
        });
      }
    });

    return `## 🖼️ 이미지 생성 명세서

${imagePrompts.join('\n\n---\n\n')}`;
  };


  // 이미지 파일 목록 생성
  const getImageFileList = (): string => {
    if (!step3Result) return '';

    const imageFiles: string[] = [];
    step3Result.pages.forEach(page => {
      if (page.content && page.content.images) {
        page.content.images.forEach(image => {
          imageFiles.push(`│   ├── ${image.filename}`);
        });
      }
    });

    return imageFiles.join('\n');
  };

  // 프롬프트 복사 함수
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 성공 알림 (간단한 토스트 메시지)
      const toast = document.createElement('div');
      toast.textContent = '프롬프트가 클립보드에 복사되었습니다!';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #10b981; color: white; padding: 12px 20px;
        border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  const handleComplete = () => {
    onComplete(finalPrompt);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 흰색 영역 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white shadow-sm pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              실행 가능한 개발 명세서
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Step 1-4의 모든 데이터를 통합하여 완성된 개발 가이드를 생성합니다
            </p>

            {/* 섹션 토글 */}
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveSection('main')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeSection === 'main'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                개발 프롬프트
              </button>
              <button
                onClick={() => setActiveSection('images')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeSection === 'images'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                이미지 프롬프트
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                최종 프롬프트 생성 중...
              </h3>
              <p className="text-gray-600">
                1-4단계 데이터를 통합하여 개발 명세서를 작성하고 있습니다
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 프롬프트 미리보기 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {activeSection === 'main' ? '개발 명세서 프롬프트' : '이미지 생성 프롬프트'}
                    </h3>
                    <div className="flex gap-2">
                      {/* 뷰 모드 토글 */}
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'preview'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          미리보기
                        </button>
                        <button
                          onClick={() => setViewMode('raw')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'raw'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          코드보기
                        </button>
                      </div>

                      <button
                        onClick={() => copyToClipboard(finalPrompt.htmlPrompt)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복사
                      </button>
                      <button
                        onClick={generateFinalPrompt}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        새로고침
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                    {viewMode === 'preview' ? (
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {activeSection === 'main'
                            ? finalPrompt.htmlPrompt
                            : finalPrompt.htmlPrompt.split('## 🖼️ 이미지 생성 명세서')[1] || '이미지 프롬프트 섹션을 생성 중입니다...'
                          }
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {activeSection === 'main'
                          ? finalPrompt.htmlPrompt
                          : finalPrompt.htmlPrompt.split('## 🖼️ 이미지 생성 명세서')[1] || '이미지 프롬프트 섹션을 생성 중입니다...'
                        }
                      </pre>
                    )}
                  </div>

                  {/* 통계 정보 */}
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <span>총 {finalPrompt.htmlPrompt.length.toLocaleString()}자</span>
                    <span>약 {Math.ceil(finalPrompt.htmlPrompt.length / 100)} 토큰</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      생성 완료
                    </span>
                  </div>
                </div>
              </div>

              {/* 요약 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">프로젝트 정보</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>제목:</strong> {projectData.projectTitle}</p>
                    <p><strong>대상:</strong> {projectData.targetAudience}</p>
                    <p><strong>페이지:</strong> {projectData.pages.length}개</p>
                    <p><strong>레이아웃:</strong> {projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">디자인 시스템</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: visualIdentity.colorPalette.primary }}></div>
                      <span className="text-sm text-gray-600">주색상</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: visualIdentity.colorPalette.secondary }}></div>
                      <span className="text-sm text-gray-600">보조색상</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: visualIdentity.colorPalette.accent }}></div>
                      <span className="text-sm text-gray-600">강조색상</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">통합 결과</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>HTML 구조:</strong> ✅ 완성</p>
                    <p><strong>CSS 스타일:</strong> ✅ 완성</p>
                    <p><strong>JS 상호작용:</strong> ✅ 완성</p>
                    <p><strong>이미지 명세:</strong> ✅ 완성</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 pb-8">
        <div className="flex justify-between items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all shadow-sm"
            >
              이전으로
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => copyToClipboard(finalPrompt.htmlPrompt)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all font-medium shadow-sm"
            >
              📋 전체 복사
            </button>
            <button
              onClick={handleComplete}
              disabled={!finalPrompt.htmlPrompt}
              className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
            >
              완료 ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};