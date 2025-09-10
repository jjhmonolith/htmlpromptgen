import OpenAI from 'openai';

export class OpenAIService {
  private static instance: OpenAIService | null = null;
  private openai: OpenAI | null = null;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  initialize(apiKey: string): void {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
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
      temperature: 0.7,
      max_tokens: 8000
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
}