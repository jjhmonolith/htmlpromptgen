# Step2 재설계 기획문서

## 📋 목표

기존 Step2의 단순한 비주얼 아이덴티티 생성을 확장하여, **페이지별 교안 텍스트 생성 + 비주얼 아이덴티티**를 한 번의 AI 호출로 처리하는 통합 시스템으로 개선.

## 🔄 변경 전후 비교

### Before (현재)
```
Step2: 비주얼 아이덴티티만 생성 (단순)
Step3: 페이지 구조 + 상세 콘텐츠 + 레이아웃 (과부하)
```

### After (개선)
```
Step2: 페이지별 교안 텍스트 + 비주얼 아이덴티티 (확장)
Step3: 레이아웃 설계만 (단순화)
```

## 🎯 Step2 새로운 역할

### 입력 데이터
```typescript
interface Step2Input {
  projectData: ProjectData;  // Step1의 모든 데이터
  layoutMode: 'fixed' | 'scrollable';     // 레이아웃 모드
  contentMode: 'enhanced' | 'restricted'; // 콘텐츠 모드
}
```

### 출력 데이터
```typescript
interface Step2NewResult {
  // 기존 비주얼 아이덴티티 (변경 없음)
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;

  // 새로 추가: 페이지별 교안 텍스트
  pageContents: Array<{
    pageId: string;
    pageNumber: number;
    pageTitle: string;

    // 핵심: 줄글 형태의 완성된 교안 텍스트
    fullTextContent: string;    // 500-1000자의 완성된 교안

    // 부가 정보 (단순 문자열)
    learningGoal: string;       // 이 페이지의 학습 목표
    keyMessage: string;         // 핵심 메시지 1줄
    imageDescription: string;   // 필요한 이미지 설명
    interactionHint: string;    // 상호작용 아이디어 1줄
  }>;

  // 전체 구성 정보
  overallFlow: string;          // 전체 페이지 흐름 설명
  educationalStrategy: string;  // 교육 전략 요약
}
```

## 🤖 AI 프롬프트 설계

### 단일 호출 구조
```
한 번의 AI 호출로 다음을 모두 생성:
1. 전체 ${pages.length}개 페이지의 교안 텍스트
2. 비주얼 아이덴티티 (색상, 타이포그래피 등)
```

### 프롬프트 구성

```typescript
const generateStep2Prompt = (
  projectData: ProjectData,
  layoutMode: 'fixed' | 'scrollable',
  contentMode: 'enhanced' | 'restricted'
): string => {

  // Learning Journey 삭제됨

  // 콘텐츠 모드별 지시사항
  const contentModeInstruction = contentMode === 'enhanced'
    ? '창의적으로 확장하여 풍부하고 매력적인 내용으로 작성하세요. 예시, 비유, 상호작용 요소를 적극 활용하세요.'
    : '제공된 정보만을 바탕으로 정확하고 간결하게 작성하세요. 추가적인 내용은 생성하지 마세요.';

  // 레이아웃 모드별 제약사항
  const layoutConstraints = layoutMode === 'fixed'
    ? '고정 슬라이드 형식이므로 각 페이지가 독립적이고 완결된 내용이어야 합니다. 텍스트 양을 적절히 조절하세요.'
    : '스크롤 형식이므로 자연스러운 연결과 흐름을 고려하여 작성하세요.';

  return `당신은 교육 콘텐츠 전문가이자 비주얼 디자이너입니다.
다음 프로젝트의 완성된 교안과 비주얼 디자인을 생성해주세요.

## 📚 프로젝트 정보
- **제목**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
- **레이아웃 모드**: ${layoutMode === 'fixed' ? '1600×1000px 고정 슬라이드' : '1600px 너비 스크롤형'}
- **콘텐츠 모드**: ${contentMode === 'enhanced' ? 'AI 창의적 확장 모드' : '입력 내용 기반 제한 모드'}
- **총 페이지 수**: ${projectData.pages.length}개

## 📖 페이지 구성
${projectData.pages.map((page, index) => `
**${index + 1}. ${page.topic}**
   ${page.description ? `- 설명: ${page.description}` : '- 설명: 없음'}
`).join('\n')}

${projectData.suggestions?.length ? `
## 💡 추가 제안사항
${projectData.suggestions.join(' ')}
` : ''}

## 🎯 작성 지침
- **콘텐츠 접근**: ${contentModeInstruction}
- **레이아웃 고려**: ${layoutConstraints}
- **교육적 목표**: 각 페이지가 명확한 학습 목표를 가지고 순차적으로 연결되어야 합니다.
- **대상 맞춤**: ${projectData.targetAudience}에게 적합한 언어와 표현을 사용하세요.

---

## 📝 출력 형식

### A. 각 페이지별 교안 작성
각 페이지마다 다음 형식을 **정확히** 지켜서 작성해주세요:

${projectData.pages.map((page, index) => `
=== 페이지 ${index + 1}: ${page.topic} ===
학습목표: [이 페이지에서 달성할 구체적인 학습 목표를 한 줄로]
핵심메시지: [가장 중요하게 전달하고 싶은 메시지를 한 줄로]

[교안 본문 시작]
${contentMode === 'enhanced' ? '500-800자' : '300-500자'}의 완성된 교육 내용을 작성하세요.
${page.description ? `주제: ${page.topic}, 설명: ${page.description}` : `주제: ${page.topic}`}

자연스럽고 매력적인 교육 텍스트로 작성하되, 문단을 적절히 나누어 가독성을 높이세요.
[교안 본문 끝]

이미지설명: [이 페이지에서 필요한 이미지나 시각 자료를 1-2줄로 설명]
상호작용: [학습자와의 상호작용 아이디어를 1줄로 제안]

---
`).join('\n')}

### B. 비주얼 아이덴티티
프로젝트의 성격과 대상에 맞는 비주얼 디자인을 다음 형식으로 생성해주세요:

비주얼_분위기: [분위기1, 분위기2, 분위기3]
색상_주요: #000000
색상_보조: #000000
색상_강조: #000000
색상_텍스트: #000000
색상_배경: #000000
글꼴_제목: [제목용 폰트명]
글꼴_본문: [본문용 폰트명]
기본크기: [16pt/18pt/20pt 중 선택]
컴포넌트스타일: [전체적인 컴포넌트 디자인 스타일을 설명]

### C. 전체 구성 정보
전체흐름: [페이지들이 어떻게 연결되고 진행되는지 2-3줄로 설명]
교육전략: [이 프로젝트의 전체적인 교육 접근법과 특징을 2-3줄로 요약]

---

**중요**: 위의 형식을 정확히 지켜주세요. 특히 "=== 페이지 X: 제목 ===" 형식과 각 필드명(학습목표:, 핵심메시지:, 이미지설명:, 상호작용:)을 정확히 사용해주세요. 파싱 시 이 형식에 의존합니다.`;
};
```

### 실제 사용 예시

```typescript
// Step2IntegratedService.ts에서 사용
class Step2IntegratedService {
  async generateContentAndVisualIdentity(
    projectData: ProjectData,
    layoutMode: 'fixed' | 'scrollable',
    contentMode: 'enhanced' | 'restricted'
  ) {
    const prompt = generateStep2Prompt(projectData, layoutMode, contentMode);

    try {
      const response = await this.openAIService.generateCompletion(prompt);
      return this.parser.parseResponse(response);
    } catch (error) {
      console.error('Step2 AI 생성 실패:', error);
      throw error;
    }
  }
}
```

## 🔍 파싱 전략

### 단순 텍스트 파싱
복잡한 JSON 구조 대신 **정규식 기반 텍스트 파싱** 사용:

```typescript
class Step2ResponseParser {
  parseResponse(aiResponse: string): Step2NewResult {
    const pages: PageContent[] = [];

    // 1. 페이지별 교안 추출
    const pageRegex = /=== 페이지 (\d+): (.+?) ===\n학습목표: (.+?)\n핵심메시지: (.+?)\n\n([\s\S]+?)\n\n이미지설명: (.+?)\n상호작용: (.+?)\n\n---/g;

    let match;
    while ((match = pageRegex.exec(aiResponse)) !== null) {
      pages.push({
        pageId: match[1],
        pageNumber: parseInt(match[1]),
        pageTitle: match[2].trim(),
        learningGoal: match[3].trim(),
        keyMessage: match[4].trim(),
        fullTextContent: match[5].trim(),
        imageDescription: match[6].trim(),
        interactionHint: match[7].trim()
      });
    }

    // 2. 비주얼 아이덴티티 추출
    const visualIdentity = this.parseVisualIdentity(aiResponse);

    // 3. 전체 구성 정보 추출
    const overallFlow = this.extractByPattern(aiResponse, /전체흐름: (.+)/);
    const educationalStrategy = this.extractByPattern(aiResponse, /교육전략: (.+)/);

    return {
      pageContents: pages,
      visualIdentity,
      designTokens: this.generateDesignTokens(visualIdentity),
      overallFlow,
      educationalStrategy
    };
  }

  private parseVisualIdentity(response: string): VisualIdentity {
    return {
      moodAndTone: this.extractByPattern(response, /비주얼_분위기: (.+)/).split(', '),
      colorPalette: {
        primary: this.extractByPattern(response, /색상_주요: (#[a-fA-F0-9]{6})/),
        secondary: this.extractByPattern(response, /색상_보조: (#[a-fA-F0-9]{6})/),
        accent: this.extractByPattern(response, /색상_강조: (#[a-fA-F0-9]{6})/),
        text: this.extractByPattern(response, /색상_텍스트: (#[a-fA-F0-9]{6})/),
        background: this.extractByPattern(response, /색상_배경: (#[a-fA-F0-9]{6})/)
      },
      typography: {
        headingFont: this.extractByPattern(response, /글꼴_제목: (.+)/),
        bodyFont: this.extractByPattern(response, /글꼴_본문: (.+)/),
        baseSize: this.extractByPattern(response, /기본크기: (.+)/)
      },
      componentStyle: this.extractByPattern(response, /컴포넌트스타일: (.+)/)
    };
  }
}
```

## 🎨 Step3 변경사항

### 입력 데이터
```typescript
interface Step3Input {
  step2Result: Step2NewResult;  // Step2의 새로운 결과
  layoutMode: 'fixed' | 'scrollable';
}
```

### 역할 변경
```
기존: 콘텐츠 생성 + 레이아웃 설계
변경: 레이아웃 설계만 (콘텐츠는 Step2에서 완성됨)
```

### Step3 프롬프트

```typescript
const generateStep3LayoutPrompt = (
  step2Result: Step2NewResult,
  layoutMode: 'fixed' | 'scrollable',
  pageIndex: number
): string => {
  const currentPage = step2Result.pageContents[pageIndex];
  const totalPages = step2Result.pageContents.length;

  // 페이지 컨텍스트 생성
  const prevPageContext = pageIndex > 0
    ? `이전 페이지: ${step2Result.pageContents[pageIndex - 1].pageTitle}`
    : '첫 번째 페이지입니다';

  const nextPageContext = pageIndex < totalPages - 1
    ? `다음 페이지: ${step2Result.pageContents[pageIndex + 1].pageTitle}`
    : '마지막 페이지입니다';

  // 레이아웃 모드별 기본 설정
  const layoutConstraints = layoutMode === 'fixed'
    ? {
        dimensions: '1600×1000px 고정 화면',
        scrollPolicy: '스크롤 없이 모든 내용이 한 화면에 들어가야 함',
        contentStrategy: '공간 효율성을 최우선으로 콘텐츠를 배치하세요'
      }
    : {
        dimensions: '1600px 너비, 세로 자유 확장',
        scrollPolicy: '자연스러운 세로 스크롤을 고려한 콘텐츠 배치',
        contentStrategy: '세로 흐름을 고려하여 읽기 편한 구조로 배치하세요'
      };

  return `당신은 레이아웃 설계 전문가입니다.
Step2에서 완성된 교안 텍스트와 비주얼 아이덴티티를 바탕으로 최적의 레이아웃을 설계해주세요.

## 🎨 적용할 비주얼 아이덴티티
- **분위기**: ${step2Result.visualIdentity.moodAndTone.join(', ')}
- **주요 색상**: ${step2Result.visualIdentity.colorPalette.primary}
- **보조 색상**: ${step2Result.visualIdentity.colorPalette.secondary}
- **강조 색상**: ${step2Result.visualIdentity.colorPalette.accent}
- **제목 폰트**: ${step2Result.visualIdentity.typography.headingFont}
- **본문 폰트**: ${step2Result.visualIdentity.typography.bodyFont}
- **컴포넌트 스타일**: ${step2Result.visualIdentity.componentStyle}

## 📐 레이아웃 제약사항
- **크기**: ${layoutConstraints.dimensions}
- **스크롤**: ${layoutConstraints.scrollPolicy}
- **전략**: ${layoutConstraints.contentStrategy}

## 📄 배치할 페이지 정보
**현재 페이지**: ${pageIndex + 1}/${totalPages} - ${currentPage.pageTitle}
- ${prevPageContext}
- ${nextPageContext}

### 페이지 콘텐츠
**학습목표**: ${currentPage.learningGoal}
**핵심메시지**: ${currentPage.keyMessage}

**교안 본문** (${currentPage.fullTextContent.length}자):
"""
${currentPage.fullTextContent}
"""

**필요한 이미지**: ${currentPage.imageDescription}
**상호작용 요소**: ${currentPage.interactionHint}

## 🎯 레이아웃 설계 가이드라인

### 1. 콘텐츠 배치 원칙
- **기존 텍스트 보존**: Step2에서 생성된 교안 텍스트를 수정하지 말고 그대로 사용
- **시각적 계층**: 학습목표 → 핵심메시지 → 본문 → 상호작용 순으로 중요도 표현
- **가독성 우선**: 텍스트 블록을 적절히 나누어 읽기 편하게 구성
- **이미지 통합**: 교안 텍스트와 자연스럽게 연결되는 이미지 배치

### 2. 레이아웃 구조 설계
${layoutMode === 'fixed' ? `
**고정 레이아웃 전략**:
- 화면을 효율적으로 분할하여 모든 콘텐츠를 배치
- 여백과 콘텐츠의 균형을 고려
- 시선의 자연스러운 흐름 설계 (Z-패턴 또는 F-패턴)
` : `
**스크롤 레이아웃 전략**:
- 세로 흐름에 맞는 자연스러운 콘텐츠 배치
- 섹션별 명확한 구분과 연결
- 스크롤 인터랙션을 고려한 콘텐츠 그루핑
`}

### 3. 구체적 설계 요구사항
- **섹션 구조**: 논리적 블록으로 콘텐츠를 나누고 각 섹션의 역할 명시
- **그리드 시스템**: 12컬럼 그리드 기준으로 요소 배치 (예: 8+4, 2-11, 1-12)
- **간격 체계**: 요소 간 여백과 패딩을 체계적으로 설계
- **반응형 고려**: 다양한 화면 크기에서의 적응 방안

## 📝 출력 형식

다음 형식으로 레이아웃을 설계해주세요:

### 페이지 구조 설계
**전체 레이아웃 개념**: [이 페이지의 전체적인 레이아웃 컨셉을 2-3줄로 설명]

**섹션별 구성**:
1. **헤더 영역** (그리드: 1-12, 높이: XXXpx)
   - 배치 요소: 학습목표 + 핵심메시지
   - 스타일링: [구체적인 디자인 설명]

2. **메인 콘텐츠 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: 교안 본문 텍스트
   - 텍스트 분할: [몇 개 문단으로 나눌지, 어떻게 배치할지]
   - 스타일링: [구체적인 디자인 설명]

3. **이미지 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: ${currentPage.imageDescription}
   - 위치: [왼쪽/오른쪽/중앙/삽입 위치]
   - 스타일링: [구체적인 디자인 설명]

4. **상호작용 영역** (그리드: X-X, 높이: XXXpx)
   - 배치 요소: ${currentPage.interactionHint}
   - 스타일링: [구체적인 디자인 설명]

### 세부 디자인 가이드
**타이포그래피**: [폰트 크기, 라인 높이, 색상 적용]
**색상 적용**: [어떤 요소에 어떤 색상을 사용할지]
**간격 체계**: [섹션 간 여백, 요소 간 패딩]
**시각적 강조**: [중요한 부분을 어떻게 강조할지]

### 구현 가이드라인
**CSS 클래스 구조**: [예상되는 주요 CSS 클래스명과 역할]
**반응형 전략**: [화면 크기별 적응 방안]
**접근성 고려사항**: [스크린 리더, 키보드 네비게이션 등]

---

**중요**: Step2에서 생성된 텍스트 내용은 절대 수정하지 마세요. 오직 레이아웃과 배치, 스타일링만 설계해주세요.`;
};
```

### 사용 예시

```typescript
// Step3LayoutService.ts에서 사용
class Step3LayoutService {
  async generatePageLayout(
    step2Result: Step2NewResult,
    layoutMode: 'fixed' | 'scrollable',
    pageIndex: number
  ) {
    const prompt = generateStep3LayoutPrompt(step2Result, layoutMode, pageIndex);

    try {
      const response = await this.openAIService.generateCompletion(prompt);
      return this.parseLayoutResponse(response, pageIndex);
    } catch (error) {
      console.error(`Step3 레이아웃 생성 실패 (페이지 ${pageIndex + 1}):`, error);
      throw error;
    }
  }

  private parseLayoutResponse(response: string, pageIndex: number) {
    // 레이아웃 응답을 구조화된 데이터로 파싱
    // 기존 파싱 로직 활용하되 Step2 텍스트 연계
  }
}
```

## 📁 파일 구조 변경

### 새로 생성할 파일들
```
src/services/
├── step2-integrated.service.ts     # 새로운 Step2 통합 서비스
├── step2-response-parser.ts        # Step2 응답 파싱 로직
├── step3-layout-only.service.ts    # 단순화된 Step3 서비스
└── ...

src/types/
├── step2-new.types.ts              # Step2 새로운 타입 정의
└── ...
```

### 수정할 파일들
```
src/components/workflow/
├── Step2VisualIdentity/
│   ├── Step2VisualIdentity.tsx     # UI 확장 (교안 미리보기 추가)
│   └── ...
├── Step3EducationalDesign/
│   ├── Step3EducationalDesign.tsx  # UI 단순화 (레이아웃만)
│   └── ...
└── WorkflowContainer.tsx           # 데이터 흐름 수정
```

## 🚀 구현 단계

### Phase 1: 백엔드 구현 (3-4일)
1. `Step2IntegratedService` 구현
2. `Step2ResponseParser` 구현
3. 새로운 타입 정의
4. 기존 서비스와 병렬 운영

### Phase 2: UI 업데이트 (2-3일)
1. Step2 결과 표시 화면 확장
2. 교안 텍스트 미리보기 추가
3. Step3 화면 단순화

### Phase 3: 통합 테스트 (1-2일)
1. 전체 워크플로우 테스트
2. 에러 핸들링 개선
3. 성능 최적화

## ⚠️ 주의사항

### 1. AI 응답 안정성
- 정해진 형식을 지키지 않을 경우 폴백 메커니즘 필요
- 파싱 실패 시 사용자에게 명확한 오류 메시지 제공

### 2. 콘텐츠 품질 관리
- Step2에서 생성된 교안의 품질 검증 로직 필요
- 너무 짧거나 긴 텍스트에 대한 재생성 메커니즘

### 3. 호환성
- 기존 프로젝트 데이터 마이그레이션 계획
- 구 버전과 신 버전 병렬 운영 기간

## 🎯 기대 효과

1. **단순화된 파싱**: 복잡한 JSON 구조 대신 텍스트 패턴 매칭
2. **품질 향상**: 전체 맥락을 고려한 일관된 교안 생성
3. **효율성**: 한 번의 AI 호출로 주요 콘텐츠 완성
4. **안정성**: Step3의 레이아웃 설계만 집중하여 오류율 감소
5. **사용자 경험**: Step2에서 교안 미리보기로 즉시 피드백

이 구조로 변경하면 AI 호출의 안정성과 콘텐츠 품질을 동시에 향상시킬 수 있을 것으로 예상됩니다.