export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OpenAIResponse {
  output_text: string;
  output: Array<{
    id: string;
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
      annotations: any[];
    }>;
  }>;
}