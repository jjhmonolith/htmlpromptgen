import { 
  ProjectData, 
  VisualIdentity, 
  LayoutProposal, 
  PageEnhancement, 
  FinalPrompt,
  ImagePrompt
} from '../types/workflow.types';

export class FinalPromptService {
  /**
   * 이전 4단계의 데이터를 통합하여 최종 프롬프트를 생성합니다 (AI 사용 없음)
   */
  async generateFinalPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): Promise<FinalPrompt> {
    try {
      console.log('Step5: 데이터 통합 시작 (AI 사용 없음)');
      
      // 지연 시뮬레이션 (실제 생성 과정 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // HTML 개발 프롬프트 생성
      const htmlPrompt = this.buildHtmlPrompt(projectData, visualIdentity, layoutProposals, pageEnhancements);
      
      // 이미지 생성 프롬프트들 생성
      const imagePrompts = this.buildImagePrompts(projectData, visualIdentity, layoutProposals);
      
      const finalPrompt: FinalPrompt = {
        htmlPrompt,
        imagePrompts,
        metadata: {
          generatedAt: new Date(),
          version: '1.0'
        }
      };

      console.log('Step5: 최종 프롬프트 생성 완료');
      return finalPrompt;

    } catch (error) {
      console.error('Step5: 최종 프롬프트 생성 실패:', error);
      throw new Error(`최종 프롬프트 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * HTML 개발 프롬프트 생성 (템플릿 기반)
   */
  private buildHtmlPrompt(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): string {
    const layoutRules = this.getLayoutRules(projectData.layoutMode);
    
    return `# ${projectData.projectTitle} - 교육 콘텐츠 개발 프롬프트

## 1. 프로젝트 정보
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃**: ${projectData.layoutMode === 'scrollable' ? '📜 스크롤 가능 (1600px 너비, 세로 스크롤)' : '📐 고정 크기 (1600x1000px)'}
- **콘텐츠 모드**: ${projectData.contentMode === 'enhanced' ? '✨ AI 보강 (교육적 요소 강화)' : '📝 원본 유지 (정확한 전달)'}

## 2. 비주얼 아이덴티티
- **분위기**: ${visualIdentity.moodAndTone}
- **색상 팔레트**:
  - Primary: ${visualIdentity.colorPalette.primary}
  - Secondary: ${visualIdentity.colorPalette.secondary}
  - Accent: ${visualIdentity.colorPalette.accent}
  - Text: ${visualIdentity.colorPalette.text}
  - Background: ${visualIdentity.colorPalette.background}
- **타이포그래피**:
  - 제목: ${visualIdentity.typography.headingFont}
  - 본문: ${visualIdentity.typography.bodyFont}
  - 기본 크기: ${visualIdentity.typography.baseSize}
- **컴포넌트 스타일**: ${visualIdentity.componentStyle}

${layoutRules}

## 4. 기술적 개발 규칙

### 전문적 프로젝트 구조:
\`\`\`
/${projectData.projectTitle.replace(/\s+/g, '_')}/
├── pages/
│   ${projectData.pages.map((page, index) => `├── ${index + 1}_${page.topic.replace(/\s+/g, '_')}.html`).join('\n│   ')}
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── components.css
│   │   ├── animations.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── main.js
│   │   ├── animations.js
│   │   ├── interactions.js
│   │   └── utils.js
│   ├── images/
│   │   ${this.getAllImageNames(layoutProposals).map(name => `├── ${name}`).join('\n│   │   ')}
│   └── fonts/
│       ├── headers/
│       └── body/
├── libs/
│   ├── gsap.min.js
│   ├── intersection-observer.js
│   └── particles.js
└── config/
    ├── variables.css
    └── mixins.css
\`\`\`

### 고급 개발 워크플로:
1. **HTML 구조 설계** (시맨틱 마크업, 접근성 고려)
2. **CSS 아키텍처 구축** (BEM 방법론, CSS 커스텀 프로퍼티)
3. **JavaScript 모듈 시스템** (ES6 모듈, 이벤트 위임)
4. **애니메이션 라이브러리 통합** (GSAP, CSS 애니메이션 최적화)
5. **성능 최적화** (지연 로딩, 인터섹션 옵저버)
6. **이미지 자리표시자 시스템** (WebP 지원, 반응형 이미지)

${this.buildPageImplementations(projectData, layoutProposals, pageEnhancements)}

## 💎 고급 개발 기법 적용 지침

### CSS 아키텍처 (BEM + CSS 커스텀 프로퍼티)
\`\`\`css
/* config/variables.css */
:root {
  --color-primary: #3e88ff;
  --color-secondary: #10B981;
  --gradient-main: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  --shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.37);
  --backdrop-blur: blur(4px);
  --animation-duration: 0.6s;
  --animation-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

/* BEM 명명 규칙 예시 */
.card {}
.card__header {}
.card__content {}
.card--featured {}
.card--glassmorphism {}
\`\`\`

### JavaScript 모듈 시스템
\`\`\`javascript
// assets/js/main.js (Entry Point)
import { AnimationController } from './animations.js';
import { InteractionManager } from './interactions.js';
import { ImageLoader } from './utils.js';

class App {
  constructor() {
    this.animationController = new AnimationController();
    this.interactionManager = new InteractionManager();
    this.imageLoader = new ImageLoader();
  }
  
  init() {
    this.setupEventListeners();
    this.animationController.initPageAnimations();
    this.imageLoader.loadImages();
  }
}

new App().init();
\`\`\`

### GSAP 애니메이션 통합
\`\`\`javascript
// assets/js/animations.js
import { gsap } from '../libs/gsap.min.js';

export class AnimationController {
  initPageAnimations() {
    // 텍스트 타이핑 애니메이션
    this.initTypewriterEffect();
    // 3D 카드 효과
    this.init3DCardEffects();
    // 파티클 시스템
    this.initParticleSystem();
  }
  
  initTypewriterEffect() {
    const textElements = document.querySelectorAll('[data-typewriter]');
    textElements.forEach(element => {
      gsap.from(element, {
        text: "",
        duration: 2,
        ease: "none",
        delay: element.dataset.delay || 0
      });
    });
  }
}
\`\`\`

## 🖼️ 이미지 자리표시자 시스템 (필수)

### 이미지 처리 원칙
- **아이콘 대신 실제 이미지 공간 확보**: 이미지 아이콘(📷, 🖼️)을 사용하지 말고 실제 크기의 자리표시자 박스 생성
- **자동 이미지 로딩**: images/ 폴더에 이미지가 있으면 자동으로 로드되도록 구현
- **폴백 시스템**: 이미지가 없을 때만 자리표시자 표시

### 구현 방법
\`\`\`html
<!-- 예시: 이미지 자리표시자 -->
<div class="image-placeholder" data-image="hero_image_1.jpg" style="width: 400px; height: 300px;">
  <img src="images/hero_image_1.jpg" alt="메인 이미지" 
       style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;"
       onerror="this.style.display='none'; this.parentElement.classList.add('fallback');">
  <div class="fallback-content" style="display: none;">
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                background: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px;">
      <div style="text-align: center; color: #666;">
        <div style="font-size: 48px; margin-bottom: 8px;">🖼️</div>
        <div style="font-size: 14px;">[hero_image_1.jpg]</div>
        <div style="font-size: 12px; margin-top: 4px;">400×300px</div>
      </div>
    </div>
  </div>
</div>

<style>
.image-placeholder.fallback .fallback-content {
  display: block !important;
}
</style>
\`\`\`

### JavaScript 이미지 로더 (필수 포함)
\`\`\`javascript
// 이미지 자동 로딩 시스템
document.addEventListener('DOMContentLoaded', function() {
  const imageContainers = document.querySelectorAll('.image-placeholder');
  
  imageContainers.forEach(container => {
    const img = container.querySelector('img');
    const fallback = container.querySelector('.fallback-content');
    
    if (img) {
      img.onload = function() {
        fallback.style.display = 'none';
        this.style.display = 'block';
      };
      
      img.onerror = function() {
        this.style.display = 'none';
        container.classList.add('fallback');
        fallback.style.display = 'block';
      };
    }
  });
});
\`\`\`

## 🚨 핵심 개발 규칙 (필수 준수)

### 파일 구조 및 아키텍처
- **모듈식 구조**: CSS와 JS를 별도 파일로 분리, assets/ 폴더 구조 준수
- **BEM 명명 규칙**: 모든 CSS 클래스는 BEM 방법론 적용
- **ES6 모듈**: JavaScript는 모듈 시스템 사용, import/export 활용
- **CSS 커스텀 프로퍼티**: :root 변수 시스템으로 디자인 토큰 관리

### 성능 및 최적화
- **지연 로딩**: 이미지와 애니메이션은 Intersection Observer 활용
- **GSAP 최적화**: 애니메이션 라이브러리 통합으로 부드러운 모션
- **파티클 시스템**: Canvas 또는 WebGL 기반 입체적 효과
- **반응형 이미지**: srcset과 WebP 형식 지원

### 디자인 시스템
- **창의적 UI**: 글래스모피즘, 네오모피즘, 브루탈리즘 등 현대적 스타일
- **3D 효과**: transform3d, perspective 활용한 입체감
- **그라디언트 활용**: 복잡한 색상 블렌딩과 메쉬 그라디언트
- **마이크로 인터랙션**: 섬세한 호버 효과와 상태 변화

### 접근성 및 품질
- ${projectData.layoutMode === 'scrollable' ? '스크롤 가능한 레이아웃으로 콘텐츠 양에 따라 높이 조정' : '정확히 1600x1000px 크기로 제한'}
- **이미지는 반드시 위의 자리표시자 시스템 사용**
- 모든 텍스트는 최소 18pt(24px) 이상 사용
- 접근성(WCAG AA) 기준 준수
- ${projectData.targetAudience}에 최적화된 고급 사용자 경험 제공`;
  }

  /**
   * 이미지 생성 프롬프트들 생성
   */
  private buildImagePrompts(
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    layoutProposals: LayoutProposal[]
  ): ImagePrompt[] {
    const imagePrompts: ImagePrompt[] = [];

    layoutProposals.forEach(layout => {
      layout.images.forEach(image => {
        const prompt = this.buildSingleImagePrompt(
          image.description,
          projectData,
          visualIdentity,
          layout.pageTitle
        );

        imagePrompts.push({
          pageId: layout.pageId,
          imageName: image.filename,
          prompt
        });
      });
    });

    return imagePrompts;
  }

  /**
   * 개별 이미지 프롬프트 생성
   */
  private buildSingleImagePrompt(
    imageDescription: string,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    pageTitle: string
  ): string {
    const moodKeywords = visualIdentity.moodAndTone.split(',').map(s => s.trim());
    const primaryColor = visualIdentity.colorPalette.primary;
    
    return `${projectData.targetAudience}를 위한 교육 콘텐츠용 이미지. ${imageDescription}. 
스타일: ${moodKeywords.join(', ')}, 주요 색상: ${primaryColor} 계열, 
${projectData.layoutMode === 'scrollable' ? '부드럽고 친근한' : '선명하고 임팩트 있는'} 비주얼, 
고품질 교육 자료, 페이지 주제: ${pageTitle}`;
  }

  /**
   * 페이지별 완전한 구현 명세 생성 (모든 Step3 정보 포함)
   */
  private buildPageImplementations(
    projectData: ProjectData,
    layoutProposals: LayoutProposal[],
    pageEnhancements: PageEnhancement[]
  ): string {
    return `## 5. 페이지별 완전한 구현 명세

${layoutProposals.map((layout, index) => {
  const enhancement = pageEnhancements[index];
  const page = projectData.pages[index];
  
  return `### 📄 페이지 ${page.pageNumber}: ${layout.pageTitle}

#### 1. 전체 레이아웃 구성 및 개요
${layout.layoutDescription}

#### 2. 🎨 디자인 시스템 상세 명세
- **기본 레이아웃 전략**: ${layout.designSpecs?.primaryLayout || '표준 레이아웃'}
- **색상 체계**: ${layout.designSpecs?.colorScheme || '기본 색상 조합'}
- **타이포그래피 시스템**: ${layout.designSpecs?.typography || '기본 폰트 체계'}
- **간격 시스템**: ${layout.designSpecs?.spacing || '표준 간격'}
- **시선 흐름 설계**: ${layout.designSpecs?.visualFlow || '상단→하단 흐름'}
- **교육 전략**: ${layout.designSpecs?.educationalStrategy || '기본 학습 지원'}
- **인터랙션 준비**: ${layout.designSpecs?.interactionReadiness || '준비 완료'}

#### 3. 📐 컴포넌트별 레이아웃 및 인터랙션 완전 명세
${this.buildComponentIntegrations(layout, enhancement)}

#### 4. 🖼️ 이미지 자리표시자 구현 명세
${layout.images?.map((img, idx) => `
**이미지 ${idx + 1}**: \`${img.filename}\`
- **상세 설명**: ${img.description}
- **배치 정보**: ${img.position || '기본 배치'}
- **교육적 역할**: 콘텐츠 이해 증진 및 시각적 학습 지원

**구현 코드**:
\`\`\`html
<div class="image-placeholder" data-image="${img.filename}" style="${this.getImageStyleFromPosition(img.position)}">
  <img src="images/${img.filename}" alt="${img.description}" 
       style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;"
       onerror="this.style.display='none'; this.parentElement.classList.add('fallback');">
  <div class="fallback-content" style="display: none;">
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                background: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px;">
      <div style="text-align: center; color: #666;">
        <div style="font-size: 48px; margin-bottom: 8px;">🖼️</div>
        <div style="font-size: 14px;">[${img.filename}]</div>
        <div style="font-size: 12px; margin-top: 4px;">이미지 대기 중</div>
      </div>
    </div>
  </div>
</div>
\`\`\`
`).join('') || '이미지 정보 없음'}

#### 5. 🎬 페이지 레벨 애니메이션 명세
**페이지 로드 시퀀스**:
${enhancement?.pageTransitions?.pageLoad?.sequence?.map((step, idx) => 
  `
**${idx + 1}단계**: ${step.elements.join(', ')}
- 지연시간: \`${step.delay}\`
- 시각적 효과: ${step.description}
`).join('') || '- 기본 페이지 로드 시퀀스'}

**글로벌 애니메이션 정책**:
- **스크롤 동작**: ${enhancement?.globalAnimations?.scrollBehavior || '부드러운 스크롤'}
- **반응형 최적화**: ${enhancement?.globalAnimations?.responsiveAnimations || '디바이스별 최적화'}
- **성능 최적화**: ${enhancement?.globalAnimations?.performanceOptimizations || 'transform/opacity 최적화'}

**페이지 전환 애니메이션**:
- **진입 애니메이션**: ${enhancement?.pageTransitions?.pageLoad?.sequence?.[0]?.description || '아래에서 위로 부드럽게 슬라이드'}
- **이탈 애니메이션**: ${enhancement?.pageTransitions?.pageExit?.description || '위로 슬라이드되며 사라짐'}

---
`;
}).join('\n')}`;
  }

  /**
   * 고정형 레이아웃 설명 생성 (layoutDescription이 없는 경우)
   */
  private buildFixedLayoutDescription(layout: LayoutProposal): string {
    if (!layout.layoutDescription) return '레이아웃 정보가 없습니다.';
    
    return layout.layoutDescription;
  }

  /**
   * 레이아웃별 규칙 생성
   */
  private getLayoutRules(layoutMode: 'fixed' | 'scrollable'): string {
    if (layoutMode === 'scrollable') {
      return `## 3. 📜 스크롤 가능 레이아웃 규칙

**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1. **가로 고정, 세로 유연**
   * 가로: 1600px 고정
   * 세로: 콘텐츠 양에 따라 자유롭게 확장
   * \`overflow-x: hidden; overflow-y: auto;\` 적용
   * 최소 높이 1000px 유지

2. **콘텐츠 우선 배치**
   * 콘텐츠의 자연스러운 흐름 유지
   * 적절한 여백으로 가독성 확보
   * 섹션 간 충분한 간격 유지
   * 길이 제한 없이 완전한 정보 전달

3. **반응형 요소 설계**
   * 이미지는 최대 너비 제한 (max-width: 100%)
   * 긴 콘텐츠는 섹션별로 구분
   * 스크롤 진행에 따른 애니메이션 고려 가능`;
    } else {
      return `## 3. 📐 고정 크기 레이아웃 규칙

**1600x1000px 크기에 모든 콘텐츠를 최적화하여 배치합니다.**

1. **엄격한 크기 제한**
   * 정확히 1600x1000px 크기
   * \`overflow: hidden\` 적용
   * 스크롤 절대 금지

2. **최대 정보 밀도**
   * 여백 최소화로 공간 효율 극대화
   * 핵심 정보 우선 배치
   * 압축적이고 효과적인 표현

3. **즉시 완결된 경험**
   * 스크롤 없이 모든 정보 제공
   * 첫 화면에서 완전한 이해 가능
   * 강력한 시각적 임팩트`;
    }
  }

  /**
   * 컴포넌트별로 레이아웃과 애니메이션을 통합하여 설명 생성
   */
  private buildComponentIntegrations(layout: LayoutProposal, enhancement?: PageEnhancement): string {
    if (!layout.detailedElements || layout.detailedElements.length === 0) {
      return '상세 컴포넌트 정보 없음';
    }

    return layout.detailedElements.map((element, idx) => {
      // 해당 요소의 애니메이션 정보 찾기
      const elementAnimation = enhancement?.elementInteractions?.find(
        interaction => interaction.elementId === element.elementName || 
                     interaction.elementId.includes(element.elementName) ||
                     element.elementName.includes(interaction.elementId)
      );

      return `
**${idx + 1}. ${element.elementName}** \`(${element.elementType})\`

**📐 레이아웃 명세**:
- **정확한 위치 및 크기**:
  - 위치: \`top: ${element.position.top}, left: ${element.position.left}\`
  - 크기: \`width: ${element.position.width}, height: ${element.position.height}\`
- **상세 스타일링**:
${Object.entries(element.styling || {}).map(([key, value]) => `  - \`${key}\`: ${value}`).join('\n')}
- **콘텐츠**: ${element.content}
- **교육적 목적**: ${element.purpose}

**🎬 인터랙션 및 애니메이션**:
${elementAnimation ? `
- **로드 애니메이션**:
  - 타입: ${elementAnimation.loadAnimation?.type || '기본'}
  - 지속시간: ${elementAnimation.loadAnimation?.duration || '600ms'}
  - 지연시간: ${elementAnimation.loadAnimation?.delay || '0ms'}
  - 타이밍: ${elementAnimation.loadAnimation?.timing || 'ease-out'}
  - 키프레임: ${elementAnimation.loadAnimation?.keyframes || '기본 전환'}
  - **교육적 목적**: ${elementAnimation.loadAnimation?.educationalPurpose || '사용자 주의 집중'}

- **인터랙션 상태들**:
${Object.entries(elementAnimation.interactionStates || {}).map(([state, stateData]: [string, any]) => 
  `  - **${state}**: ${stateData.description} (${Object.keys(stateData.styling || {}).length}개 스타일 속성)`
).join('\n') || '  - 기본 상태만 적용'}

- **피드백 애니메이션**:
${Object.entries(elementAnimation.feedbackAnimations || {}).map(([type, feedback]: [string, any]) => 
  `  - **${type}**: ${feedback.animation} (${feedback.duration})`
).join('\n') || '  - 기본 피드백 적용'}

- **접근성 지원**:
  - ARIA 레이블: ${elementAnimation.technicalSpecs?.accessibility?.ariaLabels || '기본 접근성'}
  - 키보드 지원: ${elementAnimation.technicalSpecs?.accessibility?.keyboardSupport || '기본 키보드 지원'}
  - 스크린리더: ${elementAnimation.technicalSpecs?.accessibility?.screenReader || '기본 스크린리더 지원'}
` : `- **인터랙션 플레이스홀더**: ${element.interactionPlaceholder}
- **기본 애니메이션**: 부드러운 등장 효과 적용
- **기본 접근성**: 표준 접근성 지원`}

---`;
    }).join('\n');
  }

  /**
   * 이미지 위치 정보를 CSS 스타일로 변환
   */
  private getImageStyleFromPosition(position?: string): string {
    if (!position || position === '기본 배치') {
      return 'width: 300px; height: 200px; margin: 16px 0;';
    }
    
    // 위치 정보를 파싱하여 CSS 스타일 생성
    // 예: "width: 400px, height: 300px, top: 50px, left: 100px"
    if (position.includes('width') || position.includes('height')) {
      return position.replace(/,/g, ';') + ';';
    }
    
    return 'width: 300px; height: 200px; margin: 16px 0;';
  }

  /**
   * 모든 이미지 파일명 수집
   */
  private getAllImageNames(layoutProposals: LayoutProposal[]): string[] {
    const imageNames: string[] = [];
    layoutProposals.forEach(layout => {
      layout.images.forEach(image => {
        if (!imageNames.includes(image.filename)) {
          imageNames.push(image.filename);
        }
      });
    });
    return imageNames.sort();
  }
}

export const finalPromptService = new FinalPromptService();