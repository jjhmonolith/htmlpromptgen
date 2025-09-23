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
    const response = await this.openAIService.generateCompletion(
      prompt,
      'Learning Journey Generation',
      'gpt-5-mini'
    );

    return this.parseLearningJourneyResponse(response.content, pages.length);
  }

  private createLearningJourneyPrompt(
    projectTitle: string,
    targetAudience: string,
    pages: Array<{ topic: string; description?: string }>
  ): string {
    const pagesText = pages
      .map((page, index) => `${index + 1}. ${page.topic}${page.description ? ` - ${page.description}` : ''}`)
      .join('\n');

    return `당신은 교육 심리학 기반 학습 경험 설계자입니다. 아래 정보를 참고해 간결한 학습 여정 요약 JSON을 반환하세요.

프로젝트: ${projectTitle}
대상 학습자: ${targetAudience}
페이지 개요:
${pagesText}

출력 규칙:
- emotionalArc: 학습 감정 3~4단계를 "감정A → 감정B" 형식 하나의 문자열(30자 이내)
- learnerPersona: 대표 학습자 1명을 2문장 이하(총 80자 이내)로 묘사
- ahaMoments: 페이지 수와 동일한 항목 수, 각 항목 1인칭 40자 이하 문장, 느낌표로 끝맺음
- JSON 외 텍스트, 주석, 코드 블록 금지

출력 예시:
{"emotionalArc":"호기심 → 이해 → 자신감","learnerPersona":"...","ahaMoments":["...!","...!"]}`;
  }

  private parseLearningJourneyResponse(response: string, expectedAhaMomentsCount: number): LearningJourneyData {
    try {
      // JSON 블록 추출
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

      const jsonSource = jsonMatch
        ? jsonMatch[1]
        : this.extractJsonFromResponse(response);

      if (!jsonSource) {
        throw new Error('JSON 블록을 찾을 수 없음');
      }

      const jsonData = JSON.parse(jsonSource);

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

  private extractJsonFromResponse(response: string): string | null {
    const trimmed = response.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return null;
  }
}