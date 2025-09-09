import OpenAI from 'openai';
import { CourseFormData } from '../types/course.types';

export class PromptGeneratorService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generatePrompt(courseData: CourseFormData): Promise<string> {
    const systemInstructions = `
당신은 교육 콘텐츠 개발 전문가입니다. 
주어진 교안 정보를 바탕으로 Claude Code가 고품질 교육 자료를 개발할 수 있는 
상세하고 구조화된 프롬프트를 작성해주세요.

생성할 프롬프트는 다음 구조를 따라야 합니다:

1. **목표 설정**
   - 교안의 명확한 학습 목표
   - 기대되는 학습 성과
   
2. **대상 학습자 분석**
   - 학습자 수준과 배경
   - 선수 지식 요구사항
   
3. **콘텐츠 구조**
   - 각 페이지별 세부 내용
   - 논리적 흐름과 연결성
   
4. **교수 방법론**
   - 적절한 교수법 제안
   - 상호작용 요소
   
5. **평가 및 피드백**
   - 학습 확인 방법
   - 형성평가 전략

6. **형식 요구사항**
   - 문서 형식 (마크다운, HTML 등)
   - 시각 자료 요구사항
   - 접근성 고려사항

프롬프트는 Claude Code가 즉시 실행할 수 있도록 
명확하고 구체적이어야 합니다.
`;

    const userInput = this.formatCourseData(courseData);

    try {
      // Note: GPT-5 API structure based on provided documentation
      // Fallback to GPT-4 if GPT-5 is not available yet
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return this.extractPrompt(response);
    } catch (error) {
      console.error('Prompt generation failed:', error);
      throw new Error('프롬프트 생성에 실패했습니다. 다시 시도해주세요.');
    }
  }

  private formatCourseData(courseData: CourseFormData): string {
    const pagesDescription = courseData.pages
      .map(page => `
페이지 ${page.pageNumber}: ${page.title}
내용: ${page.content}
${page.objectives?.length ? `학습목표: ${page.objectives.join(', ')}` : ''}
${page.activities?.length ? `활동: ${page.activities.join(', ')}` : ''}
      `)
      .join('\n---\n');

    return `
교안 개발 요청 정보:

주제: ${courseData.subject}
대상: ${courseData.targetAudience}

페이지별 구성:
${pagesDescription}

위 정보를 바탕으로 Claude Code용 상세 프롬프트를 생성해주세요.
    `;
  }

  private extractPrompt(response: any): string {
    // Handle GPT-4/GPT-3.5 response structure
    if (response.choices && response.choices[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    
    // Handle GPT-5 response structure (based on documentation)
    if (response.output_text) {
      return response.output_text;
    }
    
    // Fallback for different response structures
    if (response.output && Array.isArray(response.output)) {
      const messageOutput = response.output.find((item: any) => item.type === 'message');
      if (messageOutput?.content?.[0]?.text) {
        return messageOutput.content[0].text;
      }
    }
    
    throw new Error('Unexpected response format from OpenAI');
  }
}