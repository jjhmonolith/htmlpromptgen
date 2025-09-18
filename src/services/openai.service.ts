import OpenAI from 'openai';
import { loadApiKey } from './storage.service';

export class OpenAIService {
  private static instance: OpenAIService | null = null;
  private openai: OpenAI | null = null;
  private model: string = 'gpt-5';

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
      const response = await tempClient.responses.create({
        model: this.model,
        input: [
          {
            role: 'user',
            content: 'ping'
          }
        ],
        max_output_tokens: 8
      });

      return !!response?.id;
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

  async generateCompletion(
    prompt: string,
    context?: string,
    overrideModel?: string
  ): Promise<{ content: string; usage?: any }> {
    const client = this.getClient();
    const targetModel = overrideModel ?? this.model;
    
    const allowsSampling = this.supportsSamplingControls(targetModel);
    const maxOutputTokens = targetModel?.startsWith('gpt-5-mini') ? 1500 : 4000;
    const request: any = {
      model: targetModel,
      input: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_output_tokens: maxOutputTokens
    };

    if (allowsSampling) {
      request.temperature = 0.8; // maintain creativity when supported
    }

    const response: any = await client.responses.create(request);

    // 토큰 사용량 로그 (개발 환경에서만)
    const usage = this.normalizeUsage(response?.usage);
    if (usage && context) {
      console.group(`🔥 토큰 사용량 - ${context}`);
      console.log(`📥 입력 토큰: ${usage.prompt_tokens?.toLocaleString() || 0}`);
      console.log(`📤 출력 토큰: ${usage.completion_tokens?.toLocaleString() || 0}`);
      console.log(`🔢 총 토큰: ${usage.total_tokens?.toLocaleString() || 0}`);
      console.groupEnd();
    }

    return {
      content: this.extractText(response) || '',
      usage
    };
  }

  // Structured Output을 사용한 구조화된 응답 생성
  async generateStructuredCompletion(
    prompt: string, 
    schema: any, 
    context?: string
  ) {
    const client = this.getClient();
    
    const allowsSampling = this.supportsSamplingControls(this.model);
    const structuredRequest: any = {
      model: this.model,
      input: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_output_tokens: 4000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'wireframe_response',
          schema,
          strict: true
        }
      }
    };

    if (allowsSampling) {
      structuredRequest.temperature = 0.3; // encourage deterministic output when supported
    }

    const response: any = await client.responses.create(structuredRequest);

    // 토큰 사용량 로그 (개발 환경에서만)
    const usage = this.normalizeUsage(response?.usage);
    if (usage && context) {
      console.group(`🔥 토큰 사용량 - ${context} (Structured)`);
      console.log(`📥 입력 토큰: ${usage.prompt_tokens?.toLocaleString() || 0}`);
      console.log(`📤 출력 토큰: ${usage.completion_tokens?.toLocaleString() || 0}`);
      console.log(`🔢 총 토큰: ${usage.total_tokens?.toLocaleString() || 0}`);
      console.groupEnd();
    }

    const parsedJson = this.extractJson(response);
    const rawContent = parsedJson ? JSON.stringify(parsedJson) : '{}';

    try {
      const parsed = parsedJson ?? JSON.parse(rawContent);
      return {
        content: parsed,
        rawContent,
        usage
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
    const allowsSampling = this.supportsSamplingControls(params.model);
    const request: any = {
      model: params.model,
      input: this.mapMessages(params.messages),
      max_output_tokens: params.max_tokens
    };

    if (allowsSampling) {
      request.temperature = params.temperature;
      request.top_p = params.top_p;
    }

    const response: any = await client.responses.create(request);

    return this.toChatCompletionLike(response);
  }

  private mapMessages(messages: Array<{ role: string; content: string }>) {
    return messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system' | 'developer',
      content: message.content
    }));
  }

  private extractText(response: any): string {
    if (!response) {
      return '';
    }

    if (typeof response.output_text === 'string') {
      return response.output_text;
    }

    const contentParts = (response.output || [])
      .flatMap((item: any) => item?.content || []);

    const textSegments = contentParts
      .filter((part: any) => part?.type === 'output_text')
      .map((part: any) => part.text || '')
      .join('');

    const jsonSegments = contentParts
      .filter((part: any) => part?.type === 'output_json')
      .map((part: any) => {
        try {
          return JSON.stringify(part.json);
        } catch (error) {
          console.warn('⚠️ Failed to stringify output_json part', error);
          return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const combined = [textSegments, jsonSegments]
      .map(segment => segment?.trim())
      .filter(Boolean)
      .join('\n');

    return combined;
  }

  private extractJson(response: any): any {
    if (!response) {
      return null;
    }

    const jsonPart = (response.output || [])
      .flatMap((item: any) => item?.content || [])
      .find((part: any) => part?.type === 'output_json');

    return jsonPart?.json ?? null;
  }

  private normalizeUsage(usage: any) {
    if (!usage) {
      return undefined;
    }

    const prompt_tokens = usage.prompt_tokens ?? usage.input_tokens ?? undefined;
    const completion_tokens = usage.completion_tokens ?? usage.output_tokens ?? undefined;
    const total_tokens = usage.total_tokens ??
      (typeof prompt_tokens === 'number' && typeof completion_tokens === 'number'
        ? prompt_tokens + completion_tokens
        : undefined);

    return {
      prompt_tokens,
      completion_tokens,
      total_tokens
    };
  }

  private toChatCompletionLike(response: any) {
    const usage = this.normalizeUsage(response?.usage);
    const text = this.extractText(response);

    return {
      id: response?.id,
      model: response?.model || this.model,
      created: response?.created_at ? Math.floor(new Date(response.created_at).getTime() / 1000) : undefined,
      usage,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text
          },
          finish_reason: response?.stop_reason || 'stop'
        }
      ],
      raw: response
    };
  }

  private supportsSamplingControls(model?: string | null) {
    if (!model && !this.model) {
      return true;
    }

    const targetModel = (model ?? this.model ?? '').toLowerCase();
    if (!targetModel) {
      return true;
    }

    return !targetModel.startsWith('gpt-5');
  }
}
