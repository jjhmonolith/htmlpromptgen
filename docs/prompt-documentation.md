# 🎯 프롬프트 생성기 AI 프롬프트 문서

## 📋 개요

프롬프트 생성기는 교육 콘텐츠 제작을 위한 4단계 워크플로우를 통해 각 단계별로 최적화된 AI 프롬프트를 사용합니다. 레이아웃 모드(fixed/scrollable)와 콘텐츠 모드(enhanced/restricted)에 따라 프롬프트가 동적으로 변화합니다.

## 🎨 Step 2: 비주얼 아이덴티티 생성

### 메인 프롬프트 템플릿 (통합 버전)

```
당신은 프로젝트의 전체적인 비주얼 컨셉을 잡는 아트 디렉터입니다. 사용자가 제공한 프로젝트 개요를 바탕으로, 프로젝트의 '비주얼 아이덴티티'를 정의해주세요.

### :스크롤: 프로젝트 개요
- **프로젝트명**: {projectData.projectTitle}
- **대상 학습자**: {projectData.targetAudience}
- **사용자 추가 제안**: {projectData.additionalRequirements || '기본적인 교육용 디자인'}

### :클립보드: 생성할 항목
1. **Mood & Tone**: 프로젝트의 전반적인 분위기를 설명하는 핵심 키워드 3-4개를 제시해주세요. (예: "활기찬, 재미있는, 다채로운, 친근한")
2. **Color Palette**: 분위기에 맞는 색상 팔레트를 HEX 코드로 제안해주세요. (primary, secondary, accent, text, background)
3. **Typography**: 제목과 본문에 어울리는 폰트 패밀리와 기본 사이즈를 제안해주세요. (headingFont, bodyFont, baseSize)
4. **Component Style**: 버튼, 카드 등 UI 요소의 전반적인 스타일을 간결하게 설명해주세요. (예: "버튼은 모서리가 둥글고, 카드에는 약간의 그림자 효과를 적용합니다.")

### :컴퓨터: 출력 형식
반드시 다음 JSON 형식으로 응답해주세요:
{
    "moodAndTone": "활기찬, 재미있는, 다채로운, 친근한",
    "colorPalette": {
        "primary": "#4F46E5",
        "secondary": "#7C3AED",
        "accent": "#F59E0B",
        "text": "#1F2937",
        "background": "#FFFFFF"
    },
    "typography": {
        "headingFont": "Inter, system-ui, sans-serif",
        "bodyFont": "Inter, system-ui, sans-serif",
        "baseSize": "16px"
    },
    "componentStyle": "버튼은 모서리가 둥글고 호버 시 살짝 위로 올라가는 효과를 줍니다. 카드는 부드러운 그림자와 함께 깨끗한 흰색 배경을 가집니다."
}
```

### 🔄 프롬프트 단순화 완료

**변경 사항:**
- 복잡한 조건부 로직 제거 (layoutGuide, contentGuide, audienceGuide)
- 모든 레이아웃/콘텐츠 모드에 대해 통일된 프롬프트 사용
- 이모지 기반 섹션 구분 (🔄 → :스크롤:, :클립보드:, :컴퓨터:)
- 역할 정의 변경: "BI 디자이너" → "아트 디렉터"
- 폰트 기본값 변경: "Pretendard/Noto Sans KR" → "Inter"
- 기본 사이즈 변경: "18px" → "16px"

**제거된 기능:**
- ~~레이아웃 모드별 가이드~~
- ~~콘텐츠 모드별 가이드~~
- ~~대상 학습자별 가이드~~

이제 모든 모드에서 동일한 단순하고 직관적인 프롬프트를 사용합니다.

## 🖼️ Step 3: 교육 콘텐츠 설계 - 이미지 생성 프롬프트

### 상세 이미지 AI 프롬프트 템플릿

```
Create a comprehensive educational illustration for "{topic}"{specificFocus ? ` focusing on "${specificFocus}"` : ''}.

**Topic Details**: {topic} - {description}
**Specific Focus**: {specificFocus || '전체 개념'}
**Target Audience**: {audience}
**Image Role**: {imageSpecs.role}
**Educational Priority**: {imageSpecs.priority}

**Visual Requirements**:
- Style: {styleGuide}
- Color Palette: Use {colors.primary} for primary areas, {colors.secondary} for secondary areas, {colors.accent} for highlights (using natural color descriptions only)
- Composition: Clear, well-organized layout with logical information flow
- Elements: Include relevant diagrams, icons, illustrations, or infographics
- Text Integration: Minimal, essential text labels in Korean if needed
- Educational Focus: {specificFocus ? `Emphasize ${specificFocus.toLowerCase()} aspects of ${topic}` : `Make complex concepts easy to understand through visual representation`}

**Technical Specifications**:
- Size: {imageSpecs.size}, high resolution
- Format: Clean, professional educational material style
- Accessibility: High contrast, clear visual hierarchy
- Cultural Context: Appropriate for Korean educational environment
- Image Priority: {imageIndex === 0 ? 'Main/Hero image' : imageIndex === 1 ? 'Supporting detail image' : 'Summary/Reference image'}

**Unique Requirements**:
{imageIndex === 0 ? '- Should be the most prominent and comprehensive visual' : ''}
{imageIndex === 1 ? '- Should complement the main image with specific details or examples' : ''}
{imageIndex === 2 ? '- Should summarize key points or provide quick reference' : ''}
{specificFocus ? `- Must clearly distinguish this "${specificFocus}" focus from other images in the same lesson` : ''}

**Mood & Tone**: {emotionalContext.overallTone}, engaging, trustworthy, conducive to learning

Create an image that serves as an effective educational tool, helping learners grasp {specificFocus ? `the ${specificFocus.toLowerCase()} aspects of` : 'the key concepts of'} {topic} through clear, intuitive visual communication.
```

### 연령별 스타일 가이드

#### 초등학생
```
밝고 친근한 색상, 단순하고 명확한 형태, 캐릭터나 마스코트 활용 가능, 재미있고 흥미로운 요소 포함
```

#### 중학생/고등학생
```
깔끔하고 체계적인 디자인, 논리적인 정보 구성, 다이어그램과 차트 활용, 전문적이면서도 이해하기 쉬운 스타일
```

#### 성인
```
전문적이고 세련된 디자인, 명확한 정보 전달, 비즈니스 친화적 색상과 레이아웃
```

## 🎬 Step 4: 디자인 명세서 생성

### Fixed Layout 모드 프롬프트

```
당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ⚠️ 원본 유지 모드
이 프로젝트는 사용자가 제공한 내용만을 사용합니다. 하지만 애니메이션과 상호작용은 반드시 제안해야 합니다! 기존 내용을 효과적으로 전달하기 위한 애니메이션과 인터랙션을 상세히 설명하세요. 추가 콘텐츠 생성은 제한되지만, 시각적 효과와 상호작용은 풍부하게 제안하세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: {moodAndTone}
- **색상**: Primary-{visualIdentity.colorPalette?.primary || '#3B82F6'}
- **컴포넌트 스타일**: {visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📍 전체 페이지 구성 개요
{allPages}

### 📝 프로젝트 정보
- 프로젝트: {projectData.projectTitle}
- 대상: {projectData.targetAudience}
- 전체적인 분위기 및 스타일 제안: {projectData.additionalRequirements || '기본적인 교육용 디자인'}
- 현재 페이지 {step3PageData.pageNumber}: {step3PageData.pageTitle}

### 페이지 구성안:
{pageContent}

### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.

### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}
```

### Scrollable Layout 모드 프롬프트

```
당신은 최고 수준의 UI/UX 디자이너입니다. 주어진 페이지 구성안과 '비주얼 아이덴티티'를 바탕으로, 학습자의 몰입도를 높이는 동적 효과를 제안해주세요.

### ✨ AI 보강 모드
창의적인 애니메이션과 상호작용을 자유롭게 제안하세요. 학습 효과를 높이는 추가적인 시각 효과나 인터랙션을 적극적으로 제안할 수 있습니다.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: {moodAndTone}
- **색상**: Primary-{visualIdentity.colorPalette?.primary || '#3B82F6'}
- **컴포넌트 스타일**: {visualIdentity.componentStyle}
- **핵심 디자인 원칙**: 효율적인 공간을 활용하고, 빈 공간이 많다면 이를 채울 아이디어를 적극적으로 제안하라

### 📍 전체 페이지 구성 개요
{allPages}

### 📝 프로젝트 정보
- 프로젝트: {projectData.projectTitle}
- 대상: {projectData.targetAudience}
- 전체적인 분위기 및 스타일 제안: {projectData.additionalRequirements || '기본적인 교육용 디자인'}
- 현재 페이지 {step3PageData.pageNumber}: {step3PageData.pageTitle}

### 페이지 구성안:
{pageContent}

### 🚫 절대 금지 사항 (매우 중요!)
- **네비게이션 금지**: 페이지 간 이동을 위한 버튼, 링크, 화살표, 네비게이션 바 등을 절대 만들지 마세요.
- **페이지 연결 금지**: "다음 페이지로", "이전으로 돌아가기" 같은 상호작용을 절대 제안하지 마세요.
- **독립적 페이지**: 각 페이지는 완전히 독립적인 HTML 파일로, 다른 페이지와 연결되지 않습니다.
- **최소 폰트 크기 강제**: 모든 텍스트 애니메이션과 효과에서도 18pt 이상 유지를 명시하세요.

### 제안 항목 (JSON 형식으로 출력)
반드시 다음 JSON 형식으로 응답해주세요:
{
    "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
    "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}
```

## 📊 모드별 프롬프트 차이점 분석

### 레이아웃 모드 영향

| 구분 | Fixed Layout | Scrollable Layout |
|------|--------------|-------------------|
| **Step 2** | 작은 여백, 미니멀 컴포넌트, 명확한 색상 구분 | 넉넉한 여백, 풍부한 시각적 요소, 자연스러운 흐름 |
| **Step 4** | 원본 유지 모드 + 제한된 공간 활용 | AI 보강 모드 + 창의적 상호작용 |

### 콘텐츠 모드 영향

| 구분 | Enhanced Mode | Restricted Mode |
|------|---------------|-----------------|
| **Step 2** | 창의적 보강 및 확장, 다양한 시각적 요소 | 원본 유지, 본질 집중, 절제된 색상 |
| **Step 4** | 학습 효과 높이는 추가 시각 효과 | 기존 내용 효과적 전달에 집중 |

## 🔧 JSON 스키마 및 파싱

### Step 2 JSON 스키마
```json
{
  "type": "object",
  "properties": {
    "moodAndTone": {
      "type": "string",
      "description": "4개의 형용사를 쉼표로 구분한 문자열"
    },
    "colorPalette": {
      "type": "object",
      "properties": {
        "primary": { "type": "string", "pattern": "^#[A-Fa-f0-9]{6}$" },
        "secondary": { "type": "string", "pattern": "^#[A-Fa-f0-9]{6}$" },
        "accent": { "type": "string", "pattern": "^#[A-Fa-f0-9]{6}$" },
        "text": { "type": "string", "pattern": "^#[A-Fa-f0-9]{6}$" },
        "background": { "type": "string", "pattern": "^#[A-Fa-f0-9]{6}$" }
      },
      "required": ["primary", "secondary", "accent", "text", "background"],
      "additionalProperties": false
    },
    "typography": {
      "type": "object",
      "properties": {
        "headingFont": { "type": "string" },
        "bodyFont": { "type": "string" },
        "baseSize": { "type": "string", "pattern": "^\\d+px$" }
      },
      "required": ["headingFont", "bodyFont", "baseSize"],
      "additionalProperties": false
    },
    "componentStyle": {
      "type": "string",
      "description": "UI 컴포넌트 스타일 가이드"
    }
  },
  "required": ["moodAndTone", "colorPalette", "typography", "componentStyle"],
  "additionalProperties": false
}
```

### Step 4 기본 JSON 응답 구조
```json
{
  "animationDescription": "페이지 로드 시 제목이 위에서 부드럽게 내려오고, 콘텐츠 요소들이 순차적으로 페이드인되는 효과를 적용합니다.",
  "interactionDescription": "카드에 호버하면 살짝 확대되고 그림자가 진해지며, 클릭 가능한 요소들은 호버 시 색상이 밝아집니다."
}
```

### 파싱 에러 처리
- **Step 2**: JSON Schema 기반 Structured Output으로 파싱 오류 방지
- **Step 4**: 정규식 기반 JSON 추출 + 폴백 기본 구조 제공
- **모든 단계**: 파싱 실패 시 기본값으로 대체하여 시스템 안정성 보장

## 🚀 최적화 요소

### 모델 선택 최적화
- **Step 2**: GPT-5-mini (비용 효율성, 구조화된 응답)
- **Step 3**: 추정 GPT-5 (복잡한 교육 콘텐츠 설계)
- **Step 4**: GPT-5 (창의적 UX/UI 설계)

### 토큰 관리
- **GPT-5**: 최대 8000 토큰 출력
- **GPT-5-mini**: 최대 1200 토큰 출력
- **Reasoning Effort**: Step별 최적화 (low/medium/high)

### 프롬프트 압축 기법
1. **템플릿 변수 활용**: 반복 요소를 변수로 처리
2. **조건부 섹션**: 모드에 따른 동적 프롬프트 구성
3. **구조화된 출력**: JSON Schema로 응답 형식 강제
4. **컨텍스트 최적화**: 필요한 정보만 선별적 포함

이 문서는 프롬프트 생성기의 모든 AI 프롬프트를 시스템 그대로 정리한 공식 문서입니다. 각 모드별 차이점과 최적화 전략을 통해 일관된 고품질 교육 콘텐츠 생성을 보장합니다.