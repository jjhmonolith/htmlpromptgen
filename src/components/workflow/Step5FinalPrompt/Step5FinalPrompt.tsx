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

  // 통합된 프롬프트 생성 엔진 (Step4-5 통합 로직 실행)
  const generateFinalPrompt = async () => {
    setIsGenerating(true);

    try {
      // Step4-5 통합 서비스 사용
      const { IntegratedStep4And5Service } = await import('../../../services/integrated-step4-5.service');
      const { OpenAIService } = await import('../../../services/openai.service');

      // OpenAI 서비스 초기화
      const openAIService = new OpenAIService();

      // 통합 서비스 초기화
      const integratedService = new IntegratedStep4And5Service(openAIService);

      // Step4-5 통합 처리 실행
      const integratedResult = await integratedService.executeIntegratedProcess(
        projectData,
        visualIdentity,
        designTokens,
        step3Result
      );

      // 통합 결과를 상위 컴포넌트에 전달
      const finalPromptData: FinalPrompt = integratedResult.step5Result;

      setFinalPrompt(finalPromptData);
      setIsDataLoaded(true);

      // 통합된 결과를 부모 컴포넌트에 전달 (Step4와 Step5 데이터 모두)
      onComplete({
        step4Result: integratedResult.step4Result,
        step5Result: integratedResult.step5Result
      });

    } catch (error) {
      console.error('통합 프롬프트 생성 중 오류:', error);

      // 실패 시 기존 방식으로 폴백
      try {
        const htmlPrompt = compileHTMLPrompt();
        const newFinalPrompt: FinalPrompt = {
          htmlPrompt
        };
        setFinalPrompt(newFinalPrompt);
        setIsDataLoaded(true);
      } catch (fallbackError) {
        console.error('폴백 프롬프트 생성도 실패:', fallbackError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // HTML 프롬프트 컴파일 함수
  const compileHTMLPrompt = (): string => {
    const sections = [];

    // 레이아웃 및 콘텐츠 모드 조합 결정
    const isScrollable = projectData.layoutMode === 'scrollable';
    const isEnhanced = projectData.contentMode === 'enhanced';

    // 모드 조합에 따른 설명
    const getModeDescription = () => {
      if (isScrollable && isEnhanced) {
        return '📜 스크롤 가능 + ✨ AI 보강 모드 - AI가 내용을 창의적으로 확장';
      } else if (isScrollable && !isEnhanced) {
        return '📜 스크롤 가능 + 📝 원본 유지 모드 - 사용자가 입력한 내용만 사용';
      } else if (!isScrollable && isEnhanced) {
        return '🖼️ 고정 크기 + ✨ AI 보강 모드 - AI가 내용을 창의적으로 확장하되 크기 제한 준수';
      } else {
        return '🖼️ 고정 크기 + 📝 원본 유지 모드 - 사용자가 입력한 내용만 사용';
      }
    };

    // 1. 프로젝트 개요
    sections.push(`# 최종 교안 개발 프롬프트

## 1. 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃 모드**: ${isScrollable ? ':scroll: 스크롤 가능 (가로 1600px, 세로 유연)' : ':triangular_ruler: 고정 크기 (1600x1000px)'}
- **콘텐츠 모드**: ${isEnhanced ? ':sparkles: AI 보강 모드 - AI가 내용을 창의적으로 확장' : ':memo: 원본 유지 모드 - 사용자가 입력한 내용만 사용'}
${projectData.suggestions && projectData.suggestions.length > 0
  ? `- **사용자 추가 제안**: ${projectData.suggestions.join(' ')}`
  : ''}`);

    // 2. 디자인 시스템 (Step2 구조화된 데이터 정확히 반영)
    sections.push(`## 2. 디자인 시스템
- **분위기 & 톤**: ${visualIdentity.moodAndTone.join(', ')}
- **색상 팔레트 (css/style.css 에 변수로 정의할 것)**:
  --primary-color: ${visualIdentity.colorPalette.primary};
  --secondary-color: ${visualIdentity.colorPalette.secondary};
  --accent-color: ${visualIdentity.colorPalette.accent};
  --text-color: ${visualIdentity.colorPalette.text};
  --background-color: ${visualIdentity.colorPalette.background};
- **타이포그래피 (css/style.css 에 정의할 것)**:
  - Heading Font: ${visualIdentity.typography.headingFont}
  - Body Font: ${visualIdentity.typography.bodyFont}
  - Base Size: ${visualIdentity.typography.baseSize}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}`);

    // 3. 핵심 개발 요구사항 (4가지 조합별로 구분)
    sections.push(generateCoreRequirements(isScrollable, isEnhanced));

    // 4. 콘텐츠 생성 규칙 (enhanced vs restricted)
    sections.push(generateContentRules(isEnhanced));

    // 5. 페이지별 상세 구현 가이드
    sections.push(generatePageByPageSpecification());

    // 5. CSS 및 JavaScript 구현 가이드
    sections.push(generateCSSSpecification());

    // 6. 이미지 생성 명세서
    sections.push(generateImagePromptSection());

    // 7. 개선된 파일 구조 및 하이브리드 스타일링 가이드
    sections.push(`## 7. 프로젝트 폴더 구조 및 개발 가이드라인

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
  const allImages: string[] = [];

  // mediaAssets에서 이미지 수집
  if (page.mediaAssets && page.mediaAssets.length > 0) {
    page.mediaAssets.forEach(img => {
      if (img.fileName) {
        allImages.push(`│   │   ├── ${img.fileName}`);
      }
    });
  }

  // content.images에서 이미지 수집
  if (page.content && page.content.images && page.content.images.length > 0) {
    page.content.images.forEach(img => {
      const fileName = img.filename || img.fileName;
      if (fileName && !allImages.some(existingImg => existingImg.includes(fileName))) {
        allImages.push(`│   │   ├── ${fileName}`);
      }
    });
  }

  if (allImages.length > 0) {
    return `│   ├── page${pageIndex + 1}/\n${allImages.join('\n')}`;
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

  // 페이지별 상세 명세 생성 (사용자 양식 기반으로 변경)
  const generatePageByPageSpecification = (): string => {
    if (!step3Result) {
      return '## 4. 페이지별 상세 구현 가이드\n\n⚠️ Step 3 데이터가 없어 페이지별 명세를 생성할 수 없습니다. Step 3를 먼저 완료해주세요.';
    }

    const isEnhanced = projectData.contentMode === 'enhanced';

    const pageSpecs = projectData.pages.map((page, index) => {
      const step3Page = step3Result.pages[index];
      const step4Page = step4Result?.pages?.find(p => p.pageNumber === page.pageNumber);

      // Step3에서 생성된 fullDescription을 우선적으로 사용
      const pageContent = step3Page?.fullDescription ||
        `${page.topic}에 대한 기본 교육 내용입니다.\n- 주제: ${page.topic}\n- 설명: ${page.description || '페이지 설명'}`;

      if (isEnhanced) {
        // AI 보강 모드 - Step3의 fullDescription을 그대로 활용
        return `## 페이지 ${index + 1}: ${page.topic}

### 1. 페이지 구성 및 내용
\`\`\`
${pageContent}

[레이아웃 구현 지침]
- 캔버스: 너비 1600px 고정, 높이 가변(세로 스크롤)
- 좌우 여백(Safe Area): 120px(좌), 120px(우) — 콘텐츠 최대 폭 1360px
- 컬러: Primary, Secondary, Accent 색상을 활용한 조화로운 배색
- 폰트 크기: 모든 텍스트 18pt 이상 준수
- 라운딩/그림자: 부드럽고 가벼운 느낌의 카드 컴포넌트

접근성 및 가독성:
- 최소 폰트 크기 준수: 본문 18-20pt, 부제목 22-24pt, 제목 28-36pt
- 대비: 본문 텍스트와 배경 대비비 4.5:1 이상 유지
- 줄 길이: 본문 60–80자 폭 유지
- 라인하이트: 본문 1.5, 제목 1.2
\`\`\`

### 2. 페이지에 사용될 이미지
${generateImageSpecification(step3Page, step4Page, index)}

### 3. 애니메이션 및 상호작용
${generateInteractionAndAnimationSpecification(step4Page)}`;
      } else {
        // 원본 유지 모드 - 간결한 구성
        return `## 페이지 ${index + 1}: ${page.topic}

### 1. 페이지 구성 및 내용
\`\`\`
${pageContent}
\`\`\`

### 2. 페이지에 사용될 이미지
${generateImageSpecification(step3Page, step4Page, index)}

### 3. 애니메이션 및 상호작용
${generateInteractionAndAnimationSpecification(step4Page)}`;
      }
    });

    return `## 4. 페이지별 상세 구현 가이드

${pageSpecs.join('\n\n')}`;
  };

  // 더 이상 사용하지 않는 구조화된 컴포넌트 함수들
  // Step3의 fullDescription 중심으로 변경되어 이 함수들은 간소화됨

  // 이미지 배치 명세 생성 (Step3 이미지 데이터 기반)
  const generateImageSpecification = (step3Page: any, step4Page: any, pageIndex: number): string => {
    const imageSpecs: string[] = [];

    // mediaAssets 먼저 확인
    if (step3Page?.mediaAssets && step3Page.mediaAssets.length > 0) {
      step3Page.mediaAssets.forEach((img: any, imgIndex: number) => {
        let spec = `**${imgIndex + 1}. ${img.fileName}**`;

        spec += `
   - **파일 경로**: \`${img.path || `./images/page${pageIndex + 1}/${img.fileName}`}\`
   - **크기**: ${img.sizeGuide || '600x400px'}
   - **배치 위치**: ${img.placement?.position || '메인 영역'}
   - **용도**: ${img.purpose || '교육용 이미지'}
   - **설명**: ${img.description || '교육 콘텐츠 시각화'}
   - **접근성**: ${img.accessibility?.altText || img.alt || '교육용 이미지'}`;

        if (img.aiPrompt) {
          spec += `
   - **AI 생성 프롬프트**: ${img.aiPrompt}`;
        }

        // 플레이스홀더 구현 지침 추가
        const sizeGuide = img.sizeGuide || '600x400';
        const dimensions = sizeGuide.match(/(\d+)[×x](\d+)/);
        if (dimensions) {
          const width = dimensions[1];
          const height = dimensions[2];
          spec += `
   - **플레이스홀더**: \`https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent((img.fileName || 'image').replace('.png', ''))}\``;
        }

        imageSpecs.push(spec);
      });
    }

    // content.images도 확인
    if (step3Page?.content && step3Page.content.images && step3Page.content.images.length > 0) {
      step3Page.content.images.forEach((img: any, imgIndex: number) => {
        // 이미 mediaAssets에서 처리된 이미지인지 확인
        const alreadyProcessed = step3Page.mediaAssets && step3Page.mediaAssets.some((ma: any) =>
          ma.fileName === img.filename || ma.fileName === img.fileName
        );

        if (!alreadyProcessed) {
          let spec = `**${imageSpecs.length + 1}. ${img.filename || img.fileName}**`;

          spec += `
   - **파일 경로**: \`./images/page${pageIndex + 1}/${img.filename || img.fileName}\`
   - **크기**: ${img.width && img.height ? `${img.width}x${img.height}px` : '600x400px'}
   - **배치 위치**: ${img.placement || img.section || '메인 영역'}
   - **용도**: ${img.purpose || '교육용 이미지'}
   - **설명**: ${img.alt || img.description || '교육 콘텐츠 시각화'}
   - **접근성**: ${img.alt || '교육용 이미지'}`;

          if (img.aiPrompt) {
            spec += `
   - **AI 생성 프롬프트**: ${img.aiPrompt}`;
          }

          // 플레이스홀더 구현 지침 추가
          const width = img.width || 600;
          const height = img.height || 400;
          spec += `
   - **플레이스홀더**: \`https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent((img.filename || img.fileName || 'image').replace('.png', ''))}\``;

          imageSpecs.push(spec);
        }
      });
    }

    if (imageSpecs.length === 0) {
      return '이미지가 없습니다.';
    }

    return imageSpecs.join('\n\n');
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

  // 핵심 개발 요구사항 생성 (4가지 조합별)
  const generateCoreRequirements = (isScrollable: boolean, isEnhanced: boolean): string => {
    if (isScrollable && isEnhanced) {
      // 스크롤 가능 + AI 보강 모드
      return `## 3. 핵심 개발 요구사항

### :scroll: 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1.  **가로 고정, 세로 유연**
    *   가로: 1600px 고정
    *   세로: 콘텐츠 양에 따라 자유롭게 확장
    *   \`overflow-x: hidden; overflow-y: auto;\` 적용
    *   최소 높이 1000px 유지

2.  **콘텐츠 우선 배치**
    *   콘텐츠의 자연스러운 흐름 유지
    *   적절한 여백으로 가독성 확보
    *   섹션 간 충분한 간격 유지
    *   길이 제한 없이 완전한 정보 전달

3.  **반응형 요소 설계**
    *   이미지는 최대 너비 제한 (max-width: 100%)
    *   긴 콘텐츠는 섹션별로 구분
    *   스크롤 진행에 따른 애니메이션 고려 가능

4.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

5.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
1.  **프로젝트 폴더 구조**: 다음과 같은 체계적인 폴더 구조로 결과물을 구성해주세요.
    *   \`/\` (root)
        *   \`page1.html\`, \`page2.html\`, ...
        *   \`css/\`
            *   \`style.css\` (폰트, 색상 등 모든 공통 스타일)
        *   \`js/\`
            *   \`script.js\` (모든 상호작용 관련 JavaScript)
        *   \`images/\`
            *   \`page1/\`
                *   \`1.png\`
            *   \`README.md\`
2.  **하이브리드 스타일링**:
    *   **공통 스타일**: \`css/style.css\`에는 폰트, 색상 변수, 공통 버튼 스타일 등 프로젝트 전반에 사용될 스타일을 정의하세요.
    *   **페이지 전용 스타일**: 각 HTML 파일의 \`<head>\` 안에 \`<style>\` 태그를 사용하여, 해당 페이지에만 적용되는 복잡하고 창의적인 레이아웃(Grid, Flexbox 등)을 자유롭게 작성하세요. 이를 통해 각 페이지의 디자인 품질을 극대화하세요.
3.  **완전히 독립된 페이지**: 각 페이지는 그 자체로 완결된 하나의 독립적인 웹페이지입니다. **절대로** 다른 페이지로 이동하는 링크, '다음'/'이전' 버튼, 메뉴, 또는 외부 사이트로 나가는 하이퍼링크를 포함해서는 안 됩니다.
4.  **이미지 관리**:
    *   **경로**: 이미지는 반드시 페이지별 하위 폴더에 저장하고, HTML에서는 \`<img src="./images/page1/1.png">\` 와 같은 상대 경로를 사용해야 합니다.
    *   **파일명 규칙**: 각 페이지별로 \`1.png\`, \`2.png\` 형태로 순차적으로 번호를 부여합니다"

### :sparkles: 디자인 및 애니메이션 가이드라인
1.  **디자인 시스템 준수**: 아래에 정의된 '디자인 시스템'의 색상, 타이포그래피, 스타일 가이드를 모든 페이지에서 일관되게 적용해주세요.
2.  **이미지 사용 최소화**: 학습 내용에 필수적인 이미지만 사용하세요. 의미 없는 장식용 이미지는 피하고, 여백과 타이포그래피를 활용해 디자인을 완성하세요.
3.  **애니메이션**:
    *   **방향성**: 모든 애니메이션은 학습자의 시선 흐름을 자연스럽게 유도해야 합니다. (예: 왼쪽에서 오른쪽으로, 위에서 아래로)
    *   **자연스러움**: \`transition: all 0.5s ease-in-out;\` 과 같이 부드러운 \`ease\` 함수를 사용하세요. 너무 빠르거나 갑작스러운 움직임은 피해주세요.`;
    } else if (isScrollable && !isEnhanced) {
      // 스크롤 가능 + 원본 유지 모드
      return `## 3. 핵심 개발 요구사항

### :scroll: 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1.  **가로 고정, 세로 유연**
    *   가로: 1600px 고정
    *   세로: 콘텐츠 양에 따라 자유롭게 확장
    *   \`overflow-x: hidden; overflow-y: auto;\` 적용
    *   최소 높이 1000px 유지

2.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

3.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**간결하고 효율적인 구현을 우선시합니다.**`;
    } else if (!isScrollable && isEnhanced) {
      // 고정 크기 + AI 보강 모드
      return `## 3. 핵심 개발 요구사항

### :triangular_ruler: 고정 크기 레이아웃 규칙 + AI 창의적 확장
**1600x1000px 고정 크기 내에서 AI가 창의적으로 콘텐츠를 확장합니다.**

1.  **:no_entry: 스크롤 절대 금지 규칙**
    *   \`overflow: hidden !important;\` 필수 적용
    *   절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
    *   모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2.  **콘텐츠 양 조절 필수**
    *   AI가 확장한 텍스트가 길면 요약하고 핵심만 유지
    *   이미지 크기를 조절하라
    *   여백과 패딩을 최적화하라
    *   **절대로 스크롤로 해결하려 하지 마라**

3.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

4.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**크기 제한을 엄격히 준수하면서도 창의적인 확장을 수행합니다.**`;
    } else {
      // 고정 크기 + 원본 유지 모드
      return `## 3. 핵심 개발 요구사항

### :no_entry: 스크롤 절대 금지 규칙
**이것은 가장 중요한 규칙입니다. 어떤 경우에도 타협 불가!**

1.  **컨테이너 내부 스크롤 완전 금지**
    *   \`overflow: hidden !important;\` 필수 적용
    *   절대로 \`overflow: auto\`, \`overflow: scroll\`, \`overflow-y: auto\` 사용 금지
    *   모든 콘텐츠는 1600x1000px 안에 완벽히 수납되어야 함

2.  **콘텐츠 양 조절 필수**
    *   텍스트가 길면 줄이고 요약하라
    *   이미지 크기를 조절하라
    *   여백과 패딩을 최적화하라
    *   **절대로 스크롤로 해결하려 하지 마라**

3.  **레이아웃 최적화**
    *   모든 요소의 높이를 계산하여 1000px를 초과하지 않도록 조정
    *   padding은 컨테이너 크기 내에서 계산 (box-sizing: border-box 필수)
    *   콘텐츠가 많으면 그리드나 컬럼을 활용하여 가로로 배치

4.  **:red_circle: 최소 폰트 크기 규칙 (매우 중요!) :red_circle:**
    *   **모든 텍스트는 최소 18pt(24px) 이상**
    *   본문: 18-20pt (24-27px)
    *   부제목: 22-24pt (29-32px)
    *   제목: 28-36pt (37-48px)
    *   작은 주석이나 캡션도 최소 18pt 유지
    *   **가독성을 위해 절대 18pt 미만 사용 금지**

5.  **:no_entry_sign: 페이지 독립성 규칙 (절대 위반 금지!) :no_entry_sign:**
    *   **네비게이션 요소 완전 금지**: 다음/이전 버튼, 페이지 번호, 진행률 표시 등 절대 금지
    *   **페이지 간 링크 금지**: 다른 HTML 파일로의 링크나 참조 절대 금지
    *   **각 페이지는 완전히 독립적**: 다른 페이지의 존재를 암시하는 요소 금지
    *   **페이지 표시 금지**: "1/5", "페이지 1", "다음으로" 같은 표현 절대 사용 금지

### :hammer_and_wrench: 기술적 개발 규칙
**간결하고 효율적인 구현을 우선시합니다.**`;
    }
  };

  // 콘텐츠 생성 규칙 생성 (enhanced vs restricted)
  const generateContentRules = (isEnhanced: boolean): string => {
    if (isEnhanced) {
      return `## 4. 콘텐츠 생성 규칙

### :pushpin: 콘텐츠 생성 규칙

- **AI 보강 모드 활성화**: 내용을 창의적으로 확장하고 보강
- **학습 효과 극대화**: 추가 설명, 예시, 시각 자료 적극 활용
- **풍부한 콘텐츠**: 학습자의 이해를 돕는 다양한 요소 추가
- **창의적 표현**: 교육적 가치를 높이는 콘텐츠 생성`;
    } else {
      return `## 4. 콘텐츠 생성 규칙

### :pushpin: 콘텐츠 생성 규칙

- **원본 유지 모드 활성화**: 사용자가 입력한 내용만을 정확히 사용
- **추가 내용 생성 금지**: AI의 창의적 확장이나 보강 금지
- **레이아웃 중심**: 주어진 내용을 효과적으로 배치하는 것에 집중
- **시각적 표현 최적화**: 제한된 내용으로도 효과적인 학습 경험 제공`;
    }
  };

  // CSS 스타일 명세 생성 (간소화 버전)
  const generateCSSSpecification = (): string => {
    return `## 5. CSS 및 JavaScript 구현 가이드

### CSS 구현 지침
- **공통 스타일 파일**: css/style.css에 색상 변수, 폰트, 공통 컴포넌트 스타일 정의
- **페이지별 스타일**: 각 HTML 파일의 <head> 내 <style> 태그에 고유 레이아웃 구현
- **디자인 시스템 준수**: 위에 정의된 색상 팔레트와 타이포그래피 시스템 일관 적용
- **반응형 요소**: 이미지는 max-width: 100%, 적절한 여백과 간격 유지

### JavaScript 구현 지침
- **상호작용 스크립트**: js/script.js에 모든 페이지 공통 기능 구현
- **페이지별 기능**: 필요시 각 HTML 파일에 페이지 전용 스크립트 추가
- **접근성 고려**: 키보드 네비게이션, prefers-reduced-motion 지원
- **성능 최적화**: transform/opacity 기반 애니메이션, 부드러운 전환 효과`;
  };


  // 이미지 프롬프트 섹션 생성 (Step3 이미지 데이터 기반)
  const generateImagePromptSection = (): string => {
    if (!step3Result) return '';

    const imagePrompts: string[] = [];

    step3Result.pages.forEach((page, pageIndex) => {
      // mediaAssets 먼저 확인
      if (page.mediaAssets && page.mediaAssets.length > 0) {
        page.mediaAssets.forEach((image, imageIndex) => {
          imagePrompts.push(`### 이미지 ${pageIndex + 1}-${imageIndex + 1}: ${image.fileName}

**AI 생성 프롬프트:**
${image.aiPrompt || '기본 이미지 생성 프롬프트'}

**디자인 가이드라인:**
- 무드: ${visualIdentity.moodAndTone.join(', ')}
- 색상 팔레트: 주색상 ${visualIdentity.colorPalette.primary}, 보조색상 ${visualIdentity.colorPalette.secondary}, 강조색상 ${visualIdentity.colorPalette.accent}
- 배경색: ${visualIdentity.colorPalette.background}
- 텍스트색: ${visualIdentity.colorPalette.text}
- 용도: ${image.purpose || '교육용 이미지'}
- 설명: ${image.description || '교육 콘텐츠 시각화'}
- 교육 대상: ${projectData.targetAudience}
- 해상도: ${image.sizeGuide || '600x400px'}
- 접근성: ${image.accessibility?.altText || image.alt || '교육용 이미지'}
- 교육적 목적: ${image.category || '시각적 학습 보조'} - 명확하고 이해하기 쉬운 시각적 표현

**파일 정보:**
- 저장 경로: ${image.path || `./images/page${pageIndex + 1}/${image.fileName}`}
- 플레이스홀더: ${(() => {
  const sizeGuide = image.sizeGuide || '600x400';
  const dimensions = sizeGuide.match(/(\d+)[×x](\d+)/);
  if (dimensions) {
    return `https://via.placeholder.com/${dimensions[1]}x${dimensions[2]}/cccccc/666666?text=${encodeURIComponent((image.fileName || 'image').replace('.png', ''))}`;
  }
  return 'https://via.placeholder.com/600x400/cccccc/666666?text=Image';
})()}`);
        });
      }

      // content.images도 확인 (Step3에서 다른 구조로 저장될 수 있음)
      if (page.content && page.content.images && page.content.images.length > 0) {
        page.content.images.forEach((image, imageIndex) => {
          // 이미 mediaAssets에서 처리된 이미지인지 확인
          const alreadyProcessed = page.mediaAssets && page.mediaAssets.some(ma =>
            ma.fileName === image.filename || ma.fileName === image.fileName
          );

          if (!alreadyProcessed) {
            imagePrompts.push(`### 이미지 ${pageIndex + 1}-${imageIndex + 1}: ${image.filename || image.fileName}

**AI 생성 프롬프트:**
${image.aiPrompt || `${projectData.targetAudience}를 위한 ${image.purpose || '교육용'} 이미지. ${image.alt || image.description || '학습 내용을 시각적으로 표현'}. 밝고 친근한 스타일로 제작.`}

**디자인 가이드라인:**
- 무드: ${visualIdentity.moodAndTone.join(', ')}
- 색상 팔레트: 주색상 ${visualIdentity.colorPalette.primary}, 보조색상 ${visualIdentity.colorPalette.secondary}, 강조색상 ${visualIdentity.colorPalette.accent}
- 배경색: ${visualIdentity.colorPalette.background}
- 텍스트색: ${visualIdentity.colorPalette.text}
- 용도: ${image.purpose || '교육용 이미지'}
- 설명: ${image.alt || image.description || '교육 콘텐츠 시각화'}
- 교육 대상: ${projectData.targetAudience}
- 해상도: ${image.width && image.height ? `${image.width}x${image.height}px` : '600x400px'}
- 접근성: ${image.alt || '교육용 이미지'}
- 교육적 목적: 시각적 학습 보조 - 명확하고 이해하기 쉬운 시각적 표현

**파일 정보:**
- 저장 경로: ./images/page${pageIndex + 1}/${image.filename || image.fileName}
- 플레이스홀더: ${(() => {
  const width = image.width || 600;
  const height = image.height || 400;
  return `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent((image.filename || image.fileName || 'image').replace('.png', ''))}`;
})()}`);
          }
        });
      }
    });

    if (imagePrompts.length === 0) {
      return `## 6. 이미지 생성 명세서

이 프로젝트는 HTML/CSS 기반 시각화로 설계되어 별도의 이미지가 필요하지 않습니다.
모든 시각적 요소는 CSS로 구현되도록 설계되었습니다.`;
    }

    return `## 6. 이미지 생성 명세서

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
    // 통합된 결과를 전달하기 위해 수정
    if (finalPrompt) {
      onComplete({
        step5Result: finalPrompt
      });
    }
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
                            : finalPrompt.htmlPrompt.split('## 6. 이미지 생성 명세서')[1] || '이미지 프롬프트 섹션을 생성 중입니다...'
                          }
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {activeSection === 'main'
                          ? finalPrompt.htmlPrompt
                          : finalPrompt.htmlPrompt.split('## 6. 이미지 생성 명세서')[1] || '이미지 프롬프트 섹션을 생성 중입니다...'
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