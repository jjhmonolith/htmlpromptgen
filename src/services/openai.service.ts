import OpenAI from 'openai';
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';
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
    const targetModel = this.model ?? 'gpt-5';

    const requestPayload: ResponseCreateParamsNonStreaming = {
      model: targetModel,
      input: [
        {
          role: 'user',
          content: 'ping',
          type: 'message'
        }
      ],
      max_output_tokens: 32
    };

    if (targetModel.startsWith('gpt-5')) {
      requestPayload.reasoning = { effort: 'low' };
    }

    try {
      const tempClient = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await tempClient.responses.create(requestPayload as any);
      return typeof response?.id === 'string' && response.id.length > 0;
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
    let maxOutputTokens = 4000;
    if (targetModel?.startsWith('gpt-5-mini')) {
      maxOutputTokens = 1200;
    } else if (targetModel?.startsWith('gpt-5')) {
      maxOutputTokens = 8000;
    }
    const request: any = {
      model: targetModel,
      input: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_output_tokens: maxOutputTokens,
      reasoning: targetModel?.startsWith('gpt-5') ? { effort: 'medium' } : undefined
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
    context?: string,
    options?: {
      model?: string;
      reasoningEffort?: 'low' | 'medium' | 'high';
      maxOutputTokens?: number;
    }
  ) {
    const client = this.getClient();
    const targetModel = options?.model ?? this.model;

    const allowsSampling = this.supportsSamplingControls(targetModel);
    const schemaName = typeof context === 'string'
      ? context.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase() || 'structured_response'
      : 'structured_response';

    const structuredRequest: any = {
      model: targetModel,
      input: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_output_tokens: options?.maxOutputTokens ?? this.resolveMaxOutputTokens(targetModel),
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          schema,
          strict: true
        }
      }
    };

    const reasoningEffort = options?.reasoningEffort ?? (targetModel?.startsWith('gpt-5') ? 'low' : undefined);
    if (reasoningEffort && targetModel?.startsWith('gpt-5')) {
      structuredRequest.reasoning = { effort: reasoningEffort };
    }

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
    const rawContent = parsedJson ? JSON.stringify(parsedJson) : this.extractText(response) || '{}';

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

  private resolveMaxOutputTokens(model?: string | null) {
    const normalized = (model ?? this.model ?? '').toLowerCase();
    if (normalized.startsWith('gpt-5-mini')) {
      return 1200;
    }

    if (normalized.startsWith('gpt-5')) {
      return 6000;
    }

    return 4000;
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
      max_output_tokens: params.max_tokens,
      reasoning: params.model?.startsWith('gpt-5') ? { effort: 'medium' } : undefined
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
      content: message.content,
      type: 'message'
    }));
  }

  private extractText(response: any): string {
    if (!response) {
      return '';
    }

    if (typeof response.output_text === 'string') {
      const trimmed = response.output_text.trim();
      if (trimmed.length > 0 && !this.looksLikeMetaOutput(trimmed)) {
        return trimmed;
      }
    }

    const contentParts = (response.output || [])
      .flatMap((item: any) => item?.content || []);

    const textSegments = contentParts
      .filter((part: any) => part?.type === 'output_text' || part?.type === 'text')
      .map((part: any) => {
        if (typeof part.text === 'string') {
          return part.text;
        }

        if (part?.text?.value) {
          return part.text.value;
        }

        return '';
      })
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

  private looksLikeMetaOutput(value: string): boolean {
    const metaPatterns = [/^resp_[a-z0-9]/i, /^rs_[a-z0-9]/i, /^(response|completed|developer|default|auto|disabled)$/i, /^gpt-\d/i];
    return metaPatterns.some((pattern) => pattern.test(value.trim()));
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
