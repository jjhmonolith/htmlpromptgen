# Step 3: 레이아웃 제안 (Layout Proposal) 설계

## 📋 개요

Step 3는 Step 1의 기본 정보와 Step 2의 비주얼 아이덴티티를 바탕으로, 각 페이지별 상세 레이아웃을 생성하는 단계입니다. 레이아웃 모드(스크롤형/고정형)에 따라 완전히 다른 접근 방식을 사용하는 것이 핵심입니다.

## 🎯 설계 목표

1. **레이아웃별 차별화**: 스크롤형과 고정형의 근본적 차이 반영
2. **실행 가능한 명세**: 개발자가 바로 구현할 수 있는 구체적 정보 제공
3. **AI 모델 행동 유도**: 프롬프트 언어로 AI의 생성 패턴 조정
4. **교육 효과 최적화**: 학습 목표에 맞는 레이아웃 구조

## 🔧 구현된 서비스 분석

### LayoutProposalService
현재 구현된 서비스는 다음 기능을 제공:

```typescript
generateLayoutProposals(
  projectData: ProjectData, 
  visualIdentity: VisualIdentity
): Promise<LayoutProposal[]>
```

**핵심 메커니즘**:
1. `LayoutPromptService`에서 레이아웃 모드별 규칙 로드
2. AI 프롬프트 생성 및 OpenAI API 호출
3. JSON 응답 파싱 및 `LayoutProposal[]` 변환

## 📊 Step 3 컴포넌트 요구사항

### 1. 전달받는 데이터 (Props)
```typescript
interface Step3LayoutProposalProps {
  projectData: ProjectData;           // Step 1 결과
  visualIdentity: VisualIdentity;     // Step 2 결과
  initialData?: LayoutProposal[] | null;
  onComplete: (proposals: LayoutProposal[]) => void;
  onBack: () => void;
}
```

### 2. 생성하는 결과물 (LayoutProposal)
```typescript
interface LayoutProposal {
  pageId: string;                    // 페이지 식별자
  pageTitle: string;                 // 페이지 제목
  layout: {
    structure: string;               // 레이아웃 구조 설명
    mainContent: string;             // 주요 콘텐츠 배치
    visualElements: string;          // 시각적 요소 배치
  };
  images: ImageSpec[];               // 필요한 이미지 목록
  contentBlocks: ContentBlock[];     // 콘텐츠 블록 구성
  metadata: PageMetadata;            // 메타데이터
}
```

## 🎨 UI/UX 설계

### 레이아웃 모드별 프롬프트 차이점

#### 스크롤형 (Scrollable) 특화 키워드
- **확장**: "자유롭게 확장", "길이 제한 없이", "콘텐츠 양에 따라"
- **공간**: "충분한 간격", "여유로운 배치", "60-80px 여백"
- **접근**: "콘텐츠 우선 접근", "자연스러운 흐름"
- **섹션**: "8-10개 섹션", "상세한 정보", "단계별 전개"

#### 고정형 (Fixed) 특화 키워드
- **제약**: "엄격히 고정", "정확히 1600x1000px", "절대 제한"
- **효율**: "공간 효율", "압축 배치", "여백 최소화"
- **완결**: "한 화면 완결", "즉시 이해", "픽셀 단위 정확도"
- **섹션**: "5-6개 섹션", "핵심 중심", "압축적 표현"

### Step 3 컴포넌트 구조

```typescript
export const Step3LayoutProposal: React.FC<Step3LayoutProposalProps> = ({
  projectData,
  visualIdentity,
  initialData,
  onComplete,
  onBack
}) => {
  const [proposals, setProposals] = useState<LayoutProposal[] | null>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 자동 생성 로직
  useEffect(() => {
    if (!proposals && !isGenerating) {
      startGeneration();
    }
  }, []);

  // 생성 프로세스
  const startGeneration = async () => {
    // 로딩 상태 설정
    // LayoutProposalService 호출
    // 결과 저장
  };

  // UI 렌더링
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* 상단 헤더 */}
      {/* 로딩 상태 */}
      {/* 결과 표시 */}
      {/* 하단 네비게이션 */}
    </div>
  );
};
```

## 📈 AI 프롬프트 전략

### 프롬프트 구조
1. **컨텍스트 설정**: 전문가 페르소나 + 프로젝트 정보
2. **시각적 가이드**: Step 2 결과물 완전 통합
3. **레이아웃 규칙**: 모드별 차별화된 규칙
4. **구체적 지시**: JSON 형식, 필수 필드, 응답 형식

### 레이아웃별 프롬프트 차이점

#### 스크롤형 프롬프트 핵심
```markdown
### 📜 스크롤 가능 레이아웃 규칙
**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1. **가로 고정, 세로 유연**
   * 가로: 1600px 고정
   * 세로: 콘텐츠 양에 따라 자유롭게 확장
   * 길이 제한 없이 완전한 정보 전달

2. **콘텐츠 우선 배치**
   * 섹션 간 충분한 간격 (60-80px) 확보
   * 자연스러운 읽기 흐름 유지
   * 스크롤 진행 상황 시각적 안내
```

#### 고정형 프롬프트 핵심
```markdown
### 📐 고정 크기 레이아웃 규칙
**정확히 1600x1000px 프레임 안에서 최대 효율을 달성합니다.**

1. **엄격한 크기 제한**
   * 가로 1600px, 세로 1000px 절대 고정
   * overflow: hidden 적용 - 스크롤 금지
   * 모든 정보가 한 화면에 완결

2. **공간 효율 극대화**
   * 여백 최소화로 콘텐츠 밀도 극대화
   * 픽셀 단위 정확도로 최적화
   * 즉시 이해 가능한 직관적 레이아웃
```

## 🔍 예상 결과물

### 스크롤형 레이아웃 예시
```json
{
  "pageNumber": 1,
  "layout": {
    "structure": "8개 섹션으로 구성된 세로 스크롤 레이아웃. 각 섹션 간 80px 여백으로 여유로운 배치. 전체 높이 약 2800px 예상.",
    "mainContent": "상단 인트로(200px) → 학습목표(300px) → 핵심개념 설명(500px) → 예시/실습(600px) → 심화학습(400px) → 요약/정리(300px) → 평가/퀴즈(400px) → 추가자료(300px)",
    "visualElements": "각 섹션별 일러스트레이션 1개씩, 프로그레스 바, 섹션 구분선, 스크롤 힌트 애니메이션"
  },
  "images": [
    {
      "filename": "1_intro_hero.jpg",
      "description": "페이지 상단 히어로 이미지, 1504x300px, 주제 관련 일러스트",
      "position": "상단 인트로 섹션"
    }
  ]
}
```

### 고정형 레이아웃 예시
```json
{
  "pageNumber": 1,
  "layout": {
    "structure": "5개 섹션을 1000px 높이에 압축 배치. 2열 그리드 구조로 공간 효율 극대화. 모든 콘텐츠가 스크롤 없이 한눈에 보임.",
    "mainContent": "좌측 메인 컬럼(800px): 제목(120px) + 핵심개념(400px) + 실습예제(300px) + 요약(160px). 우측 사이드(680px): 비주얼 자료 + 핵심포인트 카드",
    "visualElements": "좌우 분할, 시각적 계층 구조, 강조 색상으로 중요 정보 하이라이트"
  },
  "images": [
    {
      "filename": "1_main_visual.jpg", 
      "description": "우측 메인 비주얼, 680x600px, 주제 핵심 개념 일러스트",
      "position": "우측 컬럼 상단"
    }
  ]
}
```

## ⚡ 성능 및 최적화

### AI 응답 시간 관리
- **예상 처리 시간**: 30-90초 (페이지별 레이아웃 생성)
- **진행률 표시**: 각 페이지별 생성 상황 표시
- **에러 처리**: API 타임아웃, JSON 파싱 오류 대응

### 토큰 사용량 최적화
- **컨텍스트 압축**: 필수 정보만 프롬프트에 포함
- **템플릿 재사용**: 공통 구조는 템플릿화
- **응답 길이 제한**: 너무 상세한 응답 방지

## 🎯 구현 체크리스트

### 필수 구현 사항
- [ ] Step3LayoutProposal 컴포넌트 생성
- [ ] 레이아웃 모드별 차별화된 UI 표시
- [ ] 페이지별 레이아웃 미리보기 기능
- [ ] 생성 중 로딩 상태 및 진행률 표시
- [ ] 재생성 기능 (개별 페이지/전체)
- [ ] 커스터마이징 옵션 (섹션 순서 변경 등)

### 고급 기능
- [ ] 레이아웃 프리셋 제공
- [ ] 실시간 미리보기
- [ ] 레이아웃 복사/붙여넣기
- [ ] A/B 테스트용 다중 레이아웃 생성

## 📝 결론

Step 3는 전체 워크플로우에서 가장 핵심적인 단계로, 레이아웃 모드별 차별화를 통해 AI 모델의 생성 패턴을 조정하는 것이 핵심입니다. 

**핵심 성공 요소**:
1. **명확한 프롬프트 구조**: 레이아웃 모드별 특화된 키워드 사용
2. **구체적 명세**: 개발자가 바로 구현할 수 있는 상세한 정보
3. **사용자 경험**: 직관적인 미리보기와 수정 기능
4. **성능 최적화**: 적절한 로딩 상태와 에러 처리

이를 통해 사용자가 선택한 레이아웃 모드에 따라 근본적으로 다른 교육 콘텐츠 구조를 생성할 수 있게 됩니다.