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
  step4Result?: Step4DesignResult | null; // 옵셔널로 변경 (Step 4 생략 가능)
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

    // 2. 디자인 시스템 (Step2 구조화된 데이터 정확히 반영)
    sections.push(`## 🎨 디자인 시스템 (Step2 비주얼 아이덴티티 기반)

### 🌈 색상 팔레트 (정확한 HEX 코드)
다음 5가지 색상을 모든 페이지에서 일관되게 사용하세요:

- **PRIMARY (주색상)**: \`${visualIdentity.colorPalette.primary}\` - 주요 제목, 중요한 버튼, 핵심 강조 요소
- **SECONDARY (보조색상)**: \`${visualIdentity.colorPalette.secondary}\` - 카드 배경, 섹션 구분, 보조 영역
- **ACCENT (강조색상)**: \`${visualIdentity.colorPalette.accent}\` - 행동 유도, 하이라이트, 주의 집중 요소
- **BACKGROUND (배경색상)**: \`${visualIdentity.colorPalette.background}\` - 전체 페이지 배경색
- **TEXT (텍스트색상)**: \`${visualIdentity.colorPalette.text}\` - 모든 텍스트의 기본 색상

### ✍️ 타이포그래피 시스템
- **헤딩 폰트**: ${visualIdentity.typography.headingFont} (제목, 섹션 헤더에 사용)
  - 특성: ${visualIdentity.typography.headingStyle || '견고하면서도 친근한'}
- **본문 폰트**: ${visualIdentity.typography.bodyFont} (일반 텍스트, 설명문에 사용)
  - 특성: ${visualIdentity.typography.bodyStyle || '읽기 편안하고 깔끔한'}
- **기본 크기**: ${visualIdentity.typography.baseSize}
- **최소 폰트 크기**: 모든 텍스트는 최소 18pt(24px) 이상 필수

### 🎭 무드 & 톤 (4가지 핵심 감성)
${visualIdentity.moodAndTone.map(mood => `- **${mood}**: 이 감성을 레이아웃의 모든 요소(여백, 정렬, 색상 배치, 컴포넌트 형태)에 반영하세요`).join('\n')}

### 🎪 컴포넌트 스타일 가이드
${visualIdentity.componentStyle}

### 💡 디자인 적용 지침
1. **색상 일관성**: 위 5가지 색상만 사용하여 통일된 컬러 팔레트 유지
2. **폰트 일관성**: 지정된 2가지 폰트만 사용하여 타이포그래피 시스템 준수
3. **감성 반영**: 4가지 무드를 레이아웃의 전체적인 느낌에 녹여내세요
4. **컴포넌트 가이드 준수**: 위 스타일 가이드에 맞는 UI 요소들로 구성하세요`);

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

    // 7. 개선된 파일 구조 및 하이브리드 스타일링 가이드
    sections.push(`## 📁 프로젝트 폴더 구조 및 하이브리드 스타일링

### 🛠️ 권장 프로젝트 구조
다음과 같은 체계적인 폴더 구조로 결과물을 구성해주세요:

\`\`\`
project-root/
├── page1.html          # 첫 번째 페이지
├── page2.html          # 두 번째 페이지
├── page3.html          # 세 번째 페이지
${projectData.pages.length > 3 ? `├── page4.html          # 네 번째 페이지\n${projectData.pages.slice(4).map((_, i) => `├── page${i + 5}.html          # ${i + 5}번째 페이지`).join('\n')}` : ''}
├── css/
│   └── style.css       # 폰트, 색상 등 모든 공통 스타일
├── js/
│   └── script.js       # 모든 상호작용 관련 JavaScript
├── image/
${step3Result ? step3Result.pages.map((page, pageIndex) => {
  if (page.mediaAssets && page.mediaAssets.length > 0) {
    const pageImages = page.mediaAssets.map(img => `│   │   ├── ${img.fileName}`).join('\n');
    return `│   ├── page${pageIndex + 1}/\n${pageImages}`;
  }
  return `│   ├── page${pageIndex + 1}/    # 이미지 없음 (HTML/CSS 기반)`;
}).join('\n') : '│   └── (이미지 폴더는 실제 이미지가 있는 페이지만 생성)'}
└── README.md           # 프로젝트 설명서 (선택사항)
\`\`\`

**📝 주요 변경사항:**
- 이미지 폴더명을 \`images/\`에서 \`image/\`로 변경 (Step3 경로와 일치)
- 각 페이지별 이미지 폴더는 실제 이미지가 있을 때만 생성
- HTML/CSS 기반 시각화가 우선이며, 이미지는 보조적 역할

### 🎨 하이브리드 스타일링 전략

#### 1. **공통 스타일 (css/style.css)**
- **폰트, 색상 변수**: 프로젝트 전반에 사용될 디자인 토큰
- **공통 컴포넌트 스타일**: 버튼, 카드, 기본 타이포그래피 등
- **전역 리셋 및 기본 설정**: CSS Reset, box-sizing 등

#### 2. **페이지 전용 스타일 (각 HTML의 \`<style>\` 태그)**
- **복잡한 레이아웃**: Grid, Flexbox를 활용한 창의적 배치
- **페이지별 특수 애니메이션**: CSS transitions, transforms
- **반응형 미디어 쿼리**: 해당 페이지만의 특별한 반응형 로직
- **고유한 시각적 효과**: 그라데이션, 그림자, 특수 효과

### ✨ 디자인 및 애니메이션 가이드라인

1. **디자인 시스템 준수**: 위에 정의된 '디자인 시스템'의 색상, 타이포그래피, 스타일 가이드를 모든 페이지에서 일관되게 적용해주세요.

2. **이미지 사용 최소화**: 학습 내용에 필수적인 이미지만 사용하세요. 의미 없는 장식용 이미지는 피하고, 여백과 타이포그래피를 활용해 디자인을 완성하세요.

3. **애니메이션**:
   - **방향성**: 모든 애니메이션은 학습자의 시선 흐름을 자연스럽게 유도해야 합니다. (예: 왼쪽에서 오른쪽으로, 위에서 아래로)
   - **자연스러움**: \`transition: all 0.5s ease-in-out;\` 과 같이 부드러운 \`ease\` 함수를 사용하세요. 너무 빠르거나 갑작스러운 움직임은 피해주세요.

### 🚫 절대 금지사항
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
4. **Step3 경로 준수**: 이미지 폴더는 \`image/\` (복수형 아님)로 설정하여 Step3 경로와 일치시키세요


### 성능 최적화 고려사항
- **공통 리소스 활용**: styles.css, script.js, image/ 폴더를 모든 페이지가 공유
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

  // 페이지별 상세 명세 생성 (Step3 fullDescription 중심으로 변경)
  const generatePageByPageSpecification = (): string => {
    if (!step3Result) return '';

    const pageSpecs = projectData.pages.map((page, index) => {
      const step3Page = step3Result.pages[index];
      const step4Page = step4Result?.pages?.find(p => p.pageNumber === page.pageNumber);

      return `## 📄 Page ${index + 1}: ${page.topic}

### 📝 페이지 정보
- **파일명**: \`page${index + 1}.html\`
- **주제**: ${page.topic}
- **설명**: ${page.description || '설명 없음'}
- **학습 목표**: ${step3Page?.learningObjectives?.join(', ') || '기본 학습 목표'}

### 🎨 창의적 레이아웃 설계 (Step3 AI 설계 기반)
${step3Page?.fullDescription ? `
**AI 디자이너의 창의적 레이아웃 설명:**

${step3Page.fullDescription}

**구현 지침:**
- 위 설명을 바탕으로 HTML 구조와 CSS 스타일을 작성하세요
- 모든 시각적 요소와 배치 방식을 충실히 구현하세요
- 설명된 색상, 타이포그래피, 레이아웃을 정확히 반영하세요
` : '기본 교육 레이아웃을 구현하세요'}

### 🖼️ 이미지 명세 (정확한 크기와 위치 정보)
${generateImageSpecification(step3Page, step4Page, index)}

### ⚡ 상호작용 및 애니메이션 명세
${generateInteractionAndAnimationSpecification(step4Page)}

---`;
    });

    return `## 🏗️ 페이지별 창의적 설계 명세

### ⚠️ 핵심 구현 방식 변경
- **Step3 AI 설계 중심**: 각 페이지의 fullDescription을 바탕으로 창의적 레이아웃 구현
- **자유로운 HTML/CSS**: 구조화된 컴포넌트가 아닌 창의적 설계 설명 기반
- **개별 HTML 파일**: 각 페이지를 page1.html, page2.html... 형태로 분리
- **완전 독립적 동작**: 페이지 간 네비게이션 절대 금지

${pageSpecs.join('\n\n')}`;
  };

  // 더 이상 사용하지 않는 구조화된 컴포넌트 함수들
  // Step3의 fullDescription 중심으로 변경되어 이 함수들은 간소화됨

  // 이미지 배치 명세 생성 (Step3 mediaAssets 기반)
  const generateImageSpecification = (step3Page: any, step4Page: any, pageIndex: number): string => {
    if (!step3Page?.mediaAssets || step3Page.mediaAssets.length === 0) {
      return '이미지가 없습니다.';
    }

    return step3Page.mediaAssets.map((img: any, imgIndex: number) => {
      let spec = `**${imgIndex + 1}. ${img.fileName}**`;

      spec += `
   - **파일 경로**: \`${img.path}\`
   - **크기**: ${img.sizeGuide}
   - **배치 위치**: ${img.placement?.position || '메인 영역'}
   - **용도**: ${img.purpose}
   - **설명**: ${img.description}
   - **접근성**: ${img.accessibility?.altText}`;

      if (img.aiPrompt) {
        spec += `
   - **AI 생성 프롬프트**: ${img.aiPrompt}`;
      }

      // 플레이스홀더 구현 지침 추가
      const dimensions = img.sizeGuide.match(/(\d+)[×x](\d+)/);
      if (dimensions) {
        const width = dimensions[1];
        const height = dimensions[2];
        spec += `
   - **플레이스홀더**: \`https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(img.fileName.replace('.png', ''))}\``;
      }

      return spec;
    }).join('\n\n');
  };

  // 새로운 상호작용 및 애니메이션 명세 생성 (Step4 텍스트 기반)
  const generateInteractionAndAnimationSpecification = (step4Page: any): string => {
    if (!step4Page) {
      return '상호작용 및 애니메이션 설계가 없습니다. 기본적인 호버 효과와 페이드인 애니메이션을 구현하세요.';
    }

    let spec = '';

    // Step4의 애니메이션 설명 활용
    if (step4Page.animationDescription) {
      spec += `**🎬 애니메이션 구현 지침**

${step4Page.animationDescription}

`;
    }

    // Step4의 상호작용 설명 활용
    if (step4Page.interactionDescription) {
      spec += `**⚡ 상호작용 구현 지침**

${step4Page.interactionDescription}

`;
    }

    // 애니메이션과 상호작용 설명이 모두 없으면 기본 지침 제공
    if (!step4Page.animationDescription && !step4Page.interactionDescription) {
      spec = `**기본 상호작용 구현**
- 페이지 로드 시 순차적 페이드인 애니메이션
- 카드 요소에 호버 효과 (transform, box-shadow)
- 이미지 클릭 시 확대 모달
- 스크롤 기반 요소 등장 애니메이션
- 키보드 네비게이션 지원 (Tab, Enter, ESC)
- 접근성 고려 (prefers-reduced-motion 지원)

구체적인 CSS 애니메이션과 JavaScript 이벤트 핸들러를 구현하세요.`;
    }

    return spec;
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

### 🔴 최소 폰트 크기 규칙 (매우 중요!) 🔴
**모든 텍스트는 최소 18pt(24px) 이상 필수**
- 본문: 18-20pt (24-27px)
- 부제목: 22-24pt (29-32px)
- 제목: 28-36pt (37-48px)
- 작은 주석이나 캡션도 최소 18pt 유지
- **가독성을 위해 절대 18pt 미만 사용 금지**

### 🚫 페이지 독립성 규칙 (절대 위반 금지!) 🚫
- **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
- **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
- **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
- **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

${projectData.layoutMode === 'fixed' ? `### ⛔ 스크롤 절대 금지 규칙 (Fixed 레이아웃)
**이것은 가장 중요한 규칙입니다. 어떤 경우에도 타협 불가!**

1. **컨테이너 내부 스크롤 완전 금지**
   - \`overflow: hidden !important;\` 필수 적용
   - 절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
   - 모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2. **콘텐츠 양 조절 필수**
   - 텍스트가 길면 줄이고 요약하라
   - 이미지 크기를 조절하라
   - 여백과 패딩을 최적화하라
   - **절대로 스크롤로 해결하려 하지 마라**

3. **레이아웃 최적화**
   - 모든 요소의 높이를 계산하여 1000px를 초과하지 않도록 조정
   - padding은 컨테이너 크기 내에서 계산 (box-sizing: border-box 필수)
   - 콘텐츠가 많으면 그리드나 컬럼을 활용하여 가로로 배치

` : ''}`;
  };

  // JavaScript 상호작용 명세 생성
  const generateJavaScriptSpecification = (): string => {
    // Step4의 상세한 애니메이션/상호작용 설명들을 수집
    const step4AnimationDescriptions: string[] = [];
    const step4InteractionDescriptions: string[] = [];

    if (step4Result?.pages) {
      step4Result.pages.forEach(page => {
        if (page.animationDescription) {
          step4AnimationDescriptions.push(page.animationDescription);
        }
        if (page.interactionDescription) {
          step4InteractionDescriptions.push(page.interactionDescription);
        }
      });
    }

    let jsSpec = `## ⚡ JavaScript 상호작용 명세

### ⚠️ 중요 지침
각 HTML 파일은 독립적으로 작동해야 하며, 페이지 간 네비게이션 기능은 절대 구현하지 마세요.

`;

    // Step4 애니메이션 설명이 있으면 활용
    if (step4AnimationDescriptions.length > 0) {
      jsSpec += `### 🎬 Step4 애니메이션 설계 반영

**다음 Step4 애니메이션 설계를 JavaScript와 CSS로 구현하세요:**

${step4AnimationDescriptions.map((desc, idx) => `**페이지 ${idx + 1} 애니메이션:**
${desc}`).join('\n\n')}

`;
    }

    // Step4 상호작용 설명이 있으면 활용
    if (step4InteractionDescriptions.length > 0) {
      jsSpec += `### ⚡ Step4 상호작용 설계 반영

**다음 Step4 상호작용 설계를 JavaScript 이벤트 핸들러로 구현하세요:**

${step4InteractionDescriptions.map((desc, idx) => `**페이지 ${idx + 1} 상호작용:**
${desc}`).join('\n\n')}

`;
    }

    // Step4 설계 구현 체크리스트 추가
    jsSpec += `

### 📋 Step4 설계 구현 체크리스트

${step4AnimationDescriptions.length > 0 ? '✅ Step4 애니메이션 설계를 JavaScript/CSS로 정확히 구현' : '⚠️ Step4 애니메이션 설계가 없으므로 기본 애니메이션 구현'}
${step4InteractionDescriptions.length > 0 ? '✅ Step4 상호작용 설계를 이벤트 핸들러로 정확히 구현' : '⚠️ Step4 상호작용 설계가 없으므로 기본 상호작용 구현'}
✅ 접근성 기능 (키보드 네비게이션, reduced-motion) 구현
✅ 성능 최적화 (transform/opacity 기반 애니메이션)
✅ 각 페이지의 독립적 동작 보장
❌ 페이지 간 네비게이션 기능 구현 금지`;

    return jsSpec;
  };

  // 이미지 프롬프트 섹션 생성 (Step3 mediaAssets 기반)
  const generateImagePromptSection = (): string => {
    if (!step3Result) return '';

    const imagePrompts: string[] = [];

    step3Result.pages.forEach((page, pageIndex) => {
      if (page.mediaAssets && page.mediaAssets.length > 0) {
        page.mediaAssets.forEach((image, imageIndex) => {
          imagePrompts.push(`### 이미지 ${pageIndex + 1}-${imageIndex + 1}: ${image.fileName}

**AI 생성 프롬프트:**
${image.aiPrompt}

**디자인 가이드라인:**
- 무드: ${visualIdentity.moodAndTone.join(', ')}
- 색상 팔레트: 주색상 ${visualIdentity.colorPalette.primary}, 보조색상 ${visualIdentity.colorPalette.secondary}, 강조색상 ${visualIdentity.colorPalette.accent}
- 배경색: ${visualIdentity.colorPalette.background}
- 텍스트색: ${visualIdentity.colorPalette.text}
- 용도: ${image.purpose}
- 설명: ${image.description}
- 교육 대상: ${projectData.targetAudience}
- 해상도: ${image.sizeGuide}
- 접근성: ${image.accessibility?.altText}
- 교육적 목적: ${image.category} - 명확하고 이해하기 쉬운 시각적 표현

**파일 정보:**
- 저장 경로: ${image.path}
- 플레이스홀더: ${(() => {
  const dimensions = image.sizeGuide.match(/(\d+)[×x](\d+)/);
  if (dimensions) {
    return `https://via.placeholder.com/${dimensions[1]}x${dimensions[2]}/cccccc/666666?text=${encodeURIComponent(image.fileName.replace('.png', ''))}`;
  }
  return '600x400px 기본 크기';
})()}`);
        });
      }
    });

    if (imagePrompts.length === 0) {
      return `## 🖼️ 이미지 생성 명세서

이 프로젝트는 HTML/CSS 기반 시각화로 설계되어 별도의 이미지가 필요하지 않습니다.
모든 시각적 요소는 CSS로 구현되도록 설계되었습니다.`;
    }

    return `## 🖼️ 이미지 생성 명세서

아래의 이미지들을 AI 이미지 생성 도구(DALL-E, Midjourney, Stable Diffusion 등)를 사용하여 생성하고,
지정된 경로에 저장한 후 HTML에서 참조하세요.

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
              🚀 창작 브리프 생성기
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              모든 창의적 여정을 통합하여 개발자에게 영감을 주는 실행 가능한 창작 브리프를 완성합니다
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
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            ol: ({children}) => <ol className="list-decimal list-outside ml-6 mb-3 space-y-1">{children}</ol>,
                          }}
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