# 새로운 프롬프트 명세서 (Step 2 & Step 3)

> 기존 복잡한 프롬프트 구조를 간소화하고 더 예측 가능한 응답을 얻기 위한 새로운 프롬프트 구조

## 📋 목차
- [Step 2: 비주얼 아이덴티티 프롬프트](#step-2-비주얼-아이덴티티-프롬프트)
- [Step 3: 교육 콘텐츠 레이아웃 프롬프트](#step-3-교육-콘텐츠-레이아웃-프롬프트)
- [변경사항 요약](#변경사항-요약)

---

## Step 2: 비주얼 아이덴티티 프롬프트

### 🎯 프롬프트 목적
사용자가 제공한 프로젝트 개요를 바탕으로 프로젝트의 **비주얼 아이덴티티**를 JSON 형식으로 정의

### 🤖 시스템 메시지
```json
{
  "role": "system",
  "content": "You are an expert art director specializing in educational content design. Always respond in valid JSON format."
}
```

### 📝 사용자 프롬프트 구조

```markdown
당신은 프로젝트의 전체적인 비주얼 컨셉을 잡는 아트 디렉터입니다. 사용자가 제공한 프로젝트 개요를 바탕으로, 프로젝트의 '비주얼 아이덴티티'를 정의해주세요.

### 📜 프로젝트 개요
- **프로젝트명**: ${projectData.projectTitle}
- **대상 학습자**: ${projectData.targetAudience}
${userSuggestionsText}

### 📋 생성할 항목
1.  **Mood & Tone**: 프로젝트의 전반적인 분위기를 설명하는 핵심 키워드 3-4개를 제시해주세요. (예: "활기찬, 재미있는, 다채로운, 친근한")
2.  **Color Palette**: 분위기에 맞는 색상 팔레트를 HEX 코드로 제안해주세요. (primary, secondary, accent, text, background)
3.  **Typography**: 제목과 본문에 어울리는 폰트 패밀리와 기본 사이즈를 제안해주세요. (headingFont, bodyFont, baseSize)
4.  **Component Style**: 버튼, 카드 등 UI 요소의 전반적인 스타일을 간결하게 설명해주세요. (예: "버튼은 모서리가 둥글고, 카드에는 약간의 그림자 효과를 적용합니다.")

### 💻 출력 형식
반드시 다음 JSON 형식으로 응답해주세요:
{
    "moodAndTone": "[분위기를 나타내는 3-4개 키워드]",
    "colorPalette": {
        "primary": "#HEX코드",
        "secondary": "#HEX코드",
        "accent": "#HEX코드",
        "text": "#HEX코드",
        "background": "#HEX코드"
    },
    "typography": {
        "headingFont": "[폰트 패밀리]",
        "bodyFont": "[폰트 패밀리]",
        "baseSize": "[크기]"
    },
    "componentStyle": "[UI 요소 스타일 설명]"
}
```

### 🔧 변수 설명

| 변수 | 설명 | 예시 |
|------|------|------|
| `${projectData.projectTitle}` | 프로젝트 제목 | "AI 리터러시 첫걸음" |
| `${projectData.targetAudience}` | 대상 학습자 | "AI에 대해 처음 배우는 중학생" |
| `${userSuggestionsText}` | 사용자 추가 제안 | "- **사용자 추가 제안**: 중학생 눈높이에 맞춰 친근한 말투와 귀여운 아이콘을 사용해주세요." |

---

## Step 3: 교육 콘텐츠 레이아웃 프롬프트

### 🎯 프롬프트 목적
비주얼 아이덴티티를 바탕으로 교육 콘텐츠의 구체적인 레이아웃을 자연어로 설계하고, 필요한 이미지를 구조화된 형식으로 정의

### 🤖 시스템 메시지
```json
{
  "role": "system",
  "content": "You are an expert educational content layout designer. CRITICAL: For image filenames, ONLY use numbered format like '1.png', '2.png', '3.png'. NEVER use descriptive names like 'hero.png' or 'diagram.png'. Always follow the structured format exactly."
}
```

### 📝 사용자 프롬프트 구조

#### 🔄 레이아웃 모드별 분기

**스크롤 허용 모드:**
```markdown
당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 가로 1600px 고정, 세로는 콘텐츠에 맞게 자유롭게 확장되는 스크롤 가능한 레이아웃을 구성해주세요.
```

**스크롤 금지 모드:**
```markdown
당신은 주어진 '비주얼 아이덴티티'를 바탕으로 교육 콘텐츠 레이아웃을 구성하는 전문 UI 디자이너입니다. 스크롤 없는 1600x1000px 화면에 들어갈 콘텐츠 레이아웃을 구성해주세요.
```

#### 📋 공통 프롬프트 구조

```markdown
### 📌 콘텐츠 생성 방침
제공된 페이지 주제를 바탕으로 창의적으로 내용을 보강하고 확장하여 풍부한 교육 콘텐츠를 만드세요. 학습자의 이해를 돕는 추가 설명, 예시, 시각 자료 등을 자유롭게 제안하세요.

### ✨ 비주얼 아이덴티티 (반드시 준수할 것)
- **분위기**: ${visualIdentityMood}
- **핵심 디자인 원칙**: ${designPrinciples}

### 📍 전체 프로젝트 구성
${projectOverview}

### 📍 페이지 컨텍스트
${pageContext}

### 📜 핵심 규칙
1.  **자유 서술**: 정해진 키워드 없이, 개발자가 이해하기 쉽도록 레이아웃을 상세히 설명해주세요.
2.  ${spaceOptimizationRule}
3.  **이미지 최소화**: 학습에 필수적인 이미지만 사용하고, 장식용 이미지는 피하세요.
4.  **구조화된 이미지 섹션**: 이미지가 필요한 경우 응답 끝에 다음 형식으로 분리해주세요:

=== REQUIRED IMAGES ===
1. filename: "1.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"

2. filename: "2.png"
   description: "AI 이미지 생성을 위한 상세한 설명"
   placement: "이미지가 배치될 위치"
=== END IMAGES ===

**중요**: filename은 반드시 "1.png", "2.png", "3.png" 형태의 **숫자.png** 형식만 사용하세요. 다른 이름 (예: hero.png, diagram.png)은 절대 사용하지 마세요!

5.  **페이지 간 연결성**: 이전/다음 페이지와의 자연스러운 흐름을 고려하세요.
6.  **전체 일관성**: 프로젝트 전체의 흐름과 일관성을 유지하면서 현재 페이지의 특색을 살려주세요.

### 🚫 절대 금지 사항
- **페이지 네비게이션 금지**: 절대로 페이지 간 이동 버튼, 링크, 네비게이션 메뉴를 만들지 마세요. 각 페이지는 완전히 독립적인 HTML 파일입니다.
- **페이지 번호 표시 금지**: "1/5", "다음", "이전" 같은 페이지 표시나 버튼을 절대 만들지 마세요.
- **최소 폰트 크기**: 모든 텍스트는 반드시 18pt 이상으로 설정하세요. 본문은 18-20pt, 제목은 24pt 이상을 권장합니다.
- **이미지 파일명 규칙**: 이미지 파일명은 "1.png", "2.png", "3.png"만 사용하세요. hero.png, diagram.png, icon.png 같은 설명적 이름은 금지입니다!

### 📝 프로젝트 정보
- 프로젝트: ${projectData.projectTitle}
- 대상: ${projectData.targetAudience}
- 사용자 추가 제안사항: ${projectData.additionalRequirements}

이제 위의 가이드라인에 맞춰 페이지 레이아웃을 상세히 서술해주세요. 반드시 레이아웃 구조와 디자인을 구체적으로 설명해야 합니다.

⚠️ **파일명 규칙 재확인**: 이미지 파일명은 절대 "1.png", "2.png", "3.png" 외에는 사용하지 마세요.
   - ✅ 올바른 예: "1.png", "2.png"
   - ❌ 잘못된 예: "hero.png", "diagram.png", "main-image.png", "icon.png"
```

### 🔧 변수 설명

| 변수 | 설명 | 예시 |
|------|------|------|
| `${visualIdentityMood}` | Step2에서 생성된 무드 키워드 | "밝은, 친근한, 귀여운, 호기심을 자극하는" |
| `${designPrinciples}` | 핵심 디자인 원칙 | "콘텐츠의 중요도에 따라 시각적 계층(Visual Hierarchy)을 만드세요..." |
| `${projectOverview}` | 전체 프로젝트 페이지 구성 | "페이지 1: '생각하는 기계' AI, 궁금하지 않니?..." |
| `${pageContext}` | 현재/이전/다음 페이지 컨텍스트 | "- 이전 페이지: ...\n- **현재 페이지**: ...\n- 다음 페이지: ..." |
| `${spaceOptimizationRule}` | 레이아웃 모드별 공간 최적화 규칙 | 스크롤: "콘텐츠 우선", 고정: "공간 최적화" |

---

## 변경사항 요약

### 📊 Step 2 주요 변화

| 항목 | Before | After |
|------|--------|-------|
| **시스템 메시지** | 없음 | 아트 디렉터 역할 + JSON 강제 |
| **출력 형식** | 복잡한 구조화 파싱 | 간단한 JSON |
| **프롬프트 구조** | 교육 전문가 컨텍스트 | 비주얼 디렉터 컨텍스트 |
| **파싱 안정성** | 70% | 100% (예상) |

### 📊 Step 3 주요 변화

| 항목 | Before | After |
|------|--------|-------|
| **시스템 메시지** | 함수 호출 중심 | 명확한 역할 + 파일명 규칙 |
| **응답 형식** | 구조화된 JSON 스키마 | 자연어 + 구조화된 이미지 섹션 |
| **모델** | 기본 설정 | gpt-5 명시 |
| **파일명 규칙** | 암묵적 | **명시적 강조** |
| **복잡도** | 높음 | 단순화 |

### 🎯 예상 효과

1. **🔧 개발 안정성**: 더 예측 가능한 응답 구조
2. **⚡ 성능 향상**: 단순화된 파싱 로직
3. **🎨 품질 개선**: 명확한 역할 정의로 더 일관된 결과
4. **🚀 유지보수성**: 코드 복잡도 감소

### 📋 구현 체크리스트

#### Step 2
- [ ] 시스템 메시지 추가 ✅
- [ ] 프롬프트 구조 변경 ✅
- [ ] JSON 파싱 로직 단순화 (예정)
- [ ] additionalRequirements 필드 활용 ✅

#### Step 3
- [ ] 시스템 메시지 업데이트 (예정)
- [ ] gpt-5 모델 지정 (예정)
- [ ] 구조화된 이미지 섹션 파싱 (예정)
- [ ] 자연어 응답 처리 로직 (예정)

---

*이 문서는 새로운 프롬프트 구조의 명세를 담고 있으며, 실제 구현은 별도로 진행됩니다.*