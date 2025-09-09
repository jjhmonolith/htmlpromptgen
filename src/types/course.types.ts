export interface CourseFormData {
  subject: string;
  targetAudience: string;
  pages: PageContent[];
}

export interface PageContent {
  pageNumber: number;
  title: string;
  content: string;
  objectives?: string[];
  activities?: string[];
}

export interface GeneratedPrompt {
  prompt: string;
  metadata: {
    generatedAt: Date;
    estimatedTokens: number;
    subject: string;
  };
}