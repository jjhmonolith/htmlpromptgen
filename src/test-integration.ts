// 새로운 창작 워크플로우 통합 테스트
// 이 파일로 실제 AI 호출 없이 시스템 통합 테스트 가능

import { CreativeWorkflowService } from './services/creative-workflow.service';
import { OpenAIService } from './services/openai.service';
import { ProjectData } from './types/workflow.types';

// 테스트용 Mock OpenAI Service
class MockOpenAIService extends OpenAIService {
  async generateCompletion(prompt: string, options?: any): Promise<string> {
    console.log('🤖 Mock AI 응답 생성 중...');
    console.log(`📝 프롬프트 길이: ${prompt.length}자`);

    // 창의적 브리프 Mock 응답
    return `
**🌟 이 교안이 전하고 싶은 감정과 분위기**
학습자가 이 페이지를 보는 순간 "어? 이거 생각보다 재밌네!"라고 느낄 수 있도록,
지속가능발전이라는 거대한 주제를 친근하고 탐구적인 여행으로 바꿔주세요.

**🎨 색상 감성 이야기**
- **주요 색상**: "지구를 품은 깊은 블루" (신뢰감과 안정감을 주는 네이비 계열)
- **보조 색상**: "희망의 연두빛" (자연스러움과 성장을 의미하는 연한 그린)
- **강조 색상**: "행동의 주황빛" (실천 의지를 불러일으키는 따뜻한 오렌지)

**✨ 타이포그래피의 성격**
- **제목 스타일**: "자신감 있으면서도 친근한" (진중하되 접근하기 쉬운)
- **본문 스타일**: "편안하게 읽히는" (부담스럽지 않은 적당한 무게감)

**🎪 전체적인 컴포넌트 성격**
요소들이 서로 대화하는 것처럼 자연스럽게 연결되되, 각각의 개성도
살아있는 디자인을 만들어주세요. 마치 잘 짜여진 연극처럼 조화롭게!

**🎯 개발자를 위한 창의적 방향성**
이런 점을 고려하시면 더 좋을 것 같아요 -
각 SDG 목표를 작은 카드로 만들되, 호버 시 살짝 떠오르며
관련 이미지나 아이콘이 부드럽게 나타나는 효과는 어떨까요?
`;
  }
}

// 통합 테스트 함수
export async function runIntegrationTest(): Promise<void> {
  console.log('🧪 Creative Workflow Integration Test 시작');

  // Mock 서비스 초기화
  const mockOpenAI = new MockOpenAIService('test-key');
  const creativeWorkflow = new CreativeWorkflowService(mockOpenAI);

  // 테스트 프로젝트 데이터
  const testProject: ProjectData = {
    id: 'test-integration',
    projectTitle: '지속가능한 지구를 위하여',
    targetAudience: '중학생',
    layoutMode: 'fixed',
    contentMode: 'enhanced',
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        topic: '지속가능발전목표란?',
        description: 'SDGs의 개념과 필요성 이해',
        learningObjectives: ['SDG 개념 이해', '필요성 인식', '관심 증대']
      },
      {
        id: 'page-2',
        pageNumber: 2,
        topic: '17가지 목표',
        description: '구체적인 17개 목표 학습',
        learningObjectives: ['목표별 이해', '상호연관성 파악']
      }
    ],
    createdAt: new Date()
  };

  try {
    console.log('🎪 창작 워크플로우 실행 중...');

    // 실제 창작 워크플로우 실행
    const result = await creativeWorkflow.generateCreativeWorkflow(testProject);

    console.log('✅ 워크플로우 성공!');
    console.log(`⏱️ 처리 시간: ${result.processingTime}ms`);
    console.log(`📄 생성된 브리프 길이: ${result.creativeBrief.briefLength}자`);
    console.log(`🎯 예상 토큰: ${result.creativeBrief.estimatedTokens}`);

    // 품질 평가
    const quality = creativeWorkflow.evaluateBriefQuality(result);
    console.log('\n📊 품질 평가 결과:');
    console.log(`- 창의성: ${quality.creativityScore}점`);
    console.log(`- 명확성: ${quality.clarityScore}점`);
    console.log(`- 구현가능성: ${quality.feasibilityScore}점`);
    console.log(`- 영감수준: ${quality.inspirationLevel}점`);
    console.log(`- 종합점수: ${quality.overallScore}점`);

    // 최종 마크다운 브리프 출력
    const markdownBrief = creativeWorkflow.getMarkdownBrief(result);
    console.log('\n📋 생성된 창작 브리프 미리보기:');
    console.log(markdownBrief.substring(0, 500) + '...');

    // 성공 메시지
    console.log('\n🎉 통합 테스트 완료!');
    console.log('✨ 새로운 창작 워크플로우가 정상적으로 동작합니다!');

    return result;

  } catch (error) {
    console.error('❌ 통합 테스트 실패:', error);
    throw error;
  }
}

// 즉시 실행
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}