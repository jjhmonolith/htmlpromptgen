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
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
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

  async generateCompletion(prompt: string): Promise<string> {
    const client = this.getClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || '';
  }
}