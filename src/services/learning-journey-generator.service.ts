import { OpenAIService } from './openai.service';

export interface LearningJourneyData {
  emotionalArc: string;
  learnerPersona: string;
  ahaMoments: string[];
}

export class LearningJourneyGeneratorService {
  constructor(private openAIService: OpenAIService) {}

  async generateLearningJourney(
    projectTitle: string,
    targetAudience: string,
    pages: Array<{ topic: string; description?: string }>
  ): Promise<LearningJourneyData> {
    console.log('🎯 Learning Journey Generator: 시작');

    const prompt = this.createLearningJourneyPrompt(projectTitle, targetAudience, pages);
    const response = await this.openAIService.generateCompletion(prompt, 'Learning Journey Generation');

    return this.parseLearningJourneyResponse(response.content, pages.length);
  }

  private createLearningJourneyPrompt(
    projectTitle: string,
    targetAudience: string,
    pages: Array<{ topic: string; description?: string }>
  ): string {
    const pagesText = pages.map((page, index) =>
      `${index + 1}. ${page.topic}${page.description ? ` - ${page.description}` : ''}`
    ).join('\n');

    return `당신은 교육 심리학과 학습 경험 설계 전문가입니다. 주어진 프로젝트 정보를 바탕으로 학습자의 감정적 여정, 페르소나, 그리고 각 페이지별 '아하!' 순간을 설계해주세요.

## 📋 프로젝트 정보
**제목**: ${projectTitle}
**대상**: ${targetAudience}

## 📖 페이지 구성
${pagesText}

## 🎯 요청사항

다음 3가지 요소를 정확히 생성해주세요:

### 1. 감정적 여정 (Emotional Arc)
학습자가 전체 학습 과정에서 경험할 감정의 흐름을 화살표(→)로 연결하여 작성하세요.
예시: "호기심 → 놀라움 → 이해 → 성취감"

### 2. 학습자 페르소나 (Learner Persona)
${targetAudience}에 해당하는 구체적인 학습자 2-3명의 이름과 상황을 포함한 3-4문장의 페르소나를 작성하세요.
- 이름, 나이, 성향
- 현재 지식 수준
- 학습 스타일과 선호도
- 이 주제에 대한 사전 경험

### 3. 각 페이지별 '아하!' 순간 (Aha Moments)
각 페이지에서 학습자가 경험할 구체적인 깨달음의 순간을 배열로 작성하세요.
- 총 ${pages.length}개의 항목이 필요합니다
- 각 항목은 학습자의 시점에서 작성
- "~라는 사실!", "~라는 발견!", "~의 이해!" 형태로 마무리

## 📝 출력 형식

다음 JSON 형식으로 정확히 응답해주세요:

\`\`\`json
{
  "emotionalArc": "감정1 → 감정2 → 감정3 → 감정4",
  "learnerPersona": "구체적인 학습자 페르소나 설명",
  "ahaMoments": [
    "페이지 1의 아하 순간",
    "페이지 2의 아하 순간",
    ${pages.map((_, i) => `"페이지 ${i + 1}의 아하 순간"`).join(',\n    ')}
  ]
}
\`\`\`

**중요**: JSON 형식을 정확히 지켜주시고, 모든 문자열은 따옴표로 감싸주세요.`;
  }

  private parseLearningJourneyResponse(response: string, expectedAhaMomentsCount: number): LearningJourneyData {
    try {
      // JSON 블록 추출
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSON 블록을 찾을 수 없음');
      }

      const jsonData = JSON.parse(jsonMatch[1]);

      // 데이터 검증 및 정리
      const emotionalArc = typeof jsonData.emotionalArc === 'string'
        ? jsonData.emotionalArc.trim()
        : '호기심 → 이해 → 성취감';

      const learnerPersona = typeof jsonData.learnerPersona === 'string'
        ? jsonData.learnerPersona.trim()
        : `${expectedAhaMomentsCount}개 페이지 학습을 위한 학습자`;

      const ahaMoments = Array.isArray(jsonData.ahaMoments)
        ? jsonData.ahaMoments.slice(0, expectedAhaMomentsCount).map(moment => String(moment).trim())
        : Array.from({ length: expectedAhaMomentsCount }, (_, i) => `페이지 ${i + 1}에서의 새로운 발견!`);

      // 부족한 아하 순간 채우기
      while (ahaMoments.length < expectedAhaMomentsCount) {
        ahaMoments.push(`페이지 ${ahaMoments.length + 1}에서의 깨달음!`);
      }

      console.log('✅ Learning Journey 파싱 완료:', {
        emotionalArc: emotionalArc.substring(0, 50),
        learnerPersona: learnerPersona.substring(0, 50),
        ahaMomentsCount: ahaMoments.length
      });

      return {
        emotionalArc,
        learnerPersona,
        ahaMoments
      };
    } catch (error) {
      console.error('❌ Learning Journey 파싱 실패:', error);

      // 폴백 데이터 생성
      return this.generateFallbackData(expectedAhaMomentsCount);
    }
  }

  private generateFallbackData(pageCount: number): LearningJourneyData {
    return {
      emotionalArc: '호기심 → 탐구 → 이해 → 성취감',
      learnerPersona: '학습에 열정적이고 새로운 지식을 탐구하는 것을 좋아하는 학습자들입니다.',
      ahaMoments: Array.from({ length: pageCount }, (_, i) =>
        `페이지 ${i + 1}에서 새로운 개념을 이해하게 되는 순간!`
      )
    };
  }
}