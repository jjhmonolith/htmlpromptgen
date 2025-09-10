import { ProjectData } from '../types/workflow.types';

/**
 * 레이아웃 모드별 프롬프트 생성 유틸리티
 * Step 3, 4, 5에서 공통으로 사용
 */
export class LayoutPromptService {
  
  /**
   * 스크롤형 레이아웃 전용 규칙을 프롬프트에 추가
   */
  static getScrollableLayoutRules(): string {
    return `
### 📜 스크롤 가능 레이아웃 규칙

**콘텐츠 우선 접근으로 자연스러운 흐름을 만듭니다.**

1. **가로 고정, 세로 유연**
   * 가로: 1600px 고정
   * 세로: 콘텐츠 양에 따라 자유롭게 확장
   * \`overflow-x: hidden; overflow-y: auto;\` 적용
   * 최소 높이 1000px 유지

2. **콘텐츠 우선 배치**
   * 콘텐츠의 자연스러운 흐름 유지
   * 적절한 여백으로 가독성 확보
   * 섹션 간 충분한 간격 유지 (60-80px)
   * 길이 제한 없이 완전한 정보 전달

3. **반응형 요소 설계**
   * 이미지는 최대 너비 제한 (max-width: 100%)
   * 긴 콘텐츠는 섹션별로 구분
   * 스크롤 진행에 따른 애니메이션 고려 가능
   * 스크롤 인디케이터 포함

**스크롤형 특화 키워드:**
- "자유롭게 확장", "길이 제한 없이", "콘텐츠 양에 따라"
- "콘텐츠 우선", "자연스러운 흐름"
- "충분한 간격", "적절한 여백"
- "스크롤 진행에 따른", "점진적 공개"
`;
  }

  /**
   * 고정형 레이아웃 전용 규칙을 프롬프트에 추가
   */
  static getFixedLayoutRules(): string {
    return `
### 📐 고정 크기 레이아웃 규칙

**정확히 1600x1000px 프레임 안에서 최대 효율을 달성합니다.**

1. **엄격한 크기 제한**
   * 가로 1600px, 세로 1000px 절대 고정
   * \`overflow: hidden\` 적용 - 스크롤 금지
   * 모든 콘텐츠가 프레임 내 완결
   * 픽셀 단위 정확도 필수

2. **공간 효율 극대화**
   * 여백 최소화로 콘텐츠 밀도 극대화
   * 압축적 표현으로 핵심 정보 전달
   * 정보 계층 구조 명확히 설정
   * 불필요한 장식 요소 제거

3. **즉시 이해 가능한 설계**
   * 한 눈에 파악 가능한 레이아웃
   * 강렬한 시각적 임팩트
   * 명확한 정보 우선순위
   * 직관적 네비게이션

**고정형 특화 키워드:**
- "엄격히 고정", "절대 제한", "정확히 1600x1000px"
- "공간 효율", "압축 표현", "여백 최소화"
- "한 화면 완결", "즉시 이해", "픽셀 정확도"
- "최대 밀도", "핵심 집중", "임팩트 우선"
`;
  }

  /**
   * 레이아웃 모드에 따른 적절한 규칙 반환
   */
  static getLayoutRules(layoutMode: 'fixed' | 'scrollable'): string {
    return layoutMode === 'scrollable' 
      ? this.getScrollableLayoutRules()
      : this.getFixedLayoutRules();
  }

  /**
   * 스크롤형 전용 애니메이션 가이드라인
   */
  static getScrollableAnimationGuidelines(): string {
    return `
### 스크롤형 애니메이션 특화 가이드라인

**스크롤 진행에 따른 자연스러운 상호작용**

1. **Intersection Observer 기반 애니메이션**
   - 뷰포트 진입 시: opacity 0→1, translateY(30px→0)
   - 섹션별 순차적 등장 효과
   - 스크롤 속도에 따른 적응적 애니메이션

2. **패럴랙스 효과**
   - 배경 레이어와 콘텐츠 레이어 속도 차이
   - 미묘한 깊이감 연출
   - 과도하지 않은 자연스러운 움직임

3. **프로그레시브 공개**
   - 스크롤 진행에 따른 점진적 정보 공개
   - 스크롤 진행 표시기 (progress indicator)
   - 다음 섹션 미리보기 힌트
`;
  }

  /**
   * 고정형 전용 애니메이션 가이드라인
   */
  static getFixedAnimationGuidelines(): string {
    return `
### 고정형 애니메이션 특화 가이드라인

**제한된 공간에서 최대 임팩트**

1. **즉시 집중 유도**
   - 페이지 로드 시 강렬한 entrance 애니메이션
   - 중요 요소에 attention-grabbing 효과
   - 짧고 임팩트 있는 애니메이션 (0.3-0.5초)

2. **공간 효율적 상호작용**
   - 호버 시 컴팩트한 확장 효과
   - 클릭 피드백의 즉시성
   - 정보 레이어 간 빠른 전환

3. **시각적 계층 강화**
   - 중요도에 따른 애니메이션 차등 적용
   - 정보 우선순위를 시각적으로 강조
   - 사용자 시선 흐름 유도
`;
  }

  /**
   * 레이아웃 모드에 따른 애니메이션 가이드라인 반환
   */
  static getAnimationGuidelines(layoutMode: 'fixed' | 'scrollable'): string {
    return layoutMode === 'scrollable'
      ? this.getScrollableAnimationGuidelines()
      : this.getFixedAnimationGuidelines();
  }

  /**
   * 프로젝트 데이터에서 레이아웃 컨텍스트 정보 추출
   */
  static getLayoutContext(projectData: ProjectData): string {
    const modeText = projectData.layoutMode === 'scrollable' ? '스크롤 가능' : '고정 크기';
    const contentText = projectData.contentMode === 'enhanced' ? 'AI 보강' : '원본 유지';
    
    return `
## 레이아웃 컨텍스트
- **레이아웃 모드**: ${modeText} (${projectData.layoutMode})
- **콘텐츠 모드**: ${contentText} (${projectData.contentMode})
- **페이지 수**: ${projectData.pages.length}개
- **대상 학습자**: ${projectData.targetAudience}
`;
  }
}

export const layoutPromptService = LayoutPromptService;