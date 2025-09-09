import { useState, useCallback } from 'react';
import { CourseFormData } from '../types/course.types';
import { PromptGeneratorService } from '../services/prompt.generator';

interface UsePromptGeneratorResult {
  generatePrompt: (courseData: CourseFormData, apiKey: string) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePromptGenerator = (): UsePromptGeneratorResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = useCallback(async (
    courseData: CourseFormData, 
    apiKey: string
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = new PromptGeneratorService(apiKey);
      const prompt = await generator.generatePrompt(courseData);
      return prompt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프롬프트 생성 실패';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generatePrompt,
    isGenerating,
    error,
    clearError
  };
};