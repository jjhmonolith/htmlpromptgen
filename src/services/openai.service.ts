import OpenAI from 'openai';
import { loadApiKey } from './storage.service';

export class OpenAIService {
  private static instance: OpenAIService | null = null;
  private openai: OpenAI | null = null;
  private model: string = 'gpt-4o-2024-08-06';

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
      // 생성 시 자동으로 저장된 API 키 로드 시도
      OpenAIService.instance.autoInitialize();
    }
    return OpenAIService.instance;
  }

  private autoInitialize(): void {
    const apiKey = loadApiKey();
    if (apiKey) {
      console.log('🔑 저장된 API 키 자동 로드됨');
      this.initialize(apiKey);
    } else {
      console.log('⚠️ 저장된 API 키가 없습니다. API 키를 설정해주세요.');
    }
  }

  initialize(apiKey: string): void {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  // API 키가 새로 설정되었을 때 다시 로드
  reloadApiKey(): boolean {
    const apiKey = loadApiKey();
    if (apiKey) {
      console.log('🔄 API 키 재로드됨');
      this.initialize(apiKey);
      return true;
    }
    return false;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const tempClient = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Simple validation call with minimal token usage
      const response = await tempClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      });
      
      return !!response;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  getClient(): OpenAI {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }
    return this.openai;
  }

  async generateCompletion(prompt: string, context?: string): Promise<{ content: string; usage?: any }> {
    const client = this.getClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // 창의적이고 다양한 결과를 위해 높은 온도
      max_tokens: 4000
    });

    // 토큰 사용량 로그 (개발 환경에서만)
    if (response.usage && context) {
      console.group(`🔥 토큰 사용량 - ${context}`);
      console.log(`📥 입력 토큰: ${response.usage.prompt_tokens?.toLocaleString() || 0}`);
      console.log(`📤 출력 토큰: ${response.usage.completion_tokens?.toLocaleString() || 0}`);
      console.log(`🔢 총 토큰: ${response.usage.total_tokens?.toLocaleString() || 0}`);
      console.groupEnd();
    }

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
    };
  }

  // Structured Output을 사용한 구조화된 응답 생성
  async generateStructuredCompletion(
    prompt: string, 
    schema: any, 
    context?: string
  ) {
    const client = this.getClient();
    
    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // 구조화된 출력은 낮은 temperature 사용
      max_tokens: 4000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "wireframe_response",
          schema: schema,
          strict: true
        }
      }
    });

    // 토큰 사용량 로그 (개발 환경에서만)
    if (response.usage && context) {
      console.group(`🔥 토큰 사용량 - ${context} (Structured)`);
      console.log(`📥 입력 토큰: ${response.usage.prompt_tokens?.toLocaleString() || 0}`);
      console.log(`📤 출력 토큰: ${response.usage.completion_tokens?.toLocaleString() || 0}`);
      console.log(`🔢 총 토큰: ${response.usage.total_tokens?.toLocaleString() || 0}`);
      console.groupEnd();
    }

    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed,
        rawContent: content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Failed to parse structured response:', error);
      throw new Error('Invalid structured response from OpenAI');
    }
  }

  // Step2에서 사용하는 특화된 completion 메서드
  async createCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    top_p: number;
    max_tokens: number;
    stop: string[];
  }) {
    const client = this.getClient();
    
    const response = await client.chat.completions.create({
      model: params.model,
      messages: params.messages as any,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
      stop: params.stop
    });

    return response;
  }
}