import { ProjectData, VisualIdentity } from '../../types/workflow.types';

/**
 * Step4 AI 프롬프트 생성 엔진
 *
 * Step3 콘텐츠 영역별 구체적 애니메이션/인터랙션 설계 시스템
 * 페이지 로드 시퀀스와 영역별 상세 연출 설명 중심
 */
export class PromptEngine {
  /**
   * 페이지별 Step4 프롬프트 생성 (새로운 구체적 설계 방식)
   * @param step3PageData Step3 페이지 데이터
   * @param projectData 프로젝트 기본 정보
   * @param visualIdentity Step2 비주얼 아이덴티티
   * @param contentMode 콘텐츠 모드 ('restricted' | 'enhanced')
   * @returns 구체적 애니메이션/인터랙션 설계 프롬프트
   */
  generatePagePrompt(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity,
    contentMode: 'restricted' | 'enhanced' = 'enhanced'
  ): string {
    const variables = this.extractVariables(step3PageData, projectData, visualIdentity);

    return this.generateDetailedAnimationPrompt(variables, projectData.layoutMode, contentMode);
  }

  /**
   * 새로운 구체적 애니메이션 설계 프롬프트
   */
  private generateDetailedAnimationPrompt(
    variables: any,
    layoutMode: 'fixed' | 'scrollable',
    contentMode: 'restricted' | 'enhanced'
  ): string {
    const layoutDescription = layoutMode === 'fixed' ? '1600×1000px 고정 화면' : '1600px 너비 스크롤 가능';
    const modeDescription = contentMode === 'enhanced' ? 'AI 보강 모드 (창의적 연출 허용)' : '원본 유지 모드 (주어진 요소만 활용)';

    return `당신은 최고 수준의 UI/UX 및 학습 경험 디자이너입니다. Step3에서 구성한 교육 콘텐츠 페이지의 각 영역별로 구체적이고 상세한 애니메이션과 상호작용을 설계해주세요.

### 📋 설계 요구사항
- **레이아웃**: ${layoutDescription}
- **설계 모드**: ${modeDescription}
- **접근성**: 모든 텍스트 ≥18pt, 색상 대비 4.5:1 이상, 키보드 네비게이션 지원
- **성능**: transform/opacity 기반, will-change 최적화, 동시 애니메이션 ≤3개

### ✨ 비주얼 아이덴티티 (반드시 준수)
- **분위기**: ${variables.moodAndTone}
- **주요 색상**: ${variables.primaryColor}
- **컴포넌트 스타일**: ${variables.componentStyle}

### 📍 페이지 정보
- **프로젝트**: ${variables.projectTitle}
- **대상 학습자**: ${variables.targetAudience}
- **현재 페이지**: ${variables.pageNumber}페이지 - ${variables.pageTopic}

### 📝 페이지 구성 요소 (Step3에서 제공된 콘텐츠)
${variables.structureSummary}

${variables.contentAnalysisSection}

### 🎬 설계 가이드라인

**1. 페이지 최초 로드 시퀀스 (0-2초)**
- 페이지 진입 시 각 콘텐츠 영역이 등장하는 순서와 타이밍을 구체적으로 명시
- 시간축별 애니메이션 시퀀스 (예: 0-200ms, 200-600ms, 600-1000ms...)
- 각 요소의 진입 방향, 지속시간, 이징 함수 포함
- 학습 흐름에 맞는 시선 유도 효과

**2. 콘텐츠 영역별 상세 애니메이션**
Step3에서 제공된 각 콘텐츠 영역(섹션, 카드, 이미지, 텍스트 블록 등)에 대해:
- 진입 애니메이션 (언제, 어떻게 나타나는지)
- 대기 상태 애니메이션 (필요시 미세한 루프 모션)
- 강조 애니메이션 (주의 집중이 필요한 시점)
- 각 애니메이션이 학습에 어떻게 도움이 되는지 간단한 이유 설명

**3. 상호작용 상세 설계**
각 인터랙티브 요소별로:
- **Hover**: 마우스 오버 시 반응 (시각적 변화, 애니메이션)
- **Focus**: 키보드 포커스 시 접근성 표시
- **Click/Tap**: 클릭 시 피드백 및 상태 변화
- **Disabled**: 비활성 상태 표현
- 모든 상호작용에 대한 교육적 목적 설명

**4. 접근성 및 성능 고려사항**
- prefers-reduced-motion 대응 방안
- 키보드 네비게이션 순서 및 포커스 표시
- 스크린 리더 지원 (ARIA 라벨, live region)
- 성능 최적화 방법

### 🚫 절대 금지사항
- 다른 페이지로의 네비게이션/링크 언급 금지
- Step3에서 제공되지 않은 새로운 콘텐츠 추가 금지
- 텍스트 크기 18pt 미만으로 축소 금지
- 과도한 루프 애니메이션으로 인한 산만함 금지

### 📤 출력 형식
다음과 같은 구조의 상세한 텍스트로 작성해주세요:

**### 애니메이션 및 상호작용**
- **애니메이션**: [전체 애니메이션 설계 개요와 목적]

**1) 페이지 최초 로드 시퀀스(0-[총시간], [이징함수])**
- [시간대별 상세한 애니메이션 설명]
- [각 요소별 진입 방식과 이유]

**2) [콘텐츠 영역명] 애니메이션**
- [해당 영역의 상세한 애니메이션 설명]
- [교육적 목적과 효과]

**3) [다른 콘텐츠 영역명] 애니메이션**
- [반복...]

**- **상호작용**: [전체 상호작용 설계 개요]

**A) [요소별] 상호작용**
- [Hover/Focus/Click 등 상세 반응]
- [접근성 고려사항]

**B) [다른 요소별] 상호작용**
- [반복...]

**C) 접근성 및 성능 최적화**
- [키보드 네비게이션, 감속 모드 등]

모든 애니메이션과 상호작용은 학습 효과를 높이고 사용자 경험을 개선하는 구체적인 목적을 가져야 합니다.`;
  }


  /**
   * 변수 추출 및 바인딩
   */
  private extractVariables(
    step3PageData: any,
    projectData: ProjectData,
    visualIdentity: VisualIdentity
  ): any {
    const moodAndTone = Array.isArray(visualIdentity.moodAndTone)
      ? visualIdentity.moodAndTone.join(', ')
      : visualIdentity.moodAndTone;

    const primaryColor = visualIdentity.colorPalette?.primary || '#3B82F6';
    const componentStyle = visualIdentity.componentStyle || '모던하고 깔끔한 스타일';

    // Step3 결과에서 구조 요약 생성
    const structureSummary = step3PageData.fullDescription
      ? `${step3PageData.fullDescription.substring(0, 300)}...`
      : `페이지 제목: ${step3PageData.pageTitle || step3PageData.topic}, 교육 콘텐츠 구성`;

    const projectTitle = projectData.projectTitle;
    const targetAudience = projectData.targetAudience;
    const pageNumber = step3PageData.pageNumber;
    const pageTopic = step3PageData.pageTitle || step3PageData.topic;

    // contentAnalysis 처리
    let contentAnalysisSection = '';
    if (step3PageData.contentAnalysis) {
      const outlineCsv = step3PageData.contentAnalysis.outline
        ? step3PageData.contentAnalysis.outline.join(', ')
        : '기본 구성';

      const estimatedSections = step3PageData.contentAnalysis.estimatedSections || 3;

      const densityScore = step3PageData.contentAnalysis.densityScore || 0.6;
      const densityLabel = densityScore >= 0.8 ? '높음 (분할 권장)'
        : densityScore >= 0.6 ? '적정' : '여유';

      contentAnalysisSection = `### 📊 콘텐츠 구성 정보
- 주요 내용: ${outlineCsv}
- 섹션 수: ${estimatedSections}개
- 콘텐츠 밀도: ${densityLabel}`;
    }

    return {
      moodAndTone,
      primaryColor,
      componentStyle,
      structureSummary,
      projectTitle,
      targetAudience,
      pageNumber,
      pageTopic,
      contentAnalysisSection
    };
  }

}